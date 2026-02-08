# AGENTS.md - Aula Virtual Jiu-Jitsu

Guidelines for AI coding agents working in this Next.js 16 + TypeScript + Prisma 7 codebase.

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- **UI**: Tailwind CSS 4, shadcn/ui (new-york style), Lucide icons
- **Database**: PostgreSQL + Prisma 7 with `@prisma/adapter-pg`
- **Auth**: NextAuth.js v5 (Auth.js) with JWT strategy
- **Forms**: React Hook Form + Zod 4 validation

## Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build && npm run start # Production build

# Linting
npm run lint                   # ESLint (Next.js core-web-vitals + typescript)

# Database
npm run db:generate            # Generate Prisma client
npm run db:push                # Push schema to database
npm run db:migrate             # Create migration (dev)
npm run db:seed                # Seed database
npm run db:studio              # Open Prisma Studio

# Docker
npm run docker:dev             # Start dev environment with hot-reload
npm run docker:dev:down        # Stop dev environment

# Tests (not configured - when adding, use Vitest)
# npm run test                 # Run all tests
# npm run test -- path/to/file.test.ts  # Single test
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Auth route group (login, register)
│   ├── (dashboard)/        # Protected dashboard routes
│   └── api/                # API routes
├── components/
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # shadcn/ui (DO NOT MODIFY - use CLI to add)
├── generated/prisma/       # Generated Prisma client (auto-generated)
├── lib/
│   ├── auth.ts             # NextAuth config + session types
│   ├── prisma.ts           # Prisma client singleton
│   ├── utils.ts            # cn() helper
│   └── validations/        # Zod schemas
└── types/                  # TypeScript types & constants
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component files | kebab-case | `video-card.tsx` |
| Utility files | camelCase | `googleDrive.ts` |
| Components | PascalCase | `VideoCard` |
| Functions/variables | camelCase | `canAccessContent` |
| Constants | UPPER_SNAKE | `BELT_ORDER` |
| Types/Interfaces | PascalCase | `SessionUser` |
| Zod schemas | camelCase + Schema | `loginSchema` |
| Prisma enums | UPPER_SNAKE | `ALUMNO`, `INSTRUCTOR` |

## Import Order

```typescript
// 1. React/Next.js
import { useState } from "react";
import { NextRequest, NextResponse } from "next/server";

// 2. Third-party
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

// 3. Internal (@/ alias)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma";

// 4. Relative (avoid when possible)
import { LocalThing } from "./local";
```

## Component Patterns

```typescript
// Client Component
"use client";
import { useState } from "react";

export function MyComponent({ prop }: Props) {
  const [state, setState] = useState<Type>(initial);
  return <div>...</div>;
}

// Server Component (default - no directive needed)
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  return <div>...</div>;
}
```

## API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    const data = await prisma.model.findUnique({ where: { id } });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

## Database Access

```typescript
import { prisma } from "@/lib/prisma";

// Always use select to limit fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, role: true },
});
```

## Form Validation

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";

const { register, handleSubmit, formState: { errors, isSubmitting } } = 
  useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
```

## Styling

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-primary text-primary-foreground",
  className
)} />
```

## Key Rules

1. **TypeScript**: Strict mode - avoid `any`, use proper types
2. **Prisma types**: Import from `@/generated/prisma`
3. **shadcn/ui**: Never modify `src/components/ui/*` - add via `npx shadcn@latest add`
4. **Error messages**: Spanish for UI, English for code/comments
5. **Auth roles**: `ALUMNO`, `INSTRUCTOR`, `ADMIN` (use `await auth()` server-side)
6. **Validation**: Zod schemas in `src/lib/validations/` with Spanish messages
7. **Progress Tracking**: Mantener actualizado el archivo `PROJECT_STATUS.md` al finalizar cada tarea significativa o cambio en el roadmap.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection
- `AUTH_SECRET` / `NEXTAUTH_SECRET` - Auth.js secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` - Payments
