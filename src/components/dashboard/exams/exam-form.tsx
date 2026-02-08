"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createExamSchema } from "@/lib/validations";
import { BELT_NAMES, BELT_ORDER } from "@/types";
import type { Belt } from "@/generated/prisma";

interface ExamFormValues {
  title: string;
  date: Date;
  location?: string;
  description?: string;
  beltFrom: Belt;
  beltTo: Belt;
  maxStudents?: number;
  examFee?: number;
  minAttendances?: number;
  minVideosCompleted?: number;
}

interface ExamFormProps {
  onSuccess?: (examId: string) => void;
}

export function ExamForm({ onSuccess }: ExamFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(createExamSchema) as never,
    defaultValues: {
      beltFrom: "BLANCA",
      beltTo: "AZUL",
    },
  });

  const beltFrom = watch("beltFrom");

  // Filtrar cinturones destino (solo mayores que el origen)
  const availableBeltTo = BELT_ORDER.filter(
    (belt) => BELT_ORDER.indexOf(belt) > BELT_ORDER.indexOf(beltFrom as Belt)
  );

  const onSubmit = async (data: ExamFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: data.date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Error al crear examen");
      }

      toast.success("Examen creado exitosamente");

      if (onSuccess) {
        onSuccess(result.data.id);
      } else {
        router.push(`/examenes/${result.data.id}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear examen"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Titulo */}
      <div className="space-y-2">
        <Label htmlFor="title">Titulo del examen *</Label>
        <Input
          id="title"
          placeholder="Ej: Examen Cinturon Azul - Marzo 2024"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Fecha */}
      <div className="space-y-2">
        <Label>Fecha del examen *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date
                ? format(date, "PPP", { locale: es })
                : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                if (newDate) {
                  setValue("date", newDate);
                }
              }}
              disabled={(d) => d < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Ubicacion */}
      <div className="space-y-2">
        <Label htmlFor="location">Ubicacion</Label>
        <Input
          id="location"
          placeholder="Ej: Sede principal"
          {...register("location")}
        />
      </div>

      {/* Cinturones */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cinturon origen *</Label>
          <Select
            value={beltFrom}
            onValueChange={(value) => {
              setValue("beltFrom", value as Belt);
              // Reset beltTo si es menor o igual
              const fromIndex = BELT_ORDER.indexOf(value as Belt);
              const toIndex = BELT_ORDER.indexOf(watch("beltTo") as Belt);
              if (toIndex <= fromIndex) {
                const nextBelt = BELT_ORDER[fromIndex + 1];
                if (nextBelt) {
                  setValue("beltTo", nextBelt);
                }
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BELT_ORDER.slice(0, -1).map((belt) => (
                <SelectItem key={belt} value={belt}>
                  {BELT_NAMES[belt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cinturon destino *</Label>
          <Select
            value={watch("beltTo")}
            onValueChange={(value) => setValue("beltTo", value as Belt)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableBeltTo.map((belt) => (
                <SelectItem key={belt} value={belt}>
                  {BELT_NAMES[belt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descripcion */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <Textarea
          id="description"
          placeholder="Descripcion del examen, requisitos adicionales..."
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Requisitos */}
      <div className="space-y-4">
        <h3 className="font-medium">Requisitos (opcional)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minAttendances">Minimo de asistencias</Label>
            <Input
              id="minAttendances"
              type="number"
              min="0"
              placeholder="Ej: 30"
              {...register("minAttendances", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minVideosCompleted">Videos completados</Label>
            <Input
              id="minVideosCompleted"
              type="number"
              min="0"
              placeholder="Ej: 10"
              {...register("minVideosCompleted", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Configuracion */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxStudents">Cupo maximo</Label>
          <Input
            id="maxStudents"
            type="number"
            min="1"
            placeholder="Sin limite"
            {...register("maxStudents", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="examFee">Costo del examen</Label>
          <Input
            id="examFee"
            type="number"
            min="0"
            step="0.01"
            placeholder="Gratis"
            {...register("examFee", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear examen
        </Button>
      </div>
    </form>
  );
}
