/**
 * Rate limiting for the public chat endpoint, backed by Postgres.
 *
 * There is no Upstash/Redis client in this project, so counters live in the
 * `rate_limits` table (migration 017) and the increment-and-decide step runs
 * inside the `check_rate_limit` SQL function to stay atomic under concurrency.
 */

import { createServerClient } from "@/lib/supabase/client";

export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const DEFAULT_WIDGET_LIMIT_PER_MINUTE = 60;
export const DEFAULT_IP_LIMIT_PER_MINUTE = 20;

export type RateLimitScope = "widget" | "ip";

export interface RateLimitVerdict {
  allowed: boolean;
  count: number;
  retryAfterSeconds: number;
}

export interface RateLimitRejection extends RateLimitVerdict {
  allowed: false;
  scope: RateLimitScope;
  limit: number;
}

/** Read a positive integer limit from the environment, falling back if unset or junk. */
export function readLimitFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    console.warn(`[rate-limit] ${name}="${raw}" is not a positive integer; using ${fallback}`);
    return fallback;
  }

  return parsed;
}

/**
 * Sliding window approximation, mirroring what check_rate_limit does in SQL.
 * The previous window is weighted by how much of it is still inside the
 * trailing window, so the limit does not reset hard on the boundary.
 */
export function slidingWindowCount(
  currentCount: number,
  previousCount: number,
  elapsedSeconds: number,
  windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS,
): number {
  const elapsedRatio = Math.min(Math.max(elapsedSeconds / windowSeconds, 0), 1);
  return currentCount + previousCount * (1 - elapsedRatio);
}

/** Best-effort client IP, taking the first hop of x-forwarded-for. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Count one request against a bucket.
 *
 * Fails open: if the counter store is unreachable the request is allowed and
 * the error is logged, because losing the database should not also take chat
 * offline for everyone.
 */
export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS,
): Promise<RateLimitVerdict> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket_key: bucketKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("check_rate_limit returned no rows");

    return {
      allowed: Boolean(row.allowed),
      count: Number(row.current_count) || 0,
      retryAfterSeconds: Number(row.retry_after_seconds) || windowSeconds,
    };
  } catch (error) {
    console.error(`[rate-limit] check failed for "${bucketKey}", allowing request:`, error);
    return { allowed: true, count: 0, retryAfterSeconds: 0 };
  }
}

/**
 * Apply both chat limits.
 *
 * The IP bucket is checked first so a single flooding client is stopped before
 * the route touches any other table, then the widget bucket catches
 * distributed traffic against one customer's key.
 *
 * Returns null when the request may proceed, or the rejection that stopped it.
 */
export async function enforceChatRateLimits(
  widgetKey: string,
  ip: string,
): Promise<RateLimitRejection | null> {
  const widgetLimit = readLimitFromEnv(
    "CHAT_RATE_LIMIT_PER_WIDGET_PER_MIN",
    DEFAULT_WIDGET_LIMIT_PER_MINUTE,
  );
  const ipLimit = readLimitFromEnv(
    "CHAT_RATE_LIMIT_PER_IP_PER_MIN",
    DEFAULT_IP_LIMIT_PER_MINUTE,
  );

  const checks: Array<{ scope: RateLimitScope; bucket: string; limit: number }> = [
    { scope: "ip", bucket: `chat:ip:${ip}`, limit: ipLimit },
    { scope: "widget", bucket: `chat:widget:${widgetKey}`, limit: widgetLimit },
  ];

  for (const check of checks) {
    const verdict = await checkRateLimit(check.bucket, check.limit);
    if (!verdict.allowed) {
      return { ...verdict, allowed: false, scope: check.scope, limit: check.limit };
    }
  }

  return null;
}
