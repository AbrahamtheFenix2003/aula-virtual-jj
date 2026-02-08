import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PromotionHistory,
  CurrentGradeCard,
} from "@/components/dashboard/grades/promotion-history";

export default async function GradosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  // Obtener promociones del usuario (o de la academia si es gestor)
  const promotions = await prisma.beltPromotion.findMany({
    where:
      user.role === "ALUMNO"
        ? { studentId: user.id }
        : { student: { academyId: user.academyId } },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      promotedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { promotedAt: "desc" },
    take: 50,
  });

  // Para alumnos, obtener sus propias promociones
  const myPromotions =
    user.role === "ALUMNO"
      ? promotions
      : promotions.filter((p) => p.studentId === user.id);

  const lastPromotion = myPromotions[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Award className="h-8 w-8" />
          Mi Grado
        </h1>
        <p className="text-muted-foreground mt-1">
          Tu progreso y historial de promociones
        </p>
      </div>

      {/* Grado actual */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Grado Actual</h2>
        <CurrentGradeCard
          belt={user.belt}
          stripe={user.stripe}
          promotionsCount={myPromotions.length}
          lastPromotionDate={lastPromotion?.promotedAt}
        />
      </section>

      {/* Historial */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Historial de Promociones</h2>
        <PromotionHistory
          promotions={myPromotions}
          showInstructor={user.role !== "ALUMNO"}
        />
      </section>

      {/* Para gestores: ver todas las promociones recientes de la academia */}
      {user.role !== "ALUMNO" && promotions.length > myPromotions.length && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Promociones Recientes de la Academia
          </h2>
          <PromotionHistory
            promotions={promotions.filter((p) => p.studentId !== user.id)}
            showInstructor
          />
        </section>
      )}
    </div>
  );
}
