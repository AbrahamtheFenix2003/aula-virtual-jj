import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";

// GET - Obtener una promocion por ID
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

    const promotion = await prisma.beltPromotion.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            belt: true,
            stripe: true,
            academyId: true,
          },
        },
        promotedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!promotion) {
      return ApiErrors.notFound("Promocion");
    }

    // Verificar acceso: alumno solo ve las suyas, otros solo de su academia
    if (session.user.role === "ALUMNO") {
      if (promotion.studentId !== session.user.id) {
        return ApiErrors.forbidden("No tienes acceso a esta promocion");
      }
    } else {
      if (promotion.student.academyId !== session.user.academyId) {
        return ApiErrors.forbidden("No tienes acceso a esta promocion");
      }
    }

    return NextResponse.json({ data: promotion });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return ApiErrors.internal("Error al obtener promocion");
  }
}

// DELETE - Eliminar una promocion (solo ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo admin puede eliminar promociones
    if (session.user.role !== "ADMIN") {
      return ApiErrors.forbidden("Solo administradores pueden eliminar promociones");
    }

    const { id } = await params;

    const promotion = await prisma.beltPromotion.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            academyId: true,
            belt: true,
            stripe: true,
          },
        },
      },
    });

    if (!promotion) {
      return ApiErrors.notFound("Promocion");
    }

    // Verificar que pertenece a la misma academia
    if (promotion.student.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a esta promocion");
    }

    // Revertir el cinturon del alumno al anterior en una transaccion
    await prisma.$transaction(async (tx) => {
      // Revertir cinturon
      await tx.user.update({
        where: { id: promotion.studentId },
        data: {
          belt: promotion.fromBelt,
          stripe: promotion.fromStripe,
        },
      });

      // Eliminar registro de promocion
      await tx.beltPromotion.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Promocion eliminada y cinturon revertido",
    });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return ApiErrors.internal("Error al eliminar promocion");
  }
}
