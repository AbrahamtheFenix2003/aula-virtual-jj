import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";

// GET - Estadisticas de asistencias
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Alumnos solo pueden ver sus propias estadisticas
    if (session.user.role === "ALUMNO" && userId !== session.user.id) {
      return ApiErrors.forbidden("No tienes permisos para ver estas estadisticas");
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 1. Total de asistencias
    const totalAttendances = await prisma.attendance.count({
      where: { userId },
    });

    // 2. Asistencias este mes
    const thisMonthAttendances = await prisma.attendance.count({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    // 3. Asistencias por tipo de clase
    const attendancesByType = await prisma.attendance.groupBy({
      by: ["classType"],
      where: { userId },
      _count: { id: true },
    });

    // 4. Calcular racha actual (dias consecutivos con asistencia)
    const recentAttendances = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
      distinct: ["date"],
      take: 60, // Last 60 unique dates
    });

    let currentStreak = 0;
    if (recentAttendances.length > 0) {
      // Get unique dates in descending order
      const uniqueDates = recentAttendances.map((a) =>
        format(a.date, "yyyy-MM-dd")
      );
      const uniqueDateSet = [...new Set(uniqueDates)];

      // Check if there's an attendance today or yesterday
      const today = format(now, "yyyy-MM-dd");
      const yesterday = format(subDays(now, 1), "yyyy-MM-dd");

      if (uniqueDateSet[0] === today || uniqueDateSet[0] === yesterday) {
        currentStreak = 1;
        let checkDate = subDays(
          uniqueDateSet[0] === today ? now : subDays(now, 1),
          1
        );

        for (let i = 1; i < uniqueDateSet.length; i++) {
          const dateStr = format(checkDate, "yyyy-MM-dd");
          if (uniqueDateSet.includes(dateStr)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }
      }
    }

    // 5. Tipo de clase favorita
    const favoriteClassType =
      attendancesByType.length > 0
        ? attendancesByType.reduce((prev, current) =>
            prev._count.id > current._count.id ? prev : current
          ).classType
        : null;

    // 6. Dias con asistencia este mes (para calendario)
    const monthAttendances = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: { date: true, classType: true },
      orderBy: { date: "asc" },
    });

    const attendanceDates = monthAttendances.map((a) => ({
      date: format(a.date, "yyyy-MM-dd"),
      classType: a.classType,
    }));

    return NextResponse.json({
      data: {
        totalAttendances,
        thisMonthAttendances,
        currentStreak,
        favoriteClassType,
        attendancesByType: attendancesByType.map((a) => ({
          classType: a.classType,
          count: a._count.id,
        })),
        attendanceDates,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return ApiErrors.internal("Error al obtener estadisticas");
  }
}
