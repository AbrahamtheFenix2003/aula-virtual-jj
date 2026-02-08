import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPath = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ].includes(nextUrl.pathname);

      if (isPublicPath) {
        if (isLoggedIn && ["/login", "/register"].includes(nextUrl.pathname)) {
          return Response.redirect(new URL("/videos", nextUrl));
        }
        return true;
      }

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
