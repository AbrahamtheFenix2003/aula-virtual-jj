import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import {
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/loginLockout";
import { getClientIP } from "@/lib/rate-limit";
import type { Role, Belt, Stripe } from "@/generated/prisma";
import { authConfig } from "./auth.config";
import { sanitizeCallbackUrl } from "./url";

const IS_ACTIVE_RECHECK_MS = 5 * 60 * 1000;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      belt: Belt;
      stripe: Stripe;
      academyId: string;
      isActive: boolean;
      avatar?: string | null;
    };
  }

  interface User {
    role: Role;
    belt: Belt;
    stripe: Stripe;
    academyId: string;
    isActive: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    belt: Belt;
    stripe: Stripe;
    academyId: string;
    isActive: boolean;
    isActiveCheckedAt: number;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const ip = getClientIP(request);

        // Rate limiting: check lockout BEFORE any DB lookup or bcrypt
        const lockout = await checkLoginLockout(email, ip);
        if (lockout.locked) {
          // Reject immediately — generic message, no user enumeration
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            belt: true,
            stripe: true,
            academyId: true,
            avatar: true,
            isActive: true,
          },
        });

        // Generic failure: user not found, inactive, or no password (OAuth-only)
        if (!user || !user.isActive || !user.password) {
          await recordFailedLogin(email, ip);
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          await recordFailedLogin(email, ip);
          return null;
        }

        // Login exitoso: limpiar intentos fallidos y actualizar último login
        // Wrapped in try/catch so housekeeping failures never block a valid login
        try {
          await Promise.all([
            clearLoginAttempts(email, ip),
            prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
              select: { id: true },
            }),
          ]);
        } catch (housekeepingError) {
          console.error(
            "Non-critical: post-login housekeeping failed",
            housekeepingError,
          );
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          belt: user.belt,
          stripe: user.stripe,
          academyId: user.academyId,
          isActive: user.isActive,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Para OAuth (Google), verificar/crear usuario con academia
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        // Buscar usuario existente
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            isActive: true,
            avatar: true,
            emailVerified: true,
          },
        });

        if (!existingUser) {
          // Obtener academia por defecto
          const defaultAcademy = await prisma.academy.findFirst({
            where: { slug: "academia-principal" },
            select: { id: true },
          });

          if (!defaultAcademy) {
            console.error("No se encontró la academia por defecto");
            return false;
          }

          // Crear nuevo usuario
          await prisma.user.create({
            data: {
              email,
              name: user.name || "Usuario",
              avatar: user.image,
              role: "ALUMNO",
              belt: "BLANCA",
              stripe: "CERO",
              academyId: defaultAcademy.id,
              emailVerified: new Date(),
            },
            select: { id: true },
          });
        } else {
          // Denegar login si el usuario está inactivo
          if (!existingUser.isActive) return false;

          // Actualizar último login y avatar si cambió
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLogin: new Date(),
              avatar: user.image || existingUser.avatar,
              emailVerified: existingUser.emailVerified || new Date(),
            },
            select: { id: true },
          });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      const now = Date.now();

      // Primer login: agregar datos del usuario al token
      if (user) {
        // Buscar usuario en BD para obtener datos completos
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            role: true,
            belt: true,
            stripe: true,
            academyId: true,
            isActive: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.belt = dbUser.belt;
          token.stripe = dbUser.stripe;
          token.academyId = dbUser.academyId;
          token.isActive = dbUser.isActive;
          token.isActiveCheckedAt = now;
        }

        return token;
      }

      const tokenEmail = typeof token.email === "string" ? token.email : null;
      const shouldRefreshActiveStatus =
        !!tokenEmail &&
        (typeof token.isActive !== "boolean" ||
          typeof token.isActiveCheckedAt !== "number" ||
          now - token.isActiveCheckedAt > IS_ACTIVE_RECHECK_MS);

      if (shouldRefreshActiveStatus && tokenEmail) {
        const dbUser = await prisma.user.findUnique({
          where: { email: tokenEmail },
          select: {
            id: true,
            role: true,
            belt: true,
            stripe: true,
            academyId: true,
            isActive: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.belt = dbUser.belt;
          token.stripe = dbUser.stripe;
          token.academyId = dbUser.academyId;
          token.isActive = dbUser.isActive;
          token.isActiveCheckedAt = now;
        } else {
          token.isActive = false;
          token.isActiveCheckedAt = now;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.belt = token.belt as Belt;
        session.user.stripe = token.stripe as Stripe;
        session.user.academyId = token.academyId as string;
        session.user.isActive = token.isActive === true;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return sanitizeCallbackUrl(url);
      }

      try {
        const parsed = new URL(url);

        if (parsed.origin !== baseUrl) {
          return sanitizeCallbackUrl(null);
        }

        return sanitizeCallbackUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      } catch {
        return sanitizeCallbackUrl(null);
      }
    },
  },
  events: {
    async linkAccount({ user }) {
      // Cuando se vincula una cuenta OAuth a un usuario existente
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
        select: { id: true },
      });
    },
  },
});
