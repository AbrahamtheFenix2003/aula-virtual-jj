/**
 * Utility functions for URL validation and sanitization.
 * Prevents open-redirect vulnerabilities by ensuring URLs
 * only point to safe, internal routes.
 */

const DEFAULT_REDIRECT = "/videos";

/** Auth routes that would cause redirect loops */
const AUTH_LOOP_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Sanitizes a callback URL to prevent open-redirect attacks.
 *
 * Rules:
 * - Must be a relative path starting with `/`
 * - Rejects absolute URLs (http://, https://, protocol-relative //)
 * - Rejects custom schemes (javascript:, data:, etc.)
 * - Rejects auth routes that would cause redirect loops
 * - Falls back to a safe default when the URL is invalid
 *
 * @param url - The raw callback URL from user input (query string, etc.)
 * @param fallback - Safe fallback URL (defaults to "/videos")
 * @returns A sanitized, safe internal path
 */
export function sanitizeCallbackUrl(
  url: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // Must start with exactly one "/" (reject protocol-relative "//")
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Reject any scheme pattern (e.g. javascript:, data:, vbscript:)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/i.test(trimmed)) {
    return fallback;
  }

  // Reject encoded characters that could bypass checks (%2F = /, %5C = \)
  // Decode first, then re-validate to catch double-encoding tricks
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Malformed URI — reject
    return fallback;
  }

  // After decoding, re-check for protocol-relative or absolute URLs
  if (decoded.startsWith("//") || /^[a-zA-Z][a-zA-Z\d+\-.]*:/i.test(decoded)) {
    return fallback;
  }

  // Reject backslash variants (some browsers treat `\/` as `//`)
  if (decoded.includes("\\")) {
    return fallback;
  }

  // Reject auth routes that would create redirect loops
  const pathOnly = decoded.split("?")[0].split("#")[0].toLowerCase();
  if (AUTH_LOOP_ROUTES.some((route) => pathOnly === route || pathOnly.startsWith(route + "/"))) {
    return fallback;
  }

  return trimmed;
}
