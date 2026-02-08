import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import {
  checkRateLimit,
  getClientIP,
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 registros por IP cada 15 minutos
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(
      `register:${clientIP}`,
      RATE_LIMITS.AUTH_STRICT
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter);
    }

    const body = await request.json();

    // Validar datos
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Obtener academia por defecto
    const defaultAcademy = await prisma.academy.findFirst({
      where: { slug: "academia-principal" },
    });

    if (!defaultAcademy) {
      console.error("No se encontró la academia por defecto");
      return NextResponse.json(
        { error: "Error de configuración del sistema" },
        { status: 500 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "ALUMNO",
        belt: "BLANCA",
        stripe: "CERO",
        academyId: defaultAcademy.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
