import { SessionProvider } from "next-auth/react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 md:pt-0 pt-16">
          <div className="container max-w-7xl mx-auto p-6">{children}</div>
        </main>
        <Toaster position="top-right" />
      </div>
    </SessionProvider>
  );
}
