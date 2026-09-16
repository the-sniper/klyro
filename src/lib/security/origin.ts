/**
 * Origin checks for the public chat endpoint.
 *
 * A widget with allowed_domains configured is meant to be usable only from
 * those domains. The check has to fail closed on a missing Origin header,
 * otherwise any server-side caller (curl, a script) bypasses it entirely just
 * by not sending one.
 */

export type OriginRejection = "missing_origin" | "domain_not_allowed";

export type OriginDecision =
  | { allowed: true }
  | { allowed: false; reason: OriginRejection };

/** Domains configured on the widget, normalised and with blanks dropped. */
function normalizeDomains(allowedDomains: string[] | null | undefined): string[] {
  if (!Array.isArray(allowedDomains)) return [];
  return allowedDomains
    .filter((domain): domain is string => typeof domain === "string")
    .map((domain) => domain.trim().toLowerCase().replace(/^\*\./, ""))
    .filter((domain) => domain.length > 0);
}

/** True when the widget places no restriction on where it can be embedded. */
export function isUnrestricted(allowedDomains: string[] | null | undefined): boolean {
  return normalizeDomains(allowedDomains).length === 0;
}

/**
 * Decide whether a request carrying `origin` may use a widget restricted to
 * `allowedDomains`. Subdomains of an allowed domain are allowed.
 */
export function checkOrigin(
  origin: string | null | undefined,
  allowedDomains: string[] | null | undefined,
): OriginDecision {
  const domains = normalizeDomains(allowedDomains);

  // No restriction configured: anything goes, same as before.
  if (domains.length === 0) return { allowed: true };

  // Restricted widget with no Origin header: fail closed.
  if (!origin) return { allowed: false, reason: "missing_origin" };

  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    // A malformed Origin used to throw and surface as a 500.
    return { allowed: false, reason: "domain_not_allowed" };
  }

  if (!host) return { allowed: false, reason: "domain_not_allowed" };

  const isAllowed = domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );

  return isAllowed ? { allowed: true } : { allowed: false, reason: "domain_not_allowed" };
}
