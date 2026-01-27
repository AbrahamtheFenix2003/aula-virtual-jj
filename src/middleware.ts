import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/register", "/forgot-password"];

// Rutas que requieren rol específico
const adminRoutes = ["/reportes", "/configuracion"];
const instructorRoutes = ["/alumnos", ...adminRoutes];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Permitir rutas públicas
  if (publicRoutes.includes(pathname)) {
    // Si está logueado y trata de ir a login/register, redirigir al dashboard
    if (isLoggedIn && ["/login", "/register"].includes(pathname)) {
      return NextResponse.redirect(new URL("/videos", nextUrl));
    }
    return NextResponse.next();
  }

  // Rutas de API
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Rutas protegidas - requieren autenticación
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  const userRole = req.auth?.user?.role;

  // Verificar acceso a rutas de instructor
  if (instructorRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/videos", nextUrl));
    }
  }

  // Verificar acceso a rutas de admin
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/videos", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
