import { Role, Belt, Stripe as BeltStripe } from "@/generated/prisma";

// ============================================
// TIPOS DE SESIÓN Y AUTH
// ============================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  belt: Belt;
  stripe: BeltStripe;
  avatar?: string | null;
  academyId: string;
}

// ============================================
// TIPOS DE RESPUESTA API
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// TIPOS DE DASHBOARD
// ============================================

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalVideos: number;
  attendancesThisMonth: number;
  pendingPayments: number;
  upcomingExams: number;
}

export interface StudentDashboard {
  attendancesThisMonth: number;
  totalAttendances: number;
  videosCompleted: number;
  totalVideos: number;
  nextExam?: {
    id: string;
    title: string;
    date: Date;
    beltTo: Belt;
  };
  paymentStatus: "AL_DIA" | "PENDIENTE" | "VENCIDO";
}

// ============================================
// TIPOS DE VIDEO
// ============================================

export interface VideoWithProgress {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  duration: number;
  category: string;
  minBelt: Belt;
  progress?: {
    percentage: number;
    completed: boolean;
  };
}

// ============================================
// TIPOS DE CINTURÓN
// ============================================

export const BELT_ORDER: Belt[] = [
  "BLANCA",
  "AZUL",
  "PURPURA",
  "MARRON",
  "NEGRA",
  "CORAL",
  "ROJA",
];

export const BELT_COLORS: Record<Belt, string> = {
  BLANCA: "#FFFFFF",
  AZUL: "#2563EB",
  PURPURA: "#7C3AED",
  MARRON: "#92400E",
  NEGRA: "#0A0A0A",
  CORAL: "#F97316",
  ROJA: "#DC2626",
};

export const BELT_NAMES: Record<Belt, string> = {
  BLANCA: "Blanca",
  AZUL: "Azul",
  PURPURA: "Púrpura",
  MARRON: "Marrón",
  NEGRA: "Negra",
  CORAL: "Coral",
  ROJA: "Roja",
};

// ============================================
// TIPOS DE CLASE
// ============================================

export const CLASS_TYPE_NAMES: Record<string, string> = {
  GI: "Gi",
  NOGI: "No-Gi",
  COMPETICION: "Competición",
  INFANTIL: "Infantil",
  FUNDAMENTALS: "Fundamentos",
  AVANZADO: "Avanzado",
};

// ============================================
// TIPOS DE CATEGORÍA DE VIDEO
// ============================================

export const VIDEO_CATEGORY_NAMES: Record<string, string> = {
  GUARDIA: "Guardia",
  PASE_DE_GUARDIA: "Pase de Guardia",
  MONTADA: "Montada",
  ESPALDA: "Espalda",
  LATERAL: "Lateral",
  SUMISION: "Sumisión",
  DEFENSA: "Defensa",
  BARRIDA: "Barrida",
  TAKEDOWN: "Takedown",
  ESCAPE: "Escape",
  DRILL: "Drill",
  COMPETICION: "Competición",
};

// ============================================
// UTILIDADES DE TIPO
// ============================================

export function compareBelts(belt1: Belt, belt2: Belt): number {
  return BELT_ORDER.indexOf(belt1) - BELT_ORDER.indexOf(belt2);
}

export function canAccessBeltContent(
  userBelt: Belt,
  minBelt: Belt,
  maxBelt?: Belt | null
): boolean {
  const userIndex = BELT_ORDER.indexOf(userBelt);
  const minIndex = BELT_ORDER.indexOf(minBelt);
  const maxIndex = maxBelt ? BELT_ORDER.indexOf(maxBelt) : Infinity;

  return userIndex >= minIndex && userIndex <= maxIndex;
}
