import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: Este endpoint se movio a /api/v1/attendance
 * Este archivo mantiene compatibilidad con clientes existentes.
 * Se eliminara en una version futura.
 */

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  return NextResponse.redirect(
    new URL(`/api/v1/attendance${url.search}`, request.url),
    308 // Permanent Redirect
  );
}

export async function POST(request: NextRequest) {
  // Para POST necesitamos reenviar el body, usamos rewrite en lugar de redirect
  const url = new URL(request.url);
  url.pathname = "/api/v1/attendance";
  return NextResponse.rewrite(url);
}
