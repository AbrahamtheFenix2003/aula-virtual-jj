import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BeltBadge } from "@/components/dashboard/grades/belt-badge";
import { ExamEvaluationForm } from "@/components/dashboard/exams/exam-evaluation-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EvaluarExamenPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const { user } = session;

  // Solo instructores y admins pueden evaluar
  if (user.role === "ALUMNO") {
    redirect(`/examenes/${id}`);
  }

  // Obtener examen con estudiantes
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              belt: true,
              stripe: true,
            },
          },
        },
        orderBy: { registeredAt: "asc" },
      },
    },
  });

  if (!exam || exam.academyId !== user.academyId) {
    notFound();
  }

  // No permitir evaluar examenes cancelados
  if (exam.status === "CANCELADO") {
    redirect(`/examenes/${id}`);
  }

  // No permitir evaluar si ya fue completado
  if (exam.status === "COMPLETADO") {
    redirect(`/examenes/${id}`);
  }

  const pendingStudents = exam.students.filter(
    (s) => s.result === "PENDIENTE"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href={`/examenes/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al examen
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluar Examen</CardTitle>
          <CardDescription>{exam.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Promocion:</span>
            <BeltBadge belt={exam.beltFrom} size="sm" />
            <span className="text-muted-foreground">→</span>
            <BeltBadge belt={exam.beltTo} size="sm" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {pendingStudents.length} estudiante(s) pendiente(s) de evaluacion
          </p>
        </CardContent>
      </Card>

      {/* Formulario de evaluacion */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Registra el resultado de cada estudiante. Los aprobados seran
            promovidos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamEvaluationForm
            examId={exam.id}
            students={exam.students}
            beltTo={exam.beltTo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
