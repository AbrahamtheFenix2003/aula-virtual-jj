"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BeltBadge } from "@/components/dashboard/grades/belt-badge";
import { EXAM_RESULT_NAMES } from "@/types";
import type { Belt, Stripe, ExamResult } from "@/generated/prisma";

type EvaluationResult = "APROBADO" | "REPROBADO" | "NO_PRESENTADO";

interface ExamStudent {
  id: string;
  userId: string;
  result: ExamResult;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    belt: Belt;
    stripe: Stripe;
  };
}

interface EvaluationData {
  examStudentId: string;
  result: EvaluationResult;
  score?: number;
  feedback?: string;
}

interface ExamEvaluationFormProps {
  examId: string;
  students: ExamStudent[];
  beltTo: Belt;
}

export function ExamEvaluationForm({
  examId,
  students,
  beltTo,
}: ExamEvaluationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState<Map<string, EvaluationData>>(
    () => {
      const initial = new Map<string, EvaluationData>();
      students.forEach((student) => {
        if (student.result === "PENDIENTE") {
          initial.set(student.id, {
            examStudentId: student.id,
            result: "APROBADO",
            score: undefined,
            feedback: "",
          });
        }
      });
      return initial;
    }
  );

  const pendingStudents = students.filter((s) => s.result === "PENDIENTE");

  const updateEvaluation = (
    examStudentId: string,
    updates: Partial<EvaluationData>
  ) => {
    setEvaluations((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(examStudentId);
      if (current) {
        newMap.set(examStudentId, { ...current, ...updates });
      }
      return newMap;
    });
  };

  const handleSubmit = async () => {
    const evaluationArray = Array.from(evaluations.values());

    if (evaluationArray.length === 0) {
      toast.error("No hay evaluaciones para enviar");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/exams/${examId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations: evaluationArray }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Error al evaluar");
      }

      const { approved, failed, noShow } = result.data;

      toast.success(
        `Evaluaciones registradas: ${approved} aprobados, ${failed} reprobados, ${noShow} no presentados`
      );

      router.push(`/examenes/${examId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al evaluar examen"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingStudents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Todos los estudiantes ya han sido evaluados
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estudiante</TableHead>
            <TableHead>Cinturon actual</TableHead>
            <TableHead className="w-[150px]">Resultado</TableHead>
            <TableHead className="w-[100px]">Puntuacion</TableHead>
            <TableHead>Feedback</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingStudents.map((student) => {
            const evaluation = evaluations.get(student.id);
            return (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.user.avatar || undefined} />
                      <AvatarFallback>
                        {student.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <BeltBadge belt={student.user.belt} size="sm" />
                </TableCell>
                <TableCell>
                  <Select
                    value={evaluation?.result || "APROBADO"}
                    onValueChange={(value) =>
                      updateEvaluation(student.id, {
                        result: value as EvaluationResult,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APROBADO">
                        {EXAM_RESULT_NAMES.APROBADO}
                      </SelectItem>
                      <SelectItem value="REPROBADO">
                        {EXAM_RESULT_NAMES.REPROBADO}
                      </SelectItem>
                      <SelectItem value="NO_PRESENTADO">
                        {EXAM_RESULT_NAMES.NO_PRESENTADO}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={evaluation?.score || ""}
                    onChange={(e) =>
                      updateEvaluation(student.id, {
                        score: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })
                    }
                    disabled={evaluation?.result === "NO_PRESENTADO"}
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    placeholder="Comentarios..."
                    rows={1}
                    value={evaluation?.feedback || ""}
                    onChange={(e) =>
                      updateEvaluation(student.id, {
                        feedback: e.target.value,
                      })
                    }
                    className="min-h-[38px] resize-none"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Los estudiantes aprobados seran promovidos automaticamente a cinturon{" "}
          <strong>{beltTo}</strong>
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar evaluaciones ({pendingStudents.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
