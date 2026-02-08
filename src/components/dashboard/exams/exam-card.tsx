"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MapPin, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BeltBadge } from "@/components/dashboard/grades/belt-badge";
import { ExamStatusBadge } from "./exam-status-badge";
import type { Belt, ExamStatus } from "@/generated/prisma";

interface ExamCardProps {
  id: string;
  title: string;
  date: Date | string;
  location?: string | null;
  beltFrom: Belt;
  beltTo: Belt;
  status: ExamStatus;
  studentsCount: number;
  maxStudents?: number | null;
}

export function ExamCard({
  id,
  title,
  date,
  location,
  beltFrom,
  beltTo,
  status,
  studentsCount,
  maxStudents,
}: ExamCardProps) {
  const examDate = typeof date === "string" ? new Date(date) : date;
  const isPast = examDate < new Date();
  const isCompleted = status === "COMPLETADO";
  const isCancelled = status === "CANCELADO";

  return (
    <Link href={`/examenes/${id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
            <ExamStatusBadge status={status} />
          </div>
          <CardDescription className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(examDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cinturones */}
          <div className="flex items-center gap-2 text-sm">
            <BeltBadge belt={beltFrom} size="sm" showName={false} />
            <span className="text-muted-foreground">→</span>
            <BeltBadge belt={beltTo} size="sm" />
          </div>

          {/* Ubicacion */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Inscritos */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {studentsCount} inscrito{studentsCount !== 1 && "s"}
              {maxStudents && (
                <span className="text-muted-foreground"> / {maxStudents}</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
