import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: Este endpoint se movio a /api/v1/health
 * Este archivo mantiene compatibilidad con clientes existentes.
 */

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/api/v1/health", request.url), 308);
}
