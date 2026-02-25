"use client";

// 1. React/Next.js
import { useState, useMemo } from "react";

// 2. Third-party
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// 3. Internal (@/ alias)
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BELT_COLORS, BELT_NAMES, CLASS_TYPE_NAMES } from "@/types";
import type { Belt, ClassType } from "@/generated/prisma";
import { TodayClasses } from "./today-classes";

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

interface RegisterAttendanceProps {
  students: Student[];
  todayClasses: ClassScheduleItem[];
  onSuccess?: () => void;
}

const CLASS_TYPES = [
  "GI",
  "NOGI",
  "COMPETICION",
  "INFANTIL",
  "FUNDAMENTALS",
  "AVANZADO",
] as const;

export function RegisterAttendance({
  students,
  todayClasses,
  onSuccess,
}: RegisterAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClassType, setSelectedClassType] = useState<ClassType>("GI");
  const [selectedClassSchedule, setSelectedClassSchedule] =
    useState<ClassScheduleItem | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  // Handle individual selection
  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Handle class selection from today's classes
  const handleSelectClass = (classItem: ClassScheduleItem) => {
    setSelectedClassSchedule(classItem);
    setSelectedClassType(classItem.classType);
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Selecciona al menos un alumno");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedStudents),
          date: selectedDate.toISOString(),
          classType: selectedClassType,
          classScheduleId: selectedClassSchedule?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error al registrar asistencias");
      }

      toast.success(data.message || "Asistencias registradas correctamente");

      // Reset form
      setSelectedStudents(new Set());
      setSelectedClassSchedule(null);

      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSelected =
    filteredStudents.length > 0 &&
    selectedStudents.size === filteredStudents.length;
  const someSelected =
    selectedStudents.size > 0 &&
    selectedStudents.size < filteredStudents.length;

  return (
    <div className="space-y-6">
      {/* Today's classes */}
      {todayClasses.length > 0 && (
        <TodayClasses
          classes={todayClasses}
          selectedClassId={selectedClassSchedule?.id}
          onSelectClass={handleSelectClass}
        />
      )}

      {/* Date and class type selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registrar Asistencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Date picker */}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Class type */}
            <div className="space-y-2">
              <Label>Tipo de Clase</Label>
              <Select
                value={selectedClassType}
                onValueChange={(v) => setSelectedClassType(v as ClassType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CLASS_TYPE_NAMES[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alumno por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={allSelected}
                // @ts-expect-error - shadcn checkbox indeterminate
                indeterminate={someSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Seleccionar todos ({filteredStudents.length} alumnos)
              </Label>
            </div>
            {selectedStudents.size > 0 && (
              <Badge variant="secondary">
                {selectedStudents.size} seleccionados
              </Badge>
            )}
          </div>

          {/* Student list */}
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudents.has(student.id);

              return (
                <div
                  key={student.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleSelectStudent(student.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectStudent(student.id)}
                  />
                  <div
                    className="w-4 h-4 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: BELT_COLORS[student.belt] }}
                    title={BELT_NAMES[student.belt]}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.email}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No se encontraron alumnos
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={selectedStudents.size === 0 || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                Registrar {selectedStudents.size} asistencia
                {selectedStudents.size !== 1 && "s"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
