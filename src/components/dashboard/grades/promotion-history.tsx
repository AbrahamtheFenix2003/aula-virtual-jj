"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Award, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BeltBadge, BeltIndicator } from "./belt-badge";
import { STRIPE_NAMES } from "@/types";
import type { Belt, Stripe } from "@/generated/prisma";

interface Promotion {
  id: string;
  fromBelt: Belt;
  fromStripe: Stripe;
  toBelt: Belt;
  toStripe: Stripe;
  promotedAt: Date | string;
  notes?: string | null;
  examId?: string | null;
  promotedBy: {
    id: string;
    name: string;
  };
}

interface PromotionHistoryProps {
  promotions: Promotion[];
  showInstructor?: boolean;
}

export function PromotionHistory({
  promotions,
  showInstructor = true,
}: PromotionHistoryProps) {
  if (promotions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No hay promociones registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {promotions.map((promotion) => {
        const promotedAt =
          typeof promotion.promotedAt === "string"
            ? new Date(promotion.promotedAt)
            : promotion.promotedAt;

        return (
          <Card key={promotion.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                {/* Icono */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Cambio de cinturon */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <BeltBadge
                      belt={promotion.fromBelt}
                      stripe={promotion.fromStripe}
                      size="sm"
                      showStripe
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <BeltBadge
                      belt={promotion.toBelt}
                      stripe={promotion.toStripe}
                      size="sm"
                      showStripe
                    />
                  </div>

                  {/* Notas */}
                  {promotion.notes && (
                    <p className="text-sm text-muted-foreground">
                      {promotion.notes}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(promotedAt, "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    {showInstructor && (
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {promotion.promotedBy.name}
                      </div>
                    )}
                    {promotion.examId && (
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        Examen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface CurrentGradeCardProps {
  belt: Belt;
  stripe: Stripe;
  promotionsCount: number;
  lastPromotionDate?: Date | string | null;
}

export function CurrentGradeCard({
  belt,
  stripe,
  promotionsCount,
  lastPromotionDate,
}: CurrentGradeCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-6">
          {/* Indicador visual grande */}
          <div className="flex-shrink-0">
            <BeltIndicator belt={belt} stripe={stripe} className="h-6 w-24" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <BeltBadge belt={belt} stripe={stripe} size="lg" showStripe />
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{promotionsCount} promociones</span>
              {lastPromotionDate && (
                <span>
                  Ultima:{" "}
                  {format(
                    typeof lastPromotionDate === "string"
                      ? new Date(lastPromotionDate)
                      : lastPromotionDate,
                    "d MMM yyyy",
                    { locale: es }
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
