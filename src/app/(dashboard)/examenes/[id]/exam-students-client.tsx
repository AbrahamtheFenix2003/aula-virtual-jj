"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ExamStudentsTable } from "@/components/dashboard/exams/exam-students-table";
import { StudentEnrollmentDialog } from "@/components/dashboard/exams/student-enrollment-dialog";
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

interface ExamStudentsClientProps {
  examId: string;
  beltFrom: Belt;
  students: StudentWithRequirements[];
  canManage: boolean;
  isUpcoming: boolean;
  showResults: boolean;
}

export function ExamStudentsClient({
  examId,
  beltFrom,
  students,
  canManage,
  isUpcoming,
  showResults,
}: ExamStudentsClientProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const enrolledStudentIds = students.map((s) => s.userId);

  const handleRemove = async (studentId: string) => {
    setRemovingId(studentId);
    try {
      const response = await fetch(
        `/api/v1/exams/${examId}/students/${studentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Error al desinscribir");
      }

      toast.success("Estudiante removido del examen");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al desinscribir"
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleEnrollSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Boton de inscribir (solo si puede gestionar y el examen esta activo) */}
      {canManage && isUpcoming && (
        <div className="flex justify-end">
          <StudentEnrollmentDialog
            examId={examId}
            beltFrom={beltFrom}
            enrolledStudentIds={enrolledStudentIds}
            onEnroll={handleEnrollSuccess}
          />
        </div>
      )}

      {/* Tabla de estudiantes */}
      <ExamStudentsTable
        students={students}
        canManage={canManage && isUpcoming}
        showResults={showResults}
        onRemove={canManage && isUpcoming ? handleRemove : undefined}
      />
    </div>
  );
}
