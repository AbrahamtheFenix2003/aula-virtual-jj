import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVideoStream } from "@/lib/google-drive";
import { canAccessBeltContent } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      return NextResponse.json({ error: "Video no encontrado" }, { status: 404 });
    }

    // Verificar que el video esté publicado
    if (!video.isPublished) {
      return NextResponse.json({ error: "Video no disponible" }, { status: 403 });
    }

    // Verificar que el usuario pertenezca a la misma academia
    if (video.academyId !== session.user.academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar nivel de cinturón
    if (!canAccessBeltContent(session.user.belt, video.minBelt, video.maxBelt)) {
      return NextResponse.json(
        { error: "Tu nivel de cinturón no tiene acceso a este video" },
        { status: 403 }
      );
    }

    // Obtener stream de Google Drive
    const response = await getVideoStream(video.driveFileId);
    
    // Incrementar contador de vistas (no bloqueante)
    prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(console.error);

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
    return NextResponse.json(
      { error: "Error al cargar el video" },
      { status: 500 }
    );
  }
}
