import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateExamSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";

// GET - Obtener un examen por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                belt: true,
                stripe: true,
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    if (!exam) {
      return ApiErrors.notFound("Examen");
    }

    // Verificar que pertenece a la misma academia
    if (exam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    return NextResponse.json({
      data: {
        ...exam,
        studentsCount: exam._count.students,
      },
    });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return ApiErrors.internal("Error al obtener examen");
  }
}

// PATCH - Actualizar examen
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden actualizar examenes
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para actualizar examenes");
    }

    const { id } = await params;

    // Verificar que el examen existe y pertenece a la academia
    const existingExam = await prisma.exam.findUnique({
      where: { id },
      select: { id: true, academyId: true, status: true },
    });

    if (!existingExam) {
      return ApiErrors.notFound("Examen");
    }

    if (existingExam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    // No permitir modificar examenes completados
    if (existingExam.status === "COMPLETADO") {
      return ApiErrors.conflict("No se puede modificar un examen completado");
    }

    const body = await request.json();
    const parsed = updateExamSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.fromZod(parsed.error);
    }

    const updateData: Record<string, unknown> = {};

    // Solo agregar campos que se proporcionaron
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.date !== undefined)
      updateData.date = new Date(parsed.data.date);
    if (parsed.data.location !== undefined)
      updateData.location = parsed.data.location;
    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description;
    if (parsed.data.maxStudents !== undefined)
      updateData.maxStudents = parsed.data.maxStudents;
    if (parsed.data.examFee !== undefined)
      updateData.examFee = parsed.data.examFee;
    if (parsed.data.minAttendances !== undefined)
      updateData.minAttendances = parsed.data.minAttendances;
    if (parsed.data.minVideosCompleted !== undefined)
      updateData.minVideosCompleted = parsed.data.minVideosCompleted;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Examen actualizado",
      data: exam,
    });
  } catch (error) {
    console.error("Error updating exam:", error);
    return ApiErrors.internal("Error al actualizar examen");
  }
}

// DELETE - Eliminar examen (solo ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo admin puede eliminar examenes
    if (session.user.role !== "ADMIN") {
      return ApiErrors.forbidden("Solo administradores pueden eliminar examenes");
    }

    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { id: true, academyId: true, status: true },
    });

    if (!exam) {
      return ApiErrors.notFound("Examen");
    }

    if (exam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    // No permitir eliminar examenes completados
    if (exam.status === "COMPLETADO") {
      return ApiErrors.conflict(
        "No se puede eliminar un examen completado. Cancele el examen primero."
      );
    }

    // Eliminar examen (cascade eliminara ExamStudent)
    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Examen eliminado",
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return ApiErrors.internal("Error al eliminar examen");
  }
}
