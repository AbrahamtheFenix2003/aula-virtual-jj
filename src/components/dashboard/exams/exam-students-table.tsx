"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BeltBadge } from "@/components/dashboard/grades/belt-badge";
import { ExamResultBadge } from "./exam-status-badge";
import type { Belt, Stripe, ExamResult } from "@/generated/prisma";

interface StudentWithRequirements {
  id: string;
  userId: string;
  result: ExamResult;
  score?: number | null;
  feedback?: string | null;
  registeredAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    belt: Belt;
    stripe: Stripe;
  };
  requirements: {
    attendances: {
      current: number;
      required?: number | null;
      met: boolean;
    };
    videos: {
      current: number;
      required?: number | null;
      met: boolean;
    };
  };
}

interface ExamStudentsTableProps {
  students: StudentWithRequirements[];
  canManage: boolean;
  showResults?: boolean;
  onRemove?: (studentId: string) => void;
}

export function ExamStudentsTable({
  students,
  canManage,
  showResults = false,
  onRemove,
}: ExamStudentsTableProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay estudiantes inscritos en este examen
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estudiante</TableHead>
          <TableHead>Cinturon</TableHead>
          <TableHead>Asistencias</TableHead>
          <TableHead>Videos</TableHead>
          {showResults && <TableHead>Resultado</TableHead>}
          {canManage && <TableHead className="w-[100px]">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
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
              <BeltBadge
                belt={student.user.belt}
                stripe={student.user.stripe}
                size="sm"
              />
            </TableCell>
            <TableCell>
              <RequirementStatus
                current={student.requirements.attendances.current}
                required={student.requirements.attendances.required}
                met={student.requirements.attendances.met}
              />
            </TableCell>
            <TableCell>
              <RequirementStatus
                current={student.requirements.videos.current}
                required={student.requirements.videos.required}
                met={student.requirements.videos.met}
              />
            </TableCell>
            {showResults && (
              <TableCell>
                <ExamResultBadge result={student.result} />
                {student.score !== null && student.score !== undefined && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({student.score} pts)
                  </span>
                )}
              </TableCell>
            )}
            {canManage && (
              <TableCell>
                {student.result === "PENDIENTE" && onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemove(student.userId)}
                  >
                    Remover
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RequirementStatus({
  current,
  required,
  met,
}: {
  current: number;
  required?: number | null;
  met: boolean;
}) {
  if (!required) {
    return <span className="text-muted-foreground text-sm">N/A</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <span className={met ? "text-green-600" : "text-red-600"}>
        {current}/{required}
      </span>
    </div>
  );
}
