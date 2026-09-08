"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. Admin Data Fetching
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
  } catch {
    return { authorized: false, users: [] };
  }
}

// 2. Admin Partial Safe Update
export async function updateUserAdmin(userId: string, data: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { success: false, error: "Unauthorized" };

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser || currentUser.email !== "dulangathipul@gmail.com") return { success: false, error: "Unauthorized" };

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

// 3. Client Payment Order Submission
export async function submitClientPaymentOrder(data: { packageName: string; amount: number; receiptUrl: string }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { success: false, error: "Unauthorized" };

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser) return { success: false, error: "User not found" };

    let meta: any = { alert: "", isPremium: false, payments: [] };
    if (currentUser.subscriptionLink) {
      try {
        meta = { ...meta, ...JSON.parse(currentUser.subscriptionLink) };
      } catch {}
    }

    const newPayment = {
      id: Date.now(),
      date: new Date().toISOString(),
      package: data.packageName,
      amount: data.amount,
      status: "Verifying",
      receipt: data.receiptUrl,
    };
    meta.payments = [newPayment, ...(meta.payments || [])];

    const updated = await prisma.user.update({
      where: { id: payload.id as string },
      data: {
        vpnStatus: "Suspended",
        subscriptionLink: JSON.stringify(meta),
        vpnConfigKey: `[ Payment Verifying ]\nYour config will appear here once approved.\n\nReceipt: ${data.receiptUrl}`
      }
    });

    return { success: true, user: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Real-time Client Heartbeat
export async function sendClientHeartbeat() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { success: false };

    const payload: any = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { success: false };

    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!currentUser) return { success: false };

    let meta: any = { alert: "", isPremium: false, payments: [] };
    if (currentUser.subscriptionLink) {
      try {
        meta = { ...meta, ...JSON.parse(currentUser.subscriptionLink) };
      } catch {}
    }
    meta.lastSeen = Date.now();

    await prisma.user.update({
      where: { id: payload.id as string },
      data: { subscriptionLink: JSON.stringify(meta) }
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

// 5. Update Avatar
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
