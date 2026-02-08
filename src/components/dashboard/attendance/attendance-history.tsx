"use client";

// 2. Third-party
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";

// 3. Internal (@/ alias)
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASS_TYPE_NAMES, BELT_COLORS, BELT_NAMES } from "@/types";
import type { Belt, ClassType } from "@/generated/prisma";

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

interface AttendanceHistoryProps {
  attendances: AttendanceRecord[];
  showUserColumn?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const CLASS_TYPE_VARIANTS: Record<string, string> = {
  GI: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  NOGI: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPETICION: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  INFANTIL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FUNDAMENTALS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  AVANZADO: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function AttendanceHistory({
  attendances,
  showUserColumn = false,
  canDelete = false,
  onDelete,
  isLoading = false,
}: AttendanceHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-muted animate-pulse rounded-md"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attendances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay asistencias registradas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Asistencias</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              {showUserColumn && <TableHead>Alumno</TableHead>}
              <TableHead>Tipo de Clase</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Notas</TableHead>
              {canDelete && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.map((attendance) => (
              <TableRow key={attendance.id}>
                <TableCell className="font-medium">
                  {format(new Date(attendance.date), "dd MMM yyyy", {
                    locale: es,
                  })}
                </TableCell>
                {showUserColumn && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor: BELT_COLORS[attendance.user.belt],
                        }}
                        title={BELT_NAMES[attendance.user.belt]}
                      />
                      <span>{attendance.user.name}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      CLASS_TYPE_VARIANTS[attendance.classType] || ""
                    )}
                  >
                    {CLASS_TYPE_NAMES[attendance.classType] ||
                      attendance.classType}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {attendance.classSchedule
                    ? `${attendance.classSchedule.startTime} - ${attendance.classSchedule.endTime}`
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {attendance.notes || "-"}
                </TableCell>
                {canDelete && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete?.(attendance.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
