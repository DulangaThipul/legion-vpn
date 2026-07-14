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
  
  // 💡 ආරක්ෂිත JWT වෙරිෆිකේෂන් එක (payload.id)
  if (!payload || !payload.id) redirect("/"); 

  const user = await prisma.user.findUnique({ 
    where: { id: payload.id as string } 
  });
  
  if (!user) redirect("/");

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-color)" }}>
      {/* 🔮 මුළු Dashboard එකම Antigravity Wrapper එක ඇතුළට දැම්මා */}
      <AntigravityWrapper>
        <DashboardTabs user={user} />
      </AntigravityWrapper>
    </main>
  );
}
