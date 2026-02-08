// 1. React/Next.js
import { redirect } from "next/navigation";

// 3. Internal (@/ alias)
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/videos");
  } else {
    redirect("/login");
  }
}
