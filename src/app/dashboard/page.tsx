import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardHeaderClient from "@/components/DashboardHeaderClient"; // අලුත් Client Component එක
import DashboardTabs from "./DashboardTabs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) redirect("/");

  const payload = await verifyJwt(sessionCookie.value);
  if (!payload || !payload.id) redirect("/"); 

  const user = await prisma.user.findUnique({ 
    where: { id: payload.id as string } 
  });
  
  if (!user) redirect("/");

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-color)", padding: "2rem" }}>
      {/* 🔵 නිල් රවුමේ කොටස (Name + Avatar Dropdown) */}
      <DashboardHeaderClient user={user} title="My Configs" />
      
      {/* ඔයාගේ පරණ Tabs ටික */}
      <DashboardTabs user={user} />
    </main>
  );
}
