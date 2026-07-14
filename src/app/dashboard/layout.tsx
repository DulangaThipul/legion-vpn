import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
      {/* 🔴 රතු රවුමේ තිබුණු Duplicate DashboardHeader එක මෙතනින් සම්පූර්ණයෙන්ම ඉවත් කළා */}
      <main>
        {children}
      </main>
    </div>
  );
}
