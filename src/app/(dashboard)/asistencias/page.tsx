// 1. React/Next.js
import { redirect } from "next/navigation";

// 2. Third-party
import { startOfMonth, endOfMonth, format, subDays } from "date-fns";

// 3. Internal (@/ alias)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendancePageClient } from "@/components/dashboard/attendance/attendance-page-client";
import type { Belt, ClassType } from "@/generated/prisma";

export default async function AsistenciasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  const academyId = session.user.academyId;
  const canManage = userRole === "INSTRUCTOR" || userRole === "ADMIN";

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Fetch stats data
  const [totalAttendances, thisMonthAttendances, attendancesByType, recentAttendances] = await Promise.all([
    // Total attendances
    prisma.attendance.count({
      where: canManage ? { user: { academyId } } : { userId },
    }),
    // This month attendances
    prisma.attendance.count({
      where: {
        ...(canManage ? { user: { academyId } } : { userId }),
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Attendances by type
    prisma.attendance.groupBy({
      by: ["classType"],
      where: canManage ? { user: { academyId } } : { userId },
      _count: { id: true },
    }),
    // Recent attendances for streak calculation (user's own)
    prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
      distinct: ["date"],
      take: 60,
    }),
  ]);

  // Calculate streak
  let currentStreak = 0;
  if (recentAttendances.length > 0) {
    const uniqueDates = recentAttendances.map((a) =>
      format(a.date, "yyyy-MM-dd")
    );
    const uniqueDateSet = [...new Set(uniqueDates)];
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

  // Favorite class type
  const favoriteClassType =
    attendancesByType.length > 0
      ? attendancesByType.reduce((prev, current) =>
          prev._count.id > current._count.id ? prev : current
        ).classType
      : null;

  // Month attendances for calendar
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

  // Fetch recent attendances for history
  const attendances = await prisma.attendance.findMany({
    where: canManage ? { user: { academyId } } : { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          belt: true,
        },
      },
      classSchedule: {
        select: {
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
    take: 50,
  });

  // Data for instructors/admins
  let students: Array<{
    id: string;
    name: string;
    email: string;
    belt: Belt;
    avatar: string | null;
  }> = [];
  let todayClasses: Array<{
    id: string;
    name: string;
    classType: ClassType;
    startTime: string;
    endTime: string;
    maxCapacity: number | null;
  }> = [];

  if (canManage) {
    // Fetch active students
    const studentsData = await prisma.user.findMany({
      where: {
        academyId,
        isActive: true,
        role: "ALUMNO",
      },
      select: {
        id: true,
        name: true,
        email: true,
        belt: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    });
    students = studentsData;

    // Fetch today's classes
    const dayOfWeek = now.getDay(); // 0-6
    const classesData = await prisma.classSchedule.findMany({
      where: {
        academyId,
        dayOfWeek,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        classType: true,
        startTime: true,
        endTime: true,
        maxCapacity: true,
      },
      orderBy: { startTime: "asc" },
    });
    todayClasses = classesData;
  }

  // Build stats object
  const stats = {
    totalAttendances,
    thisMonthAttendances,
    currentStreak,
    favoriteClassType,
    attendanceDates,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Asistencias</h1>
        <p className="text-muted-foreground">
          {canManage
            ? "Gestiona las asistencias de tus alumnos"
            : "Tu historial de entrenamientos"}
        </p>
      </div>

      {/* Client component with all the interactive parts */}
      <AttendancePageClient
        initialStats={stats}
        initialAttendances={attendances}
        students={students}
        todayClasses={todayClasses}
        userRole={userRole}
        canManage={canManage}
      />
    </div>
  );
}
