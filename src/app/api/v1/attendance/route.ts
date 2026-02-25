import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAttendanceSchema, bulkAttendanceSchema } from "@/lib/validations";
import { ApiErrors } from "@/lib/api-errors";
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
} from "@/lib/pagination";
import type { ClassType, Prisma } from "@/generated/prisma";

// GET - Listar asistencias (con paginacion)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month"); // Format: YYYY-MM
    const classType = searchParams.get("classType") as ClassType | null;

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams);

    // Build where clause
    const where: Prisma.AttendanceWhereInput = {};

    // Alumnos solo pueden ver sus propias asistencias
    if (session.user.role === "ALUMNO") {
      where.userId = session.user.id;
    } else {
      // Instructores/Admin pueden ver de otros usuarios
      if (userId) {
        where.userId = userId;
      }
      // Solo asistencias de la misma academia
      where.user = { academyId: session.user.academyId };
    }

    // Filtro por mes
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0); // Last day of month
      where.date = { gte: startDate, lte: endDate };
    }

    // Filtro por tipo de clase
    if (classType) {
      where.classType = classType;
    }

    // Count total for pagination
    const total = await prisma.attendance.count({ where });

    // Fetch paginated data
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            belt: true,
            stripe: true,
            avatar: true,
          },
        },
        classSchedule: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
      skip: calculateSkip(page, limit),
      take: limit,
    });

    return NextResponse.json(
      createPaginatedResponse(attendances, page, limit, total)
    );
  } catch (error) {
    console.error("Error fetching attendances:", error);
    return ApiErrors.internal("Error al obtener asistencias");
  }
}

// POST - Crear asistencia(s)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admin pueden registrar asistencias
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para registrar asistencias");
    }

    const body = await request.json();

    // Detect if it's bulk or single attendance
    const isBulk = Array.isArray(body.userIds);

    if (isBulk) {
      // Bulk attendance (max 100 users per operation - enforced by schema)
      const parsed = bulkAttendanceSchema.safeParse(body);
      if (!parsed.success) {
        return ApiErrors.fromZod(parsed.error);
      }

      const { userIds, date, classType, classScheduleId } = parsed.data;

      // Verify all users belong to same academy
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          academyId: session.user.academyId,
          isActive: true,
        },
        select: { id: true },
      });

      const validUserIds = users.map((u) => u.id);

      if (validUserIds.length === 0) {
        return ApiErrors.validation("No se encontraron usuarios validos", "userIds");
      }

      // Create attendances (skip duplicates)
      const attendanceData = validUserIds.map((userId) => ({
        userId,
        date: new Date(date),
        classType,
        classScheduleId: classScheduleId || null,
        registeredById: session.user.id,
      }));

      // Use createMany with skipDuplicates
      const result = await prisma.attendance.createMany({
        data: attendanceData,
        skipDuplicates: true,
      });

      return NextResponse.json(
        {
          message: `${result.count} asistencias registradas`,
          count: result.count,
          skipped: validUserIds.length - result.count,
        },
        { status: 201 }
      );
    } else {
      // Single attendance
      const parsed = createAttendanceSchema.safeParse(body);
      if (!parsed.success) {
        return ApiErrors.fromZod(parsed.error);
      }

      const { userId, date, classType, classScheduleId, notes } = parsed.data;

      // Verify user belongs to same academy
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          academyId: session.user.academyId,
          isActive: true,
        },
      });

      if (!user) {
        return ApiErrors.notFound("Usuario");
      }

      // Check for existing attendance
      const existing = await prisma.attendance.findUnique({
        where: {
          userId_date_classType: {
            userId,
            date: new Date(date),
            classType,
          },
        },
      });

      if (existing) {
        return ApiErrors.conflict(
          "Ya existe una asistencia para este usuario, fecha y tipo de clase"
        );
      }

      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date: new Date(date),
          classType,
          classScheduleId: classScheduleId || null,
          notes: notes || null,
          registeredById: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              belt: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: "Asistencia registrada",
          data: attendance,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating attendance:", error);
    return ApiErrors.internal("Error al registrar asistencia");
  }
}
