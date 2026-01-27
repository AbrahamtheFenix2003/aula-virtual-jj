import { z } from "zod";

// ============================================
// VALIDACIONES DE AUTENTICACIÓN
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// ============================================
// VALIDACIONES DE USUARIO
// ============================================

export const updateUserSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").optional(),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ALUMNO", "INSTRUCTOR", "ADMIN"]),
});

export const updateUserBeltSchema = z.object({
  belt: z.enum([
    "BLANCA",
    "AZUL",
    "PURPURA",
    "MARRON",
    "NEGRA",
    "CORAL",
    "ROJA",
  ]),
  stripe: z.enum(["CERO", "UNO", "DOS", "TRES", "CUATRO"]),
});

// ============================================
// VALIDACIONES DE VIDEO
// ============================================

export const createVideoSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().optional(),
  driveFileId: z.string().min(1, "ID de archivo requerido"),
  driveFolderId: z.string().optional(),
  duration: z.number().int().positive(),
  category: z.enum([
    "GUARDIA",
    "PASE_DE_GUARDIA",
    "MONTADA",
    "ESPALDA",
    "LATERAL",
    "SUMISION",
    "DEFENSA",
    "BARRIDA",
    "TAKEDOWN",
    "ESCAPE",
    "DRILL",
    "COMPETICION",
  ]),
  minBelt: z
    .enum(["BLANCA", "AZUL", "PURPURA", "MARRON", "NEGRA", "CORAL", "ROJA"])
    .default("BLANCA"),
  maxBelt: z
    .enum(["BLANCA", "AZUL", "PURPURA", "MARRON", "NEGRA", "CORAL", "ROJA"])
    .optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
});

export const updateVideoProgressSchema = z.object({
  videoId: z.string(),
  progress: z.number().int().min(0),
  percentage: z.number().int().min(0).max(100),
});

// ============================================
// VALIDACIONES DE ASISTENCIA
// ============================================

export const createAttendanceSchema = z.object({
  userId: z.string(),
  date: z.coerce.date(),
  classType: z.enum([
    "GI",
    "NOGI",
    "COMPETICION",
    "INFANTIL",
    "FUNDAMENTALS",
    "AVANZADO",
  ]),
  classScheduleId: z.string().optional(),
  notes: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  userIds: z.array(z.string()).min(1),
  date: z.coerce.date(),
  classType: z.enum([
    "GI",
    "NOGI",
    "COMPETICION",
    "INFANTIL",
    "FUNDAMENTALS",
    "AVANZADO",
  ]),
  classScheduleId: z.string().optional(),
});

// ============================================
// VALIDACIONES DE PAGO
// ============================================

export const createPaymentSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  type: z.enum([
    "MENSUALIDAD",
    "TRIMESTRAL",
    "SEMESTRAL",
    "ANUAL",
    "CLASE_SUELTA",
    "EXAMEN",
    "EQUIPAMIENTO",
  ]),
  method: z.enum(["STRIPE", "EFECTIVO", "TRANSFERENCIA"]).default("STRIPE"),
  description: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});

// ============================================
// VALIDACIONES DE EXAMEN
// ============================================

export const createExamSchema = z.object({
  title: z.string().min(3),
  date: z.coerce.date(),
  location: z.string().optional(),
  description: z.string().optional(),
  beltFrom: z.enum([
    "BLANCA",
    "AZUL",
    "PURPURA",
    "MARRON",
    "NEGRA",
    "CORAL",
    "ROJA",
  ]),
  beltTo: z.enum([
    "BLANCA",
    "AZUL",
    "PURPURA",
    "MARRON",
    "NEGRA",
    "CORAL",
    "ROJA",
  ]),
  maxStudents: z.number().int().positive().optional(),
  examFee: z.number().positive().optional(),
  minAttendances: z.number().int().min(0).optional(),
  minVideosCompleted: z.number().int().min(0).optional(),
});

export const registerExamStudentSchema = z.object({
  examId: z.string(),
  userId: z.string(),
});

export const updateExamResultSchema = z.object({
  result: z.enum(["PENDIENTE", "APROBADO", "REPROBADO", "NO_PRESENTADO"]),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().optional(),
});

// ============================================
// TYPES EXPORTADOS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
