export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardTabs from "./DashboardTabs";

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
    <main style={{ minHeight: "100vh", background: "var(--bg-color)" }}>
      {/* 🔴 මෙතන තිබුණු අමතර DashboardHeaderClient එක අයින් කළා. 
          දැන් DashboardTabs එකෙන් විතරයි Profile එක පෙන්නන්නේ */}
      <DashboardTabs user={user} />
    </main>
  );
}
