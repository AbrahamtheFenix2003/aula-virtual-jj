"use client";

// 1. React/Next.js
import { useState, useEffect } from "react";

// 2. Third-party
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

// 3. Internal (@/ alias)
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASS_TYPE_NAMES } from "@/types";

interface AttendanceDate {
  date: string;
  classType: string;
}

interface AttendanceCalendarProps {
  attendanceDates: AttendanceDate[];
  onMonthChange?: (month: Date) => void;
}

const CLASS_TYPE_COLORS: Record<string, string> = {
  GI: "bg-blue-500",
  NOGI: "bg-purple-500",
  COMPETICION: "bg-red-500",
  INFANTIL: "bg-green-500",
  FUNDAMENTALS: "bg-yellow-500",
  AVANZADO: "bg-orange-500",
};

export function AttendanceCalendar({
  attendanceDates,
  onMonthChange,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [today, setToday] = useState<string | null>(null);

  // Set today's date only on client to avoid hydration mismatch
  useEffect(() => {
    setToday(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  // Group attendances by date
  const attendanceMap = new Map<string, AttendanceDate[]>();
  attendanceDates.forEach((a) => {
    const existing = attendanceMap.get(a.date) || [];
    attendanceMap.set(a.date, [...existing, a]);
  });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calendario</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayAttendances = attendanceMap.get(dateStr) || [];
            const hasAttendance = dayAttendances.length > 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = today === dateStr;

            return (
              <div
                key={dateStr}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded-md text-sm transition-colors",
                  !isCurrentMonth && "text-muted-foreground/40",
                  isToday && "ring-2 ring-primary ring-offset-1",
                  hasAttendance && isCurrentMonth && "bg-primary/10"
                )}
              >
                <span className={cn(isToday && "font-bold")}>
                  {format(day, "d")}
                </span>
                {/* Attendance indicators */}
                {hasAttendance && isCurrentMonth && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayAttendances.slice(0, 3).map((att, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          CLASS_TYPE_COLORS[att.classType] || "bg-primary"
                        )}
                        title={CLASS_TYPE_NAMES[att.classType] || att.classType}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {Object.entries(CLASS_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="text-muted-foreground">
                {CLASS_TYPE_NAMES[type] || type}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
