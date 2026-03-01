import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

/**
 * Global route protection middleware.
 *
 * Uses the edge-compatible `authConfig` (no Prisma / Node-only deps) to run
 * the `authorized` callback on EVERY matched request before it reaches the
 * page or API handler.
 *
 * Public vs. private route decisions live in `auth.config.ts`.
 */
const { auth } = NextAuth(authConfig);
export default auth;

/**
 * Matcher: run middleware on all routes EXCEPT Next.js internals and static
 * assets.  This keeps the middleware out of `_next/`, image optimiser, and
 * common static file extensions so there is zero performance overhead for
 * those requests.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
