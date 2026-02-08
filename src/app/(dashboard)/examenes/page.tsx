import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamCard } from "@/components/dashboard/exams/exam-card";
import type { Exam } from "@/generated/prisma";

type ExamWithCount = Exam & { _count: { students: number } };

function ExamGrid({ exams }: { exams: ExamWithCount[] }) {
  if (exams.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay examenes en esta categoria
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          id={exam.id}
          title={exam.title}
          date={exam.date}
          location={exam.location}
          beltFrom={exam.beltFrom}
          beltTo={exam.beltTo}
          status={exam.status}
          studentsCount={exam._count.students}
          maxStudents={exam.maxStudents}
        />
      ))}
    </div>
  );
}

export default async function ExamenesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const canManage = user.role === "INSTRUCTOR" || user.role === "ADMIN";

  // Obtener todos los examenes de la academia
  const exams = await prisma.exam.findMany({
    where: { academyId: user.academyId },
    include: {
      _count: { select: { students: true } },
    },
    orderBy: { date: "desc" },
  });

  // Agrupar por estado
  const groupedExams = {
    PROGRAMADO: exams.filter((e) => e.status === "PROGRAMADO"),
    EN_CURSO: exams.filter((e) => e.status === "EN_CURSO"),
    COMPLETADO: exams.filter((e) => e.status === "COMPLETADO"),
    CANCELADO: exams.filter((e) => e.status === "CANCELADO"),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8" />
            Examenes
          </h1>
          <p className="text-muted-foreground mt-1">
            Examenes de graduacion de la academia
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/examenes/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo examen
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs por estado */}
      <Tabs defaultValue="PROGRAMADO">
        <TabsList>
          <TabsTrigger value="PROGRAMADO">
            Programados ({groupedExams.PROGRAMADO.length})
          </TabsTrigger>
          <TabsTrigger value="EN_CURSO">
            En Curso ({groupedExams.EN_CURSO.length})
          </TabsTrigger>
          <TabsTrigger value="COMPLETADO">
            Completados ({groupedExams.COMPLETADO.length})
          </TabsTrigger>
          <TabsTrigger value="CANCELADO">
            Cancelados ({groupedExams.CANCELADO.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PROGRAMADO" className="mt-6">
          <ExamGrid exams={groupedExams.PROGRAMADO} />
        </TabsContent>

        <TabsContent value="EN_CURSO" className="mt-6">
          <ExamGrid exams={groupedExams.EN_CURSO} />
        </TabsContent>

        <TabsContent value="COMPLETADO" className="mt-6">
          <ExamGrid exams={groupedExams.COMPLETADO} />
        </TabsContent>

        <TabsContent value="CANCELADO" className="mt-6">
          <ExamGrid exams={groupedExams.CANCELADO} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
