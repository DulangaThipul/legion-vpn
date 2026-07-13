"use server";

import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return { authorized: false, users: [] };
    }

    const payload = await verifyJwt(sessionCookie.value);

    // 💡 THE FIX: මෙතන payload.userId වෙනුවට payload.id කියලා දැම්මා
    if (!payload || !payload.id) {
      return { authorized: false, users: [] };
    }

    // 💡 ආරක්ෂාව: Dulanga ගේ ඊමේල් එකෙන් ආවොත් විතරක් ඇතුළට ගන්නවා
    if (payload.email !== "dulangathipul@gmail.com") {
      return { authorized: false, users: [] };
    }

    // ඇඩ්මින්ට පෙන්වන්න ඩේටාබේස් එකේ ඉන්න ඔක්කොම යූසර්ස්ලව ගන්නවා
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { authorized: true, users };
    
  } catch (error) {
    console.error("Admin verification error:", error);
    return { authorized: false, users: [] };
  }
}
