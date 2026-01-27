import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirigir al listado de videos por defecto
  redirect("/videos");
}
