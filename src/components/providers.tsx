"use client";

// 1. React/Next.js
import { ReactNode } from "react";

// 2. Third-party
import { SessionProvider } from "next-auth/react";

// 3. Internal (@/ alias)
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" />
    </SessionProvider>
  );
}
