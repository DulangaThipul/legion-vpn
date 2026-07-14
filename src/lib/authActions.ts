"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    return { authorized: false, users: [] };
  }
}

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
    return { success: false, error: "Failed to update user" };
  }
}

// 🚀 අලුත් Avatar Update Function එක (Default එකට යන්නත් පුළුවන්)
export async function updateUserAvatar(imageUrl: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) throw new Error("Unauthorized");

    // Allow empty string to reset to Default/Initials, or valid GIF
    if (imageUrl !== "" && (!imageUrl.startsWith("/avatars/avatar") || !imageUrl.endsWith(".gif"))) {
      throw new Error("Invalid avatar selection");
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.id as string },
      data: { image: imageUrl === "" ? null : imageUrl } // "" ආවොත් null කරලා පරණ Google/Initials ගේනවා
    });

    return { success: true, image: updatedUser.image };
  } catch (error) {
    return { success: false, error: "Failed to update avatar" };
  }
}
