import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExamSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
} from "@/lib/pagination";
import { BELT_ORDER } from "@/types";
import type { ExamStatus, Belt, Prisma } from "@/generated/prisma";

// GET - Listar examenes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ExamStatus | null;
    const beltTo = searchParams.get("beltTo") as Belt | null;
    const upcoming = searchParams.get("upcoming") === "true";
    const { page, pageSize } = parsePaginationParams(searchParams);

    const where: Prisma.ExamWhereInput = {
      academyId: session.user.academyId,
    };

    // Filtro por estado
    if (status) {
      where.status = status;
    }

    // Filtro por cinturon destino
    if (beltTo) {
      where.beltTo = beltTo;
    }

    // Filtro para examenes futuros
    if (upcoming) {
      where.date = { gte: new Date() };
      where.status = { in: ["PROGRAMADO", "EN_CURSO"] };
    }

    const total = await prisma.exam.count({ where });

    const exams = await prisma.exam.findMany({
      where,
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { date: "asc" },
      skip: calculateSkip(page, pageSize),
      take: pageSize,
    });

    // Transformar para incluir conteo de estudiantes
    const examsWithCount = exams.map((exam) => ({
      ...exam,
      studentsCount: exam._count.students,
      _count: undefined,
    }));

    return NextResponse.json(
      createPaginatedResponse(examsWithCount, page, pageSize, total)
    );
  } catch (error) {
    console.error("Error fetching exams:", error);
    return ApiErrors.internal("Error al obtener examenes");
  }
}

// POST - Crear examen
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden crear examenes
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para crear examenes");
    }

    const body = await request.json();
    const parsed = createExamSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.fromZod(parsed.error);
    }

    const {
      title,
      date,
      location,
      description,
      beltFrom,
      beltTo,
      maxStudents,
      examFee,
      minAttendances,
      minVideosCompleted,
    } = parsed.data;

    // Validar que beltTo sea mayor que beltFrom
    const fromIndex = BELT_ORDER.indexOf(beltFrom);
    const toIndex = BELT_ORDER.indexOf(beltTo);

    if (toIndex <= fromIndex) {
      return ApiErrors.validation(
        "El cinturon destino debe ser mayor que el cinturon origen",
        "beltTo"
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        date: new Date(date),
        location: location || null,
        description: description || null,
        beltFrom,
        beltTo,
        maxStudents: maxStudents || null,
        examFee: examFee || null,
        minAttendances: minAttendances || null,
        minVideosCompleted: minVideosCompleted || null,
        academyId: session.user.academyId,
      },
    });

    return NextResponse.json(
      {
        message: "Examen creado exitosamente",
        data: exam,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating exam:", error);
    return ApiErrors.internal("Error al crear examen");
  }
}
