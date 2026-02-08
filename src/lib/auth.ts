import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import type { Role, Belt, Stripe } from "@/generated/prisma";
import type { Adapter } from "next-auth/adapters";
import { authConfig } from "./auth.config";

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
      avatar?: string | null;
    };
  }

  interface User {
    role: Role;
    belt: Belt;
    stripe: Stripe;
    academyId: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    belt: Belt;
    stripe: Stripe;
    academyId: string;
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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

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

        if (!user || !user.isActive) return null;

        // Usuarios OAuth no tienen password
        if (!user.password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          belt: user.belt,
          stripe: user.stripe,
          academyId: user.academyId,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Para OAuth (Google), verificar/crear usuario con academia
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        // Buscar usuario existente
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Obtener academia por defecto
          const defaultAcademy = await prisma.academy.findFirst({
            where: { slug: "academia-principal" },
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
          });
        } else {
          // Actualizar último login y avatar si cambió
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLogin: new Date(),
              avatar: user.image || existingUser.avatar,
              emailVerified: existingUser.emailVerified || new Date(),
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
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
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.belt = dbUser.belt;
          token.stripe = dbUser.stripe;
          token.academyId = dbUser.academyId;
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
      }
      return session;
    },
  },
  events: {
    async linkAccount({ user }) {
      // Cuando se vincula una cuenta OAuth a un usuario existente
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
});
