"use client";

// 2. Third-party
import { Clock, Users } from "lucide-react";

// 3. Internal (@/ alias)
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CLASS_TYPE_NAMES } from "@/types";
import type { ClassType } from "@/generated/prisma";

interface ClassScheduleItem {
  id: string;
  name: string;
  classType: ClassType;
  startTime: string;
  endTime: string;
  maxCapacity?: number | null;
}

interface TodayClassesProps {
  classes: ClassScheduleItem[];
  selectedClassId?: string | null;
  onSelectClass?: (classSchedule: ClassScheduleItem) => void;
}

const CLASS_TYPE_COLORS: Record<string, string> = {
  GI: "border-blue-500 bg-blue-500/10",
  NOGI: "border-purple-500 bg-purple-500/10",
  COMPETICION: "border-red-500 bg-red-500/10",
  INFANTIL: "border-green-500 bg-green-500/10",
  FUNDAMENTALS: "border-yellow-500 bg-yellow-500/10",
  AVANZADO: "border-orange-500 bg-orange-500/10",
};

export function TodayClasses({
  classes,
  selectedClassId,
  onSelectClass,
}: TodayClassesProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No hay clases programadas para hoy
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Clases de hoy
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => {
          const isSelected = selectedClassId === classItem.id;

          return (
            <Card
              key={classItem.id}
              className={cn(
                "cursor-pointer transition-all border-2",
                CLASS_TYPE_COLORS[classItem.classType] || "border-border",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onSelectClass?.(classItem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {CLASS_TYPE_NAMES[classItem.classType] ||
                      classItem.classType}
                  </Badge>
                  {classItem.maxCapacity && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {classItem.maxCapacity}
                    </div>
                  )}
                </div>
                <h4 className="font-medium mb-1">{classItem.name}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {classItem.startTime} - {classItem.endTime}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
