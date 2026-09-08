"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. Admin Data ලබාගන්නා Function එක
export async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { authorized: false, users: [] };

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { authorized: false, users: [] };

    // 🚀 Database එකෙන් Admin ගේ email එක තහවුරු කරගැනීම (Redirect වීම වළක්වයි)
    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser || currentUser.email !== "dulangathipul@gmail.com") {
      return { authorized: false, users: [] };
    }

    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    
    // 🚀 Date serialization crash වැළැක්වීමට JSON plain object එකක් ලෙස එවයි
    return { authorized: true, users: JSON.parse(JSON.stringify(users)) };
  } catch (error) {
    return { authorized: false, users: [] };
  }
}

// 2. Admin මගින් Client Update කරන Function එක
export async function updateUserAdmin(userId: string, data: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) throw new Error("Unauthorized");

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser || currentUser.email !== "dulangathipul@gmail.com") throw new Error("Unauthorized");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        vpnStatus: data.vpnStatus || "Active", 
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        vpnConfigKey: data.vpnConfigKey,
        subscriptionLink: data.subscriptionLink,
      },
    });
    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

// 3. User ගේ Avatar එක Update කරන Function එක
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
