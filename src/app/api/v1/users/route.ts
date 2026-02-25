import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiErrors } from "@/lib/api-errors";
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
} from "@/lib/pagination";
import type { Belt, Role, Prisma } from "@/generated/prisma";

// GET - List users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    // Solo instructores y admins pueden listar usuarios
    if (session.user.role === "ALUMNO") {
      return ApiErrors.forbidden("No tienes permisos para listar usuarios");
    }

    const { searchParams } = new URL(request.url);
    const belt = searchParams.get("belt") as Belt | null;
    const role = searchParams.get("role") as Role | null;
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const { page, limit } = parsePaginationParams(searchParams);

    const where: Prisma.UserWhereInput = {
      academyId: session.user.academyId,
    };

    // Filtro por cinturón
    if (belt) {
      where.belt = belt;
    }

    // Filtro por rol
    if (role) {
      where.role = role;
    }

    // Filtro por búsqueda (nombre o email)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro por estado activo
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        belt: true,
        stripe: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
      skip: calculateSkip(page, limit),
      take: limit,
    });

    return NextResponse.json(
      createPaginatedResponse(users, page, limit, total)
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return ApiErrors.internal("Error al obtener usuarios");
  }
}
