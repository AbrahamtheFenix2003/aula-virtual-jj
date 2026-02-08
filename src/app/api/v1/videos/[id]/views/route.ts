import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";

// POST - Registrar una vista de video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { id } = await params;

    // Verificar que el video existe y pertenece a la misma academia
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        academyId: true,
        isPublished: true,
      },
    });

    if (!video) {
      return ApiErrors.notFound("Video");
    }

    if (!video.isPublished) {
      return ApiErrors.forbidden("Video no disponible");
    }

    if (video.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este video");
    }

    // Incrementar contador de vistas
    const updated = await prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: {
        id: true,
        viewCount: true,
      },
    });

    return NextResponse.json({
      message: "Vista registrada",
      data: {
        videoId: updated.id,
        viewCount: updated.viewCount,
      },
    });
  } catch (error) {
    console.error("Error registering video view:", error);
    return ApiErrors.internal("Error al registrar vista");
  }
}
