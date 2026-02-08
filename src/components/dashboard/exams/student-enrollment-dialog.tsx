"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BeltBadge } from "@/components/dashboard/grades/belt-badge";
import type { Belt, Stripe } from "@/generated/prisma";

interface EligibleStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  belt: Belt;
  stripe: Stripe;
}

interface StudentEnrollmentDialogProps {
  examId: string;
  beltFrom: Belt;
  enrolledStudentIds: string[];
  onEnroll: () => void;
}

export function StudentEnrollmentDialog({
  examId,
  beltFrom,
  enrolledStudentIds,
  onEnroll,
}: StudentEnrollmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Cargar estudiantes elegibles cuando se abre el dialog
  useEffect(() => {
    if (open) {
      loadEligibleStudents();
    }
  }, [open, beltFrom]);

  const loadEligibleStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/users?belt=${beltFrom}&role=ALUMNO`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      !enrolledStudentIds.includes(student.id) &&
      (student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggle = (studentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedIds(newSelected);
  };

  const handleEnrollSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const studentId of selectedIds) {
      try {
        const response = await fetch(`/api/v1/exams/${examId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast.success(`${successCount} estudiante(s) inscrito(s)`);
      onEnroll();
      setSelectedIds(new Set());
      setOpen(false);
    }

    if (errorCount > 0) {
      toast.error(`Error al inscribir ${errorCount} estudiante(s)`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Inscribir alumnos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inscribir alumnos al examen</DialogTitle>
          <DialogDescription>
            Selecciona los alumnos con cinturon {beltFrom} que deseas inscribir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Lista de estudiantes */}
          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay alumnos elegibles disponibles
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleToggle(student.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(student.id)}
                      onCheckedChange={() => handleToggle(student.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatar || undefined} />
                      <AvatarFallback>
                        {student.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{student.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {student.email}
                      </div>
                    </div>
                    <BeltBadge belt={student.belt} size="sm" showName={false} />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Acciones */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEnrollSelected}
                disabled={selectedIds.size === 0 || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Inscribir ({selectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
