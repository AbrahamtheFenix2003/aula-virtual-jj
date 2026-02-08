import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import {
  checkRateLimit,
  getClientIP,
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 solicitudes por IP por hora (muy estricto para prevenir abuso)
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(
      `forgot-password:${clientIP}`,
      RATE_LIMITS.AUTH_FORGOT_PASSWORD
    );

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter);
    }

    const body = await request.json();

    // Validar email
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Buscar usuario (no revelar si existe o no por seguridad)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    // Si el usuario no existe O es un usuario de OAuth (sin password),
    // responder igual para no revelar información
    if (!user || !user.password) {
      // Simular tiempo de procesamiento para no revelar si existe
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        message: "Si el email existe, recibirás un enlace de recuperación",
      });
    }

    // Eliminar tokens anteriores del mismo email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Generar token único
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // TODO: Enviar email con el enlace
    // Por ahora, mostrar en consola (solo desarrollo)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    console.log("========================================");
    console.log("ENLACE DE RECUPERACION DE CONTRASENA:");
    console.log(resetUrl);
    console.log("========================================");

    // En producción, aquí iría el envío de email:
    // await sendEmail({
    //   to: email,
    //   subject: "Recupera tu contraseña - Aula Virtual Jiu-Jitsu",
    //   html: `<a href="${resetUrl}">Restablecer contraseña</a>`,
    // });

    return NextResponse.json({
      message: "Si el email existe, recibirás un enlace de recuperación",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
