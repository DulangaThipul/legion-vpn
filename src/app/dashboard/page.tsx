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
  
  // 💡 FIX: payload.userId වෙනුවට payload.id ලෙස වෙනස් කරන ලදී
  if (!payload || !payload.id) redirect("/"); 

  const user = await prisma.user.findUnique({ 
    // 💡 FIX: මෙතනත් payload.id ලෙස වෙනස් කරන ලදී
    where: { id: payload.id as string } 
  });
  
  if (!user) redirect("/");

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-color)" }}>
      <DashboardTabs user={user} />
    </main>
  );
}
