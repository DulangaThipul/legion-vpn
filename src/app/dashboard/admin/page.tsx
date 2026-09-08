export const dynamic = "force-dynamic";

import AdminDashboardClient from "./AdminDashboardClient";
import DashboardMatrix from "@/components/DashboardMatrix";
import { redirect } from "next/navigation";
import { getAdminData } from "@/lib/authActions";

export default async function AdminPage() {
  const data = await getAdminData();

  if (!data?.authorized) {
    redirect("/");
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, color: "#FFFFFF" }}>
      <DashboardMatrix />
      <AdminDashboardClient initialUsers={data?.users || []} />
    </div>
  );
}
