import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVideoStream } from "@/lib/googleDrive";
import { canAccessBeltContent } from "@/types";
import { ApiErrors } from "@/lib/api-errors";

// GET - Stream video content by video ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { id } = await params;

    // Obtener video de la base de datos
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        driveFileId: true,
        mimeType: true,
        minBelt: true,
        maxBelt: true,
        academyId: true,
        isPublished: true,
      },
    });

    if (!video) {
      return ApiErrors.notFound("Video");
    }

    // Verificar que el video este publicado
    if (!video.isPublished) {
      return ApiErrors.forbidden("Video no disponible");
    }

    // Verificar que el usuario pertenezca a la misma academia
    if (video.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este video");
    }

    // Verificar nivel de cinturon
    if (!canAccessBeltContent(session.user.belt, video.minBelt, video.maxBelt)) {
      return ApiErrors.forbidden(
        "Tu nivel de cinturon no tiene acceso a este video"
      );
    }

    // Obtener stream de Google Drive
    const response = await getVideoStream(video.driveFileId);

    // NOTA: El contador de vistas se maneja en POST /api/v1/videos/[id]/views

    // Configurar headers para streaming
    const headers = new Headers();
    headers.set("Content-Type", video.mimeType);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=3600");

    // Manejar Range requests para seeking en el video
    const range = req.headers.get("range");
    if (range && response.headers["content-length"]) {
      const contentLength = parseInt(response.headers["content-length"]);
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;
      
      headers.set("Content-Range", `bytes ${start}-${end}/${contentLength}`);
      headers.set("Content-Length", String(end - start + 1));
      
      return new NextResponse(response.data as unknown as ReadableStream, {
        status: 206,
        headers,
      });
    }

    return new NextResponse(response.data as unknown as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error streaming video:", error);
    return ApiErrors.internal("Error al cargar el video");
  }
}
