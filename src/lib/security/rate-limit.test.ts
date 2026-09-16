import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createServerClient: () => ({ rpc }),
}));

import {
  checkRateLimit,
  clientIpFrom,
  DEFAULT_IP_LIMIT_PER_MINUTE,
  DEFAULT_WIDGET_LIMIT_PER_MINUTE,
  enforceChatRateLimits,
  readLimitFromEnv,
  slidingWindowCount,
} from "./rate-limit";

function rpcRow(allowed: boolean, count: number, retryAfter = 30) {
  return {
    data: [{ allowed, current_count: count, retry_after_seconds: retryAfter }],
    error: null,
  };
}

describe("slidingWindowCount", () => {
  it("counts the full previous window at the start of a new one", () => {
    expect(slidingWindowCount(1, 60, 0, 60)).toBe(61);
  });

  it("decays the previous window as the current one elapses", () => {
    expect(slidingWindowCount(10, 60, 30, 60)).toBe(40);
  });

  it("drops the previous window once the current one is over", () => {
    expect(slidingWindowCount(10, 60, 60, 60)).toBe(10);
  });

  it("clamps out-of-range elapsed values", () => {
    expect(slidingWindowCount(10, 60, 900, 60)).toBe(10);
    expect(slidingWindowCount(10, 60, -5, 60)).toBe(70);
  });
});

describe("readLimitFromEnv", () => {
  afterEach(() => {
    delete process.env.TEST_LIMIT;
    vi.restoreAllMocks();
  });

  it("falls back when unset or empty", () => {
    expect(readLimitFromEnv("TEST_LIMIT", 60)).toBe(60);
    process.env.TEST_LIMIT = "";
    expect(readLimitFromEnv("TEST_LIMIT", 60)).toBe(60);
  });

  it("reads a positive integer", () => {
    process.env.TEST_LIMIT = "5";
    expect(readLimitFromEnv("TEST_LIMIT", 60)).toBe(5);
  });

  it("falls back on junk, zero and negatives", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const bad of ["abc", "0", "-3", "1.5"]) {
      process.env.TEST_LIMIT = bad;
      expect(readLimitFromEnv("TEST_LIMIT", 60)).toBe(60);
    }
  });
});

describe("clientIpFrom", () => {
  it("takes the first hop of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" });
    expect(clientIpFrom(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip then to unknown", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes the bucket, limit and window to the SQL function", async () => {
    rpc.mockResolvedValue(rpcRow(true, 3));

    const verdict = await checkRateLimit("chat:ip:203.0.113.5", 20);

    expect(rpc).toHaveBeenCalledWith("check_rate_limit", {
      p_bucket_key: "chat:ip:203.0.113.5",
      p_limit: 20,
      p_window_seconds: 60,
    });
    expect(verdict).toEqual({ allowed: true, count: 3, retryAfterSeconds: 30 });
  });

  it("reports a rejection with its retry-after", async () => {
    rpc.mockResolvedValue(rpcRow(false, 61, 12));

    expect(await checkRateLimit("chat:widget:abc", 60)).toEqual({
      allowed: false,
      count: 61,
      retryAfterSeconds: 12,
    });
  });

  it("fails open when the counter store errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: new Error("connection refused") });

    expect(await checkRateLimit("chat:widget:abc", 60)).toEqual({
      allowed: true,
      count: 0,
      retryAfterSeconds: 0,
    });
  });
});

describe("enforceChatRateLimits", () => {
  beforeEach(() => {
    rpc.mockReset();
    delete process.env.CHAT_RATE_LIMIT_PER_WIDGET_PER_MIN;
    delete process.env.CHAT_RATE_LIMIT_PER_IP_PER_MIN;
  });

  it("returns null and checks both buckets when under both limits", async () => {
    rpc.mockResolvedValue(rpcRow(true, 1));

    expect(await enforceChatRateLimits("widget-key", "203.0.113.5")).toBeNull();
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_bucket_key: "chat:ip:203.0.113.5",
      p_limit: DEFAULT_IP_LIMIT_PER_MINUTE,
    });
    expect(rpc.mock.calls[1][1]).toMatchObject({
      p_bucket_key: "chat:widget:widget-key",
      p_limit: DEFAULT_WIDGET_LIMIT_PER_MINUTE,
    });
  });

  it("short-circuits on the IP bucket without touching the widget bucket", async () => {
    rpc.mockResolvedValue(rpcRow(false, 21, 9));

    expect(await enforceChatRateLimits("widget-key", "203.0.113.5")).toEqual({
      allowed: false,
      scope: "ip",
      limit: DEFAULT_IP_LIMIT_PER_MINUTE,
      count: 21,
      retryAfterSeconds: 9,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects on the widget bucket when only that one is exhausted", async () => {
    rpc
      .mockResolvedValueOnce(rpcRow(true, 5))
      .mockResolvedValueOnce(rpcRow(false, 61, 44));

    expect(await enforceChatRateLimits("widget-key", "203.0.113.5")).toMatchObject({
      allowed: false,
      scope: "widget",
      retryAfterSeconds: 44,
    });
  });

  it("honours environment overrides", async () => {
    process.env.CHAT_RATE_LIMIT_PER_WIDGET_PER_MIN = "7";
    process.env.CHAT_RATE_LIMIT_PER_IP_PER_MIN = "3";
    rpc.mockResolvedValue(rpcRow(true, 1));

    await enforceChatRateLimits("widget-key", "203.0.113.5");

    expect(rpc.mock.calls[0][1]).toMatchObject({ p_limit: 3 });
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_limit: 7 });

    delete process.env.CHAT_RATE_LIMIT_PER_WIDGET_PER_MIN;
    delete process.env.CHAT_RATE_LIMIT_PER_IP_PER_MIN;
  });
});
