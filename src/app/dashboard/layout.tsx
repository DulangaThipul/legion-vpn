import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <div style={{ minHeight: "100vh", background: "var(--bg-color)" }}>
      {/* 🔮 Dashboard එකේ හැමතැනම පෙන්නන අලුත් Header එක */}
      <DashboardHeader user={user} />
      
      {/* අනිත් පිටු වල කන්ටෙන්ට් එක (My Configs, Buy Configs etc.) මෙතනින් යටට වැටෙනවා */}
      <main>
        {children}
      </main>
    </div>
  );
}
