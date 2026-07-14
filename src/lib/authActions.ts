"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. Admin Verification
export async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { authorized: false, users: [] };

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { authorized: false, users: [] };
    if (payload.email !== "dulangathipul@gmail.com") return { authorized: false, users: [] };

    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return { authorized: true, users };
  } catch (error) {
    console.error("Admin verification error:", error);
    return { authorized: false, users: [] };
  }
}

// 2. Update User Admin (VPN Configs)
export async function updateUserAdmin(userId: string, data: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    if (payload.email !== "dulangathipul@gmail.com") throw new Error("Unauthorized");

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

// 3. Update Profile Avatar (අලුත් එක 🚀)
export async function updateUserAvatar(imageUrl: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    // 💡 FIX: AI එක දුන්න payload.userId වෙනුවට මෙතන payload.id පාවිච්චි කළා
    if (!payload || !payload.id) throw new Error("Unauthorized");

    if (!imageUrl.startsWith("/avatars/avatar") || !imageUrl.endsWith(".gif")) {
      throw new Error("Invalid avatar selection");
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.id as string },
      data: { image: imageUrl }
    });

    return { success: true, image: updatedUser.image };
  } catch (error) {
    console.error("Avatar update error:", error);
    return { success: false, error: "Failed to update avatar" };
  }
}
