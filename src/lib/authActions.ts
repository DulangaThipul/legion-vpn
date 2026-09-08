"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. Admin Data ලබාගැනීම
export async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { authorized: false, users: [] };

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { authorized: false, users: [] };

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser || currentUser.email !== "dulangathipul@gmail.com") {
      return { authorized: false, users: [] };
    }

    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return { authorized: true, users: JSON.parse(JSON.stringify(users)) };
  } catch (error) {
    return { authorized: false, users: [] };
  }
}

// 2. Client Profile Update කිරීම (Partial Safe Update)
export async function updateUserAdmin(userId: string, data: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { success: false, error: "Unauthorized" };

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser || currentUser.email !== "dulangathipul@gmail.com") {
      return { success: false, error: "Unauthorized" };
    }

    // 🚀 වෙනස් කරන දත්ත පමණක් ආරක්ෂිතව සකස් කිරීම
    const updateData: any = {};
    if (data.vpnStatus !== undefined) updateData.vpnStatus = data.vpnStatus;
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }
    if (data.vpnConfigKey !== undefined) updateData.vpnConfigKey = data.vpnConfigKey;
    if (data.subscriptionLink !== undefined) updateData.subscriptionLink = data.subscriptionLink;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update user" };
  }
}

// 3. User Avatar Update කිරීම
export async function updateUserAvatar(imageUrl: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    let finalImage = imageUrl;
    
    if (imageUrl === "") {
      finalImage = currentUser?.googleImage || "";
    } else if (!imageUrl.startsWith("/avatars/avatar") || !imageUrl.endsWith(".gif")) {
      throw new Error("Invalid avatar selection");
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.id as string },
      data: { image: finalImage === "" ? null : finalImage }
    });

    return { success: true, image: updatedUser.image };
  } catch (error) {
    return { success: false, error: "Failed to update avatar" };
  }
}
