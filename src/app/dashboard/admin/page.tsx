export const dynamic = "force-dynamic";

import AdminDashboardClient from "./AdminDashboardClient";
import Link from "next/link";
import DashboardMatrix from "@/components/DashboardMatrix";
import { redirect } from "next/navigation";
import { getAdminData } from "@/lib/authActions"; // 🚀 අලුත් ආරක්ෂිත ඇක්ෂන් එක

export default async function AdminPage() {
  // සර්වර් ඇක්ෂන් එක හරහා Auth එකයි ඩේටා එකයි දෙකම එක පාරින් ගන්නවා
  const data = await getAdminData();

  // ඇඩ්මින් කෙනෙක් නෙවෙයි නම් හෝ ලොග් වෙලා නැත්නම් හෝම් එකට රීඩිරෙක්ට් කරනවා
  if (!data.authorized) {
    redirect("/");
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, color: "#FFFFFF" }}>
      <DashboardMatrix />
      <AdminDashboardClient initialUsers={data.users} />
    </div>
  );
}
