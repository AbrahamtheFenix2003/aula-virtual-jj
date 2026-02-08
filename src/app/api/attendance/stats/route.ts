import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: Este endpoint se movio a /api/v1/attendance/stats
 * Este archivo mantiene compatibilidad con clientes existentes.
 */

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  return NextResponse.redirect(
    new URL(`/api/v1/attendance/stats${url.search}`, request.url),
    308
  );
}
