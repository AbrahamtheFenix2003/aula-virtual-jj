import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPromotionSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
} from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma";

// GET - Listar promociones (historial)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const { page, limit } = parsePaginationParams(searchParams);

    const where: Prisma.BeltPromotionWhereInput = {};

    // Alumnos solo pueden ver sus propias promociones
    if (session.user.role === "ALUMNO") {
      where.studentId = session.user.id;
    } else {
      // Instructores/Admin pueden ver de otros usuarios
      if (studentId) {
        where.studentId = studentId;
      }
      // Solo promociones de alumnos de la misma academia
      where.student = { academyId: session.user.academyId };
    }

    const total = await prisma.beltPromotion.count({ where });

    const promotions = await prisma.beltPromotion.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            belt: true,
            stripe: true,
          },
        },
        promotedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { promotedAt: "desc" },
      skip: calculateSkip(page, limit),
      take: limit,
    });

    return NextResponse.json(
      createPaginatedResponse(promotions, page, limit, total)
    );
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return ApiErrors.internal("Error al obtener promociones");
  }
}

// POST - Crear promocion manual
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden crear promociones
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para registrar promociones");
    }

    const body = await request.json();
    const parsed = createPromotionSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.fromZod(parsed.error);
    }

    const { studentId, toBelt, toStripe, notes, examId } = parsed.data;

    // Verificar que el alumno pertenece a la misma academia
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        academyId: session.user.academyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        belt: true,
        stripe: true,
      },
    });

    if (!student) {
      return ApiErrors.notFound("Alumno");
    }

    // Verificar que el examen existe si se proporciona
    if (examId) {
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          academyId: session.user.academyId,
        },
      });
      if (!exam) {
        return ApiErrors.notFound("Examen");
      }
    }

    // Crear la promocion y actualizar el cinturon del alumno en una transaccion
    const result = await prisma.$transaction(async (tx) => {
      // Crear registro de promocion
      const promotion = await tx.beltPromotion.create({
        data: {
          studentId,
          fromBelt: student.belt,
          fromStripe: student.stripe,
          toBelt,
          toStripe,
          notes: notes || null,
          promotedById: session.user.id,
          examId: examId || null,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
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

      // Actualizar cinturon del alumno
      await tx.user.update({
        where: { id: studentId },
        data: {
          belt: toBelt,
          stripe: toStripe,
        },
      });

      return promotion;
    });

    return NextResponse.json(
      {
        message: "Promocion registrada exitosamente",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating promotion:", error);
    return ApiErrors.internal("Error al registrar promocion");
  }
}
