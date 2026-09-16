export interface SessionData {
  userId: string;
  email: string;
  exp: number;
}

/**
 * Parse a base64-encoded session cookie.
 * Returns null if missing, malformed, or expired.
 */
export function parseSession(cookie: string | undefined): SessionData | null {
  if (!cookie) return null;

  try {
    const data = JSON.parse(Buffer.from(cookie, "base64").toString());
    if (data.exp && data.exp > Date.now()) {
      return data as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Encode session payload into a base64 cookie value.
 */
export function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}
