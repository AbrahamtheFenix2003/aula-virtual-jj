"use client";

// 1. React/Next.js
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party
import { toast } from "sonner";

// 3. Internal (@/ alias)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceStats } from "./attendance-stats";
import { AttendanceCalendar } from "./attendance-calendar";
import { AttendanceHistory } from "./attendance-history";
import { RegisterAttendance } from "./register-attendance";
import type { Belt, ClassType } from "@/generated/prisma";

interface AttendanceDate {
  date: string;
  classType: string;
}

interface AttendanceRecord {
  id: string;
  date: Date | string;
  classType: ClassType;
  notes?: string | null;
  user: {
    id: string;
    name: string;
    belt: Belt;
  };
  classSchedule?: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  registeredBy?: {
    id: string;
    name: string;
  } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  belt: Belt;
  avatar?: string | null;
}

interface ClassScheduleItem {
  id: string;
  name: string;
  classType: ClassType;
  startTime: string;
  endTime: string;
  maxCapacity?: number | null;
}

interface AttendanceStats {
  totalAttendances: number;
  thisMonthAttendances: number;
  currentStreak: number;
  favoriteClassType: string | null;
  attendanceDates: AttendanceDate[];
}

interface AttendancePageClientProps {
  initialStats: AttendanceStats;
  initialAttendances: AttendanceRecord[];
  students: Student[];
  todayClasses: ClassScheduleItem[];
  userRole: "ALUMNO" | "INSTRUCTOR" | "ADMIN";
  canManage: boolean;
}

export function AttendancePageClient({
  initialStats,
  initialAttendances,
  students,
  todayClasses,
  userRole,
  canManage,
}: AttendancePageClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [attendances, setAttendances] = useState(initialAttendances);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh data after registration
  const refreshData = useCallback(async () => {
    try {
      // Refresh stats
      const statsRes = await fetch("/api/attendance/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Refresh attendances
      const attendancesRes = await fetch("/api/attendance?limit=50");
      if (attendancesRes.ok) {
        const attendancesData = await attendancesRes.json();
        setAttendances(attendancesData.data);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, []);

  // Handle delete attendance
  const handleDelete = async (id: string) => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar");
      }

      toast.success("Asistencia eliminada");
      setAttendances((prev) => prev.filter((a) => a.id !== id));
      refreshData(); // Also refresh stats
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Tabs defaultValue="historial" className="space-y-6">
      <TabsList>
        <TabsTrigger value="historial">Mi Historial</TabsTrigger>
        {canManage && (
          <TabsTrigger value="registrar">Registrar Asistencia</TabsTrigger>
        )}
      </TabsList>

      {/* My History Tab */}
      <TabsContent value="historial" className="space-y-6">
        {/* Stats */}
        <AttendanceStats
          totalAttendances={stats.totalAttendances}
          thisMonthAttendances={stats.thisMonthAttendances}
          currentStreak={stats.currentStreak}
          favoriteClassType={stats.favoriteClassType}
        />

        {/* Calendar and History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceCalendar
            attendanceDates={stats.attendanceDates}
            onMonthChange={async (month) => {
              // Fetch attendances for the new month
              const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
              try {
                const res = await fetch(
                  `/api/attendance/stats?month=${monthStr}`
                );
                if (res.ok) {
                  const data = await res.json();
                  setStats((prev) => ({
                    ...prev,
                    attendanceDates: data.data.attendanceDates,
                  }));
                }
              } catch (error) {
                console.error("Error fetching month data:", error);
              }
            }}
          />

          <AttendanceHistory
            attendances={attendances}
            showUserColumn={canManage}
            canDelete={canManage}
            onDelete={handleDelete}
          />
        </div>
      </TabsContent>

      {/* Register Tab (Instructors/Admins only) */}
      {canManage && (
        <TabsContent value="registrar">
          <RegisterAttendance
            students={students}
            todayClasses={todayClasses}
            onSuccess={refreshData}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
