"use server";

import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateUserAdmin(userId: string, vpnConfigKey: string, subscriptionLink: string) {
  // 1. Verify Authentication & Authorization
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    throw new Error("Unauthorized: No session found");
  }

  const payload = await verifyJwt(sessionCookie.value);
  if (!payload || payload.email !== "dulangathipul@gmail.com") {
    throw new Error("Forbidden: Admin privileges required");
  }

  // 2. Update Database Record
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        vpnConfigKey: vpnConfigKey || null,
        subscriptionLink: subscriptionLink || null,
      },
    });

    // 3. Revalidate paths to ensure fresh data on next render
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard");

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user in database");
  }
}
