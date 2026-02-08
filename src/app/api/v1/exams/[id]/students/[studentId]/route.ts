import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";

// DELETE - Desinscribir estudiante del examen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden desinscribir estudiantes
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden(
        "No tienes permisos para desinscribir estudiantes"
      );
    }

    const { id: examId, studentId } = await params;

    // Verificar que el examen existe y pertenece a la academia
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, academyId: true, status: true },
    });

    if (!exam) {
      return ApiErrors.notFound("Examen");
    }

    if (exam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    // No permitir desinscribir de examenes completados
    if (exam.status === "COMPLETADO") {
      return ApiErrors.conflict(
        "No se pueden desinscribir estudiantes de examenes completados"
      );
    }

    // Buscar la inscripcion
    const registration = await prisma.examStudent.findFirst({
      where: {
        examId,
        userId: studentId,
      },
      select: { id: true, result: true },
    });

    if (!registration) {
      return ApiErrors.notFound("Inscripcion");
    }

    // No permitir desinscribir si ya fue evaluado
    if (registration.result !== "PENDIENTE") {
      return ApiErrors.conflict(
        "No se puede desinscribir un estudiante que ya fue evaluado"
      );
    }

    // Eliminar inscripcion
    await prisma.examStudent.delete({
      where: { id: registration.id },
    });

    return NextResponse.json({
      message: "Estudiante desinscrito del examen",
    });
  } catch (error) {
    console.error("Error removing exam student:", error);
    return ApiErrors.internal("Error al desinscribir estudiante");
  }
}
