"use client";

// 2. Third-party
import { Calendar, Flame, TrendingUp, Award } from "lucide-react";

// 3. Internal (@/ alias)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASS_TYPE_NAMES } from "@/types";

interface AttendanceStatsProps {
  totalAttendances: number;
  thisMonthAttendances: number;
  currentStreak: number;
  favoriteClassType: string | null;
}

export function AttendanceStats({
  totalAttendances,
  thisMonthAttendances,
  currentStreak,
  favoriteClassType,
}: AttendanceStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{thisMonthAttendances}</div>
          <p className="text-xs text-muted-foreground">asistencias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAttendances}</div>
          <p className="text-xs text-muted-foreground">desde el inicio</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">
            {currentStreak}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentStreak === 1 ? "día consecutivo" : "días consecutivos"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Clase Favorita</CardTitle>
          <Award className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {favoriteClassType
              ? CLASS_TYPE_NAMES[favoriteClassType] || favoriteClassType
              : "-"}
          </div>
          <p className="text-xs text-muted-foreground">más asistencias</p>
        </CardContent>
      </Card>
    </div>
  );
}
