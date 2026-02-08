import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ClipboardCheck,
} from "lucide-react";
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
import { ExamStatusBadge } from "@/components/dashboard/exams/exam-status-badge";
import { ExamStudentsClient } from "./exam-students-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExamenDetallePage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const { user } = session;
  const canManage = user.role === "INSTRUCTOR" || user.role === "ADMIN";

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

  // Calcular requisitos para cada estudiante
  const studentsWithRequirements = await Promise.all(
    exam.students.map(async (student) => {
      let attendanceCount = 0;
      let videosCompleted = 0;

      if (exam.minAttendances) {
        attendanceCount = await prisma.attendance.count({
          where: { userId: student.userId },
        });
      }

      if (exam.minVideosCompleted) {
        videosCompleted = await prisma.videoProgress.count({
          where: {
            userId: student.userId,
            completed: true,
          },
        });
      }

      return {
        ...student,
        requirements: {
          attendances: {
            current: attendanceCount,
            required: exam.minAttendances,
            met: !exam.minAttendances || attendanceCount >= exam.minAttendances,
          },
          videos: {
            current: videosCompleted,
            required: exam.minVideosCompleted,
            met:
              !exam.minVideosCompleted ||
              videosCompleted >= exam.minVideosCompleted,
          },
        },
      };
    })
  );

  const isUpcoming = exam.status === "PROGRAMADO" || exam.status === "EN_CURSO";
  const isPast = exam.status === "COMPLETADO" || exam.status === "CANCELADO";
  const pendingCount = exam.students.filter(
    (s) => s.result === "PENDIENTE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/examenes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a examenes
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
            <ExamStatusBadge status={exam.status} />
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(exam.date, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </div>
            {exam.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {exam.location}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {exam.students.length} inscrito(s)
              {exam.maxStudents && ` / ${exam.maxStudents}`}
            </div>
          </div>
        </div>

        {canManage && isUpcoming && pendingCount > 0 && (
          <Button asChild>
            <Link href={`/examenes/${id}/evaluar`}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Evaluar ({pendingCount})
            </Link>
          </Button>
        )}
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promocion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <BeltBadge belt={exam.beltFrom} size="sm" />
            <span className="text-muted-foreground">→</span>
            <BeltBadge belt={exam.beltTo} size="sm" />
          </CardContent>
        </Card>

        {exam.minAttendances && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Asistencias requeridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{exam.minAttendances}</span>
            </CardContent>
          </Card>
        )}

        {exam.minVideosCompleted && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Videos requeridos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {exam.minVideosCompleted}
              </span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Descripcion */}
      {exam.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripcion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{exam.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Estudiantes inscritos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Estudiantes Inscritos</CardTitle>
            <CardDescription>
              {exam.students.length} estudiante(s) inscrito(s)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ExamStudentsClient
            examId={exam.id}
            beltFrom={exam.beltFrom}
            students={studentsWithRequirements}
            canManage={canManage}
            isUpcoming={isUpcoming}
            showResults={isPast || exam.status === "EN_CURSO"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
