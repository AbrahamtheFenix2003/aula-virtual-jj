import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExamForm } from "@/components/dashboard/exams/exam-form";

export default async function NuevoExamenPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Solo instructores y admins pueden crear examenes
  if (session.user.role === "ALUMNO") {
    redirect("/examenes");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/examenes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a examenes
        </Link>
      </Button>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Examen de Graduacion</CardTitle>
          <CardDescription>
            Programa un nuevo examen para que los alumnos puedan ascender de
            cinturon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamForm />
        </CardContent>
      </Card>
    </div>
  );
}
