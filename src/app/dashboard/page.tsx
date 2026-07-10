export const dynamic = "force-dynamic";

import DashboardTabs from "./DashboardTabs";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) redirect("/");

  const payload = await verifyJwt(sessionCookie.value);
  if (!payload || !payload.userId) redirect("/");

  const user = await prisma.user.findUnique({ 
    where: { id: payload.userId as string } 
  });
  
  if (!user) redirect("/");

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-color)" }}>
      <DashboardTabs user={user} />
    </main>
  );
}
