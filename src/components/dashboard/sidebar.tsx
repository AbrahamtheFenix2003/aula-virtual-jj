"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Video,
  Calendar,
  CreditCard,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BELT_NAMES, BELT_COLORS } from "@/types";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: ("ALUMNO" | "INSTRUCTOR" | "ADMIN")[];
}

const navItems: NavItem[] = [
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/asistencias", label: "Asistencias", icon: Calendar },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/examenes", label: "Exámenes", icon: GraduationCap },
  {
    href: "/alumnos",
    label: "Alumnos",
    icon: Users,
    roles: ["INSTRUCTOR", "ADMIN"],
  },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["ADMIN"] },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userBelt = session?.user?.belt || "BLANCA";

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/videos" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">JJ</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Aula Virtual
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={session?.user?.image || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {session?.user?.name}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-sidebar-border"
                  style={{ backgroundColor: BELT_COLORS[userBelt] }}
                />
                <span className="text-xs text-sidebar-foreground/70">
                  {BELT_NAMES[userBelt]}
                </span>
              </div>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

function MobileSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userBelt = session?.user?.belt || "BLANCA";

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        {/* Header */}
        <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
          <Link href="/videos" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">JJ</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Aula Virtual
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {session?.user?.name}
              </p>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: BELT_COLORS[userBelt],
                  color: userBelt === "BLANCA" ? "#000" : "#FFF",
                }}
              >
                {BELT_NAMES[userBelt]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-background border-b flex items-center px-4">
        <MobileSidebar />
        <div className="flex-1 flex justify-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">JJ</span>
          </div>
        </div>
      </div>

      {/* Spacer for content */}
      <div
        className={cn(
          "hidden md:block transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      />
    </>
  );
}
