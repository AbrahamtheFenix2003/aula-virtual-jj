import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bulkEvaluateExamSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";

// POST - Create evaluations for exam students (RESTful: creating evaluation resources)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden evaluar
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para evaluar examenes");
    }

    const { id: examId } = await params;

    // Verificar que el examen existe
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        academyId: true,
        status: true,
        beltTo: true,
      },
    });

    if (!exam) {
      return ApiErrors.notFound("Examen");
    }

    if (exam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    if (exam.status === "CANCELADO") {
      return ApiErrors.conflict("No se puede evaluar un examen cancelado");
    }

    if (exam.status === "COMPLETADO") {
      return ApiErrors.conflict("Este examen ya fue completado");
    }

    const body = await request.json();
    const parsed = bulkEvaluateExamSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.fromZod(parsed.error);
    }

    const { evaluations } = parsed.data;

    // Verificar que todos los examStudentId pertenecen a este examen
    const examStudentIds = evaluations.map((e) => e.examStudentId);
    const validStudents = await prisma.examStudent.findMany({
      where: {
        id: { in: examStudentIds },
        examId,
      },
      include: {
        user: {
          select: {
            id: true,
            belt: true,
            stripe: true,
          },
        },
      },
    });

    if (validStudents.length !== examStudentIds.length) {
      return ApiErrors.validation(
        "Algunos estudiantes no pertenecen a este examen",
        "evaluations"
      );
    }

    // Crear un mapa para busqueda rapida
    const studentMap = new Map(validStudents.map((s) => [s.id, s]));

    // Procesar evaluaciones en una transaccion
    const results = await prisma.$transaction(async (tx) => {
      const processedResults = [];

      for (const evaluation of evaluations) {
        const student = studentMap.get(evaluation.examStudentId);
        if (!student) continue;

        // Actualizar resultado del examen
        await tx.examStudent.update({
          where: { id: evaluation.examStudentId },
          data: {
            result: evaluation.result,
            score: evaluation.score || null,
            feedback: evaluation.feedback || null,
            evaluatedAt: new Date(),
          },
        });

        // Si aprobo, crear promocion y actualizar cinturon
        if (evaluation.result === "APROBADO") {
          // Crear registro de promocion
          await tx.beltPromotion.create({
            data: {
              studentId: student.userId,
              fromBelt: student.user.belt,
              fromStripe: student.user.stripe,
              toBelt: exam.beltTo,
              toStripe: "CERO", // Al subir de cinturon, se resetean los stripes
              promotedById: session.user.id,
              examId: examId,
              notes: evaluation.feedback || `Aprobado en examen con ${evaluation.score || "N/A"} puntos`,
            },
          });

          // Actualizar cinturon del usuario
          await tx.user.update({
            where: { id: student.userId },
            data: {
              belt: exam.beltTo,
              stripe: "CERO",
            },
          });
        }

        processedResults.push({
          examStudentId: evaluation.examStudentId,
          result: evaluation.result,
          promoted: evaluation.result === "APROBADO",
        });
      }

      // Verificar si todos los estudiantes han sido evaluados
      const pendingCount = await tx.examStudent.count({
        where: {
          examId,
          result: "PENDIENTE",
        },
      });

      // Si no quedan pendientes, marcar examen como completado
      if (pendingCount === 0) {
        await tx.exam.update({
          where: { id: examId },
          data: { status: "COMPLETADO" },
        });
      } else {
        // Si hay evaluaciones, poner el examen en curso
        await tx.exam.update({
          where: { id: examId },
          data: { status: "EN_CURSO" },
        });
      }

      return processedResults;
    });

    // Contar resultados
    const approved = results.filter((r) => r.result === "APROBADO").length;
    const failed = results.filter((r) => r.result === "REPROBADO").length;
    const noShow = results.filter((r) => r.result === "NO_PRESENTADO").length;

    return NextResponse.json(
      {
        message: "Evaluaciones registradas",
        data: {
          total: results.length,
          approved,
          failed,
          noShow,
          results,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error evaluating exam:", error);
    return ApiErrors.internal("Error al evaluar examen");
  }
}
