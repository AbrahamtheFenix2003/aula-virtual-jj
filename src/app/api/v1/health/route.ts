import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Verificar conexion a la base de datos
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    const errorMessage =
      process.env.NODE_ENV === "production"
        ? undefined
        : error instanceof Error
          ? error.message
          : "Unknown error";

    return NextResponse.json(
      {
        status: "unhealthy",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        ...(errorMessage ? { error: errorMessage } : {}),
      },
      { status: 503 }
    );
  }
}
