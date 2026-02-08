import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";

// DELETE - Eliminar asistencia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden eliminar asistencias
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para eliminar asistencias");
    }

    const { id } = await params;

    // Verify attendance exists and belongs to same academy
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: { academyId: true },
        },
      },
    });

    if (!attendance) {
      return ApiErrors.notFound("Asistencia");
    }

    if (attendance.user.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes permisos para esta asistencia");
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Asistencia eliminada" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return ApiErrors.internal("Error al eliminar asistencia");
  }
}
