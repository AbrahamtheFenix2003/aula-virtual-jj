// 1. React/Next.js
import { ReactNode } from "react";

// 3. Internal (@/ alias)
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Providers } from "@/components/providers";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 md:pt-0 pt-16">
          <div className="container max-w-7xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
