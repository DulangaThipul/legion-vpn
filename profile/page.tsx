import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
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
    <div style={{ paddingTop: "2rem" }}>
      <ProfileClient user={user} />
    </div>
  );
}
