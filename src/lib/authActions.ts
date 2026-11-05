"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 1. Admin Data ගන්න Function එක (Admin Page එකට)
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

// 2. Admin ගෙන් ඩේටා Update කරන Function එක (Key එකයි Link එකයි)
export async function updateUserAdmin(userId: string, data: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    
    if (!payload || !payload.id) throw new Error("Unauthorized");
    if (payload.email !== "dulangathipul@gmail.com") throw new Error("Unauthorized");

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
    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

// 3. යූසර්ගේ Avatar එක Update කරන Function එක
export async function updateUserAvatar(imageUrl: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) throw new Error("Unauthorized");

    // යූසර්ගේ Google පින්තූරේ ගන්නවා
    const currentUser = await prisma.user.findUnique({ where: { id: payload.id as string } });

    let finalImage = imageUrl;
    
    if (imageUrl === "") {
      finalImage = currentUser?.googleImage || ""; // හිස් ලින්ක් එකක් ආවොත් Google පින්තූරේ දානවා
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

// 4. Send Client Heartbeat (Update lastSeen timestamp)
export async function sendClientHeartbeat() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { success: false };

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { success: false };

    const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!user) return { success: false };

    let meta: any = {};
    if (user.subscriptionLink) {
      try {
        meta = JSON.parse(user.subscriptionLink);
      } catch {
        meta = { alert: user.subscriptionLink };
      }
    }
    meta.lastSeen = Date.now();

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionLink: JSON.stringify(meta) }
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

// 5. Submit Client Payment Order
export async function submitClientPaymentOrder({
  packageName,
  amount,
  receiptUrl
}: {
  packageName: string;
  amount: number;
  receiptUrl: string;
}) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { success: false, error: "Unauthorized" };

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
    if (!user) return { success: false, error: "User not found" };

    let meta: any = {};
    if (user.subscriptionLink) {
      try {
        meta = JSON.parse(user.subscriptionLink);
      } catch {
        meta = { alert: user.subscriptionLink };
      }
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      package: packageName,
      amount,
      receipt: receiptUrl,
      date: new Date().toISOString(),
      status: "Verifying"
    };

    const existingPayments = Array.isArray(meta.payments) ? meta.payments : [];
    meta.payments = [newPayment, ...existingPayments];

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionLink: JSON.stringify(meta) }
    });

    return { success: true, user: updatedUser };
  } catch {
    return { success: false, error: "Payment submission failed" };
  }
}
