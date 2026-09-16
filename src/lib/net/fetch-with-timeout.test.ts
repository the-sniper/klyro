import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import {
  ExternalRequestError,
  fetchWithTimeout,
  isExternalRequestError,
} from "./fetch-with-timeout";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith("/slow")) {
      // Never responds: stands in for a black-holed host.
      return;
    }

    if (req.url === "/boom") {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("upstream unavailable");
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no server address");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  });
});

describe("fetchWithTimeout", () => {
  it("returns the response when the host answers in time", async () => {
    const res = await fetchWithTimeout(`${baseUrl}/fast`, { timeoutMs: 2000 });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("throws a typed timeout error instead of hanging", async () => {
    const startedAt = Date.now();

    await expect(
      fetchWithTimeout(`${baseUrl}/slow`, { timeoutMs: 120, service: "url-scraper" }),
    ).rejects.toBeInstanceOf(ExternalRequestError);

    // It gave up near the deadline rather than waiting on the socket.
    expect(Date.now() - startedAt).toBeLessThan(2000);
  });

  it("labels the timeout with its service, deadline and a redacted url", async () => {
    try {
      await fetchWithTimeout(`${baseUrl}/slow?token=secret`, {
        timeoutMs: 120,
        service: "github",
      });
      throw new Error("expected a timeout");
    } catch (error) {
      if (!isExternalRequestError(error)) throw error;

      expect(error.kind).toBe("timeout");
      expect(error.isTimeout).toBe(true);
      expect(error.service).toBe("github");
      expect(error.timeoutMs).toBe(120);
      expect(error.url).not.toContain("secret");
      expect(error.message).toContain("120ms");
    }
  });

  it("returns non-2xx responses rather than throwing", async () => {
    const res = await fetchWithTimeout(`${baseUrl}/boom`, { timeoutMs: 2000 });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(503);
  });

  it("reports an unreachable host as a network error", async () => {
    try {
      // Reserved TEST-NET-1 address, refused fast enough for a unit test.
      await fetchWithTimeout("http://127.0.0.1:1/nope", {
        timeoutMs: 2000,
        service: "calendly",
      });
      throw new Error("expected a network error");
    } catch (error) {
      if (!isExternalRequestError(error)) throw error;

      expect(error.kind).toBe("network");
      expect(error.isTimeout).toBe(false);
      expect(error.service).toBe("calendly");
    }
  });

  it("honours a caller-supplied abort signal", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);

    await expect(
      fetchWithTimeout(`${baseUrl}/slow`, {
        timeoutMs: 30_000,
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(ExternalRequestError);
  });
});
