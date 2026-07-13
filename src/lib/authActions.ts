"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. ඇඩ්මින්ව ඇතුළට ගන්න Function එක (කලින් හදපු එක)
export async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return { authorized: false, users: [] };
    }

    const payload = await verifyJwt(sessionCookie.value);

    if (!payload || !payload.id) {
      return { authorized: false, users: [] };
    }

    if (payload.email !== "dulangathipul@gmail.com") {
      return { authorized: false, users: [] };
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { authorized: true, users };
    
  } catch (error) {
    console.error("Admin verification error:", error);
    return { authorized: false, users: [] };
  }
}

// 2. යූසර්ස්ලගේ VLESS Keys සහ විස්තර Save කරන Function එක (මිස් වෙච්ච කෑල්ල)
export async function updateUserAdmin(userId: string, data: any) {
  try {
    // ආරක්ෂාවට ආයෙත් ඇඩ්මින්ද කියලා බලනවා
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    if (payload.email !== "dulangathipul@gmail.com") throw new Error("Unauthorized");

    // ඩේටාබේස් එක අප්ඩේට් කරනවා
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        vpnStatus: data.vpnStatus,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        vpnConfigKey: data.vpnConfigKey,
        subscriptionLink: data.subscriptionLink,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}
