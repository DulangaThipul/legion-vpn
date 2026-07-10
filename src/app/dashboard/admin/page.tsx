export const dynamic = "force-dynamic";

import AdminDashboardClient from "./AdminDashboardClient";
import Link from "next/link";
import DashboardMatrix from "@/components/DashboardMatrix";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAdminUsers } from "@/lib/authActions";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) redirect("/");

  const payload = await verifyJwt(sessionCookie.value);
  if (!payload || !payload.userId) redirect("/");

  const user = await prisma.user.findUnique({ 
    where: { id: payload.userId as string } 
  });
  
  if (!user) redirect("/");

  if (user.email !== "dulangathipul@gmail.com") {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#050505", 
        color: "#FFFFFF", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        position: "relative",
        zIndex: 1
      }}>
        <DashboardMatrix />
        <div className="glass-panel" style={{ padding: "4rem", border: "1px solid rgba(255,0,0,0.3)", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "3rem", margin: "0 0 1rem 0", color: "#FFFFFF", textShadow: "0 0 20px rgba(255,255,255,0.5)" }}>403</h1>
          <h2 style={{ fontSize: "1.5rem", margin: "0 0 2rem 0", color: "var(--muted-text)" }}>Access Denied</h2>
          <p style={{ lineHeight: 1.6, marginBottom: "3rem", color: "rgba(255,255,255,0.6)" }}>
            You do not have the required administrative privileges to view this sector. The incident has been logged.
          </p>
          <Link href="/dashboard" style={{
            display: "inline-block",
            padding: "1rem 2rem",
            background: "#FFFFFF",
            color: "#000000",
            textDecoration: "none",
            fontWeight: "bold",
            borderRadius: "30px",
            boxShadow: "0 0 15px rgba(255,255,255,0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 0 25px rgba(255,255,255,0.8)"}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.3)"}
          >
            Return to Safety
          </Link>
        </div>
      </div>
    );
  }

  // 🛠️ පරණ කෙලින්ම කරපු prisma.user.findMany එක වෙනුවට සර්වර් ඇක්ෂන් එකෙන් දත්ත ගන්නවා:
  const result = await getAdminUsers();
  const allUsers = result.users;

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, color: "#FFFFFF" }}>
      <DashboardMatrix />
      <AdminDashboardClient initialUsers={allUsers} />
    </div>
  );
}
