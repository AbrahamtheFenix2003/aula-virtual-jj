import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import {
  checkRateLimit,
  getClientIP,
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/rate-limit";

// GET: Validar si el token es válido
export async function GET(request: NextRequest) {
  try {
    // Rate limiting para validación de token
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(
      `reset-password-check:${clientIP}`,
      RATE_LIMITS.AUTH_STANDARD
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter);
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false });
    }

    // Verificar si expiró
    if (resetToken.expires < new Date()) {
      // Eliminar token expirado
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error validando token:", error);
    return NextResponse.json({ valid: false });
  }
}

// POST: Restablecer contraseña
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 intentos por IP cada 15 minutos
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(
      `reset-password:${clientIP}`,
      RATE_LIMITS.AUTH_STRICT
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter);
    }

    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 400 }
      );
    }

    // Validar contraseña
    const parsed = resetPasswordSchema.safeParse({
      password,
      confirmPassword: password,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Buscar token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    // Verificar si expiró
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        { error: "El enlace ha expirado" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 400 }
      );
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Eliminar token usado
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json(
      { error: "Error al restablecer la contraseña" },
      { status: 500 }
    );
  }
}
