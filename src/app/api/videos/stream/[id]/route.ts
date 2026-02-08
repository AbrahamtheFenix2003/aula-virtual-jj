import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: Este endpoint se movio a /api/v1/videos/stream/[id]
 * Este archivo mantiene compatibilidad con clientes existentes.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  url.pathname = `/api/v1/videos/stream/${id}`;
  return NextResponse.rewrite(url);
}
