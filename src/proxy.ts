import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Next.js 16 proxy entrypoint for global auth enforcement.
 *
 * Reuses `authConfig.callbacks.authorized` so public/private route rules live
 * in one place and are applied consistently to pages and API routes.
 */
export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
