import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// ────────────────────────────────────────────────────────────
// Public route definitions
// ────────────────────────────────────────────────────────────

/** Exact-match public page paths (no trailing slash). */
const PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

/** Pages that should redirect authenticated users to /videos. */
const AUTH_ONLY_PAGES = new Set(["/login", "/register"]);

/**
 * API route prefixes / exact paths that must remain accessible without a
 * session.  Ordering: most specific first → prefix last.
 *
 * Why each entry is public:
 *  - /api/auth    → NextAuth handlers (signIn, callback, csrf, etc.)
 *  - /api/auth/*  → register, forgot-password, reset-password
 *  - /api/v1/health → infrastructure health-check (uptime monitors)
 *  - /api/docs    → Scalar API reference UI (dev convenience)
 *  - /api/openapi → OpenAPI JSON spec (consumed by /api/docs)
 */
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/auth"];
const PUBLIC_API_EXACT = new Set([
  "/api/v1/health",
  "/api/docs",
  "/api/openapi",
]);

/**
 * Determines whether a request path is public (no session required).
 *
 * Decision order:
 *  1. Exact page match  → public
 *  2. Exact API match   → public
 *  3. API prefix match  → public
 *  4. Everything else   → private (requires session)
 */
function isPublicRoute(pathname: string): boolean {
  // 1. Public pages
  if (PUBLIC_PAGES.has(pathname)) return true;

  // 2. Public API exact paths
  if (PUBLIC_API_EXACT.has(pathname)) return true;

  // 3. Public API prefixes
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return true;
  }

  return false;
}

// ────────────────────────────────────────────────────────────
// Auth config (Edge-compatible — no Prisma / Node-only deps)
// ────────────────────────────────────────────────────────────

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // ── Public routes ──────────────────────────────────
      if (isPublicRoute(pathname)) {
        // Redirect already-authenticated users away from login/register
        if (isLoggedIn && AUTH_ONLY_PAGES.has(pathname)) {
          return Response.redirect(new URL("/videos", nextUrl));
        }
        return true;
      }

      // ── Private routes ─────────────────────────────────
      // For API routes, return a 401 JSON response instead of redirect
      if (!isLoggedIn && pathname.startsWith("/api/")) {
        return Response.json(
          { error: "No autorizado" },
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // For pages, returning false triggers redirect to signIn page
      if (!isLoggedIn) return false;

      return true;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
} satisfies NextAuthConfig;
