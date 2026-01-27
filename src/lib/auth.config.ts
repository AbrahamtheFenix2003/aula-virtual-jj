import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPath = ["/", "/login", "/register", "/forgot-password"].includes(nextUrl.pathname);

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
  providers: [], // Agregados en auth.ts
} satisfies NextAuth.AuthConfig;
