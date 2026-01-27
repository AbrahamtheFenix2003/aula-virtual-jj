# AGENTS.md - Aula Virtual Jiu-Jitsu

This document provides guidelines for AI coding agents working in this codebase.

## Project Overview

A virtual classroom platform for Jiu-Jitsu academies built with:
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (new-york style)
- **Database**: PostgreSQL with Prisma 7.3
- **Auth**: NextAuth.js v5 (Auth.js) with credentials provider
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio

# No test framework configured yet
# When adding tests, use Vitest:
# npm run test             # Run all tests
# npm run test -- path/to/file.test.ts  # Run single test file
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth route group (login, register)
│   ├── (dashboard)/        # Dashboard route group
│   ├── api/                # API routes
│   ├── globals.css         # Global styles + Tailwind
│   └── layout.tsx          # Root layout
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   └── ui/                 # shadcn/ui components (DO NOT MODIFY)
├── generated/
│   └── prisma/             # Generated Prisma client
├── lib/                    # Utilities and configurations
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   ├── utils.ts            # Utility functions (cn helper)
│   └── validations/        # Zod validation schemas
└── types/                  # TypeScript types and constants
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: Always use proper types, avoid `any`
- Use type inference where obvious, explicit types for function params/returns
- Import generated Prisma types from `@/generated/prisma`
- Use `type` keyword for type-only imports: `import type { Role } from "@/generated/prisma"`

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | kebab-case | `sidebar.tsx`, `video-card.tsx` |
| Files (utilities) | camelCase | `utils.ts`, `googleDrive.ts` |
| Components | PascalCase | `DashboardSidebar`, `VideoCard` |
| Functions | camelCase | `canAccessBeltContent`, `getVideoStream` |
| Constants | UPPER_SNAKE_CASE | `BELT_ORDER`, `BELT_COLORS` |
| Types/Interfaces | PascalCase | `SessionUser`, `ApiResponse` |
| Zod schemas | camelCase + Schema suffix | `loginSchema`, `createVideoSchema` |
| Enums (Prisma) | UPPER_SNAKE_CASE | `ALUMNO`, `INSTRUCTOR`, `ADMIN` |

### Import Order

Organize imports in this order:
```typescript
// 1. React/Next.js core
import { useState } from "react";
import { NextRequest, NextResponse } from "next/server";
import Link from "next/link";

// 2. Third-party libraries
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Video } from "lucide-react";

// 3. Internal aliases (@/)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/lib/validations";
import type { Role, Belt } from "@/generated/prisma";

// 4. Relative imports (rare, prefer aliases)
import { LocalComponent } from "./local-component";
```

### Component Patterns

**Client Components**:
```typescript
"use client";

import { useState } from "react";
// ... imports

export function ComponentName({ prop1, prop2 }: Props) {
  const [state, setState] = useState<Type>(initialValue);
  // ...
}
```

**Server Components** (default):
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PageName() {
  const session = await auth();
  // ...
}
```

### API Routes

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
    // ... logic
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Follow shadcn/ui patterns for component styling
- Use CSS variables defined in `globals.css` for theming

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-primary text-primary-foreground",
  className
)} />
```

### Form Validation

Use Zod schemas with React Hook Form:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});
```

### Error Handling

- API routes: try/catch with structured JSON responses
- Client: Display errors in UI with proper styling
- Use `console.error` for server-side logging
- Validation errors: Return from Zod schemas with Spanish messages

### Database Access

```typescript
import { prisma } from "@/lib/prisma";

// Always use select to limit returned fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
  },
});
```

## shadcn/ui Components

- Located in `src/components/ui/`
- **DO NOT modify** these files directly
- Add new components via CLI: `npx shadcn@latest add [component]`
- Components use the "new-york" style variant

## Authentication

- NextAuth v5 with JWT strategy
- Custom session types in `src/lib/auth.ts`
- Roles: `ALUMNO`, `INSTRUCTOR`, `ADMIN`
- Access session: `const session = await auth()` (server) or `useSession()` (client)
- Middleware handles route protection in `src/middleware.ts`

## Language

- UI text is in **Spanish** (Mexico)
- Code (variables, functions, comments) is in **English**
- Prisma schema and database values use Spanish terms for domain concepts

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret
- `GOOGLE_*` - Google Drive API credentials
- `STRIPE_*` - Stripe API keys
- `RESEND_API_KEY` - Resend email API key
