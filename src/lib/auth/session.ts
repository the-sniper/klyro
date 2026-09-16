/**
 * Signed session cookies.
 *
 * A token is `<base64url(payload)>.<base64url(signature)>`, where the
 * signature is HMAC-SHA256 over the encoded payload keyed by SESSION_SECRET.
 * Payloads are readable but not forgeable: changing a byte invalidates the
 * signature.
 *
 * Only Web Crypto and Web base64 primitives are used here (no node:crypto, no
 * Buffer) so the same module runs unchanged in the Edge middleware runtime, in
 * Node route handlers, and under vitest.
 */

export interface SessionData {
  userId: string;
  email: string;
  /** Expiry as epoch milliseconds. */
  exp: number;
}

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Minimum secret length we are willing to key an HMAC with. */
const MIN_SECRET_LENGTH = 32;

/** Cookie attributes shared by every route that sets the session cookie. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode base64url to bytes.
 *
 * Returns a Uint8Array, not a bare ArrayBuffer: the Edge runtime's SubtleCrypto
 * rejects an ArrayBuffer with "3rd argument is not instance of ArrayBuffer,
 * Buffer, TypedArray, or DataView", while Node's WebCrypto accepts it. A
 * TypedArray is accepted by both.
 */
function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

let cachedKey: { secret: string; key: CryptoKey } | null = null;
let warnedAboutSecret = false;

/**
 * Import the HMAC key from SESSION_SECRET, or return null if it is unusable.
 * Callers treat null as "nobody is authenticated" so a misconfigured
 * deployment fails closed rather than trusting unsigned input.
 */
async function getKey(): Promise<CryptoKey | null> {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    if (!warnedAboutSecret) {
      warnedAboutSecret = true;
      console.error(
        `[auth] SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters; all sessions will be rejected.`,
      );
    }
    return null;
  }

  if (cachedKey?.secret === secret) return cachedKey.key;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  cachedKey = { secret, key };
  return key;
}

/**
 * Sign a session payload into a cookie value.
 * Throws if SESSION_SECRET is not configured, so a broken deployment fails
 * loudly at login rather than silently issuing worthless cookies.
 */
export async function encodeSession(data: SessionData): Promise<string> {
  const key = await getKey();
  if (!key) {
    throw new Error(
      `SESSION_SECRET is not configured (must be at least ${MIN_SECRET_LENGTH} characters)`,
    );
  }

  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(data)));
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/** Mint a signed token for a user, expiring SESSION_MAX_AGE_SECONDS from now. */
export function createSessionToken(userId: string, email: string): Promise<string> {
  return encodeSession({
    userId,
    email,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
}

/**
 * Verify and decode a session cookie.
 * Returns null if the cookie is missing, unsigned, tampered with, signed by a
 * different secret, structurally wrong, or expired.
 */
export async function parseSession(
  cookie: string | undefined,
): Promise<SessionData | null> {
  if (!cookie) return null;

  const key = await getKey();
  if (!key) return null;

  const separator = cookie.indexOf(".");
  // Legacy unsigned base64(JSON) cookies have no separator and are rejected here.
  if (separator <= 0) return null;

  const payload = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);
  if (!signature) return null;

  try {
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      encoder.encode(payload),
    );
    if (!isValid) return null;

    const data = JSON.parse(decoder.decode(base64UrlToBytes(payload)));

    if (
      typeof data?.userId !== "string" ||
      typeof data?.email !== "string" ||
      typeof data?.exp !== "number"
    ) {
      return null;
    }

    if (data.exp <= Date.now()) return null;

    return { userId: data.userId, email: data.email, exp: data.exp };
  } catch {
    return null;
  }
}
