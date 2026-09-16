/**
 * The one place outbound HTTP gets a deadline.
 *
 * Every external call in this codebase used bare fetch() with no
 * AbortController, so a slow or black-holed host would hang until the platform
 * killed the whole request. That turned one unreachable third party into a
 * stuck document or a 504 with nothing useful in it.
 */

export const DEFAULT_TIMEOUT_MS = 10_000;

export type ExternalErrorKind = "timeout" | "network" | "http";

/**
 * A failure talking to something outside this app, carrying enough structure
 * for callers to tell "they were slow" from "they said no".
 */
export class ExternalRequestError extends Error {
  readonly kind: ExternalErrorKind;
  readonly service: string;
  readonly url: string;
  readonly status?: number;
  readonly timeoutMs?: number;

  constructor(params: {
    kind: ExternalErrorKind;
    service: string;
    url: string;
    message: string;
    status?: number;
    timeoutMs?: number;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = "ExternalRequestError";
    this.kind = params.kind;
    this.service = params.service;
    this.url = params.url;
    this.status = params.status;
    this.timeoutMs = params.timeoutMs;
  }

  /** True when the remote side never answered in time. */
  get isTimeout(): boolean {
    return this.kind === "timeout";
  }
}

export function isExternalRequestError(error: unknown): error is ExternalRequestError {
  return error instanceof ExternalRequestError;
}

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Deadline for the whole request. Defaults to DEFAULT_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Name used in errors and logs, e.g. "github". */
  service?: string;
}

/** Strip credentials and query from a URL before it reaches a log line. */
function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * fetch() with a deadline. Throws ExternalRequestError on timeout or network
 * failure; a non-2xx response is returned as normal for the caller to inspect.
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, service = "external", signal, ...init } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Honour a caller-supplied signal alongside our own deadline.
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new ExternalRequestError({
        kind: "timeout",
        service,
        url: safeUrl(url),
        timeoutMs,
        message: `${service} did not respond within ${timeoutMs}ms (${safeUrl(url)})`,
        cause: error,
      });
    }

    throw new ExternalRequestError({
      kind: "network",
      service,
      url: safeUrl(url),
      message: `Could not reach ${service} at ${safeUrl(url)}`,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
