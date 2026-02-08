import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerExamStudentSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";

// GET - Listar estudiantes inscritos en un examen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { id: examId } = await params;

    // Verificar que el examen existe y pertenece a la academia
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        academyId: true,
        beltFrom: true,
        minAttendances: true,
        minVideosCompleted: true,
      },
    });

    if (!exam) {
      return ApiErrors.notFound("Examen");
    }

    if (exam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    // Obtener estudiantes inscritos con sus requisitos
    const students = await prisma.examStudent.findMany({
      where: { examId },
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
    });

    // Para cada estudiante, calcular si cumple requisitos
    const studentsWithRequirements = await Promise.all(
      students.map(async (student) => {
        let attendanceCount = 0;
        let videosCompleted = 0;

        if (exam.minAttendances) {
          attendanceCount = await prisma.attendance.count({
            where: { userId: student.userId },
          });
        }

        if (exam.minVideosCompleted) {
          videosCompleted = await prisma.videoProgress.count({
            where: {
              userId: student.userId,
              completed: true,
            },
          });
        }

        return {
          ...student,
          requirements: {
            attendances: {
              current: attendanceCount,
              required: exam.minAttendances,
              met: !exam.minAttendances || attendanceCount >= exam.minAttendances,
            },
            videos: {
              current: videosCompleted,
              required: exam.minVideosCompleted,
              met:
                !exam.minVideosCompleted ||
                videosCompleted >= exam.minVideosCompleted,
            },
          },
        };
      })
    );

    return NextResponse.json({ data: studentsWithRequirements });
  } catch (error) {
    console.error("Error fetching exam students:", error);
    return ApiErrors.internal("Error al obtener estudiantes del examen");
  }
}

// POST - Inscribir estudiante en examen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden inscribir estudiantes
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para inscribir estudiantes");
    }

    const { id: examId } = await params;

    const body = await request.json();
    const parsed = registerExamStudentSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.fromZod(parsed.error);
    }

    const { studentId } = parsed.data;

    // Verificar que el examen existe y esta activo
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        academyId: true,
        status: true,
        beltFrom: true,
        maxStudents: true,
        _count: { select: { students: true } },
      },
    });

    if (!exam) {
      return ApiErrors.notFound("Examen");
    }

    if (exam.academyId !== session.user.academyId) {
      return ApiErrors.forbidden("No tienes acceso a este examen");
    }

    if (exam.status !== "PROGRAMADO" && exam.status !== "EN_CURSO") {
      return ApiErrors.conflict(
        "Solo se pueden inscribir estudiantes en examenes programados o en curso"
      );
    }

    // Verificar cupo maximo
    if (exam.maxStudents && exam._count.students >= exam.maxStudents) {
      return ApiErrors.conflict("El examen ha alcanzado el cupo maximo");
    }

    // Verificar que el estudiante existe y pertenece a la academia
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        academyId: session.user.academyId,
        isActive: true,
      },
      select: { id: true, name: true, belt: true },
    });

    if (!student) {
      return ApiErrors.notFound("Estudiante");
    }

    // Verificar que el estudiante tiene el cinturon requerido
    if (student.belt !== exam.beltFrom) {
      return ApiErrors.validation(
        `El estudiante debe tener cinturon ${exam.beltFrom} para inscribirse`,
        "studentId"
      );
    }

    // Verificar que no este ya inscrito
    const existingRegistration = await prisma.examStudent.findUnique({
      where: {
        userId_examId: {
          userId: studentId,
          examId,
        },
      },
    });

    if (existingRegistration) {
      return ApiErrors.conflict("El estudiante ya esta inscrito en este examen");
    }

    // Crear inscripcion
    const registration = await prisma.examStudent.create({
      data: {
        userId: studentId,
        examId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            belt: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Estudiante inscrito exitosamente",
        data: registration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering exam student:", error);
    return ApiErrors.internal("Error al inscribir estudiante");
  }
}
