"use server";

import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signJwt, verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function handleGoogleAuth(token: string) {
  try {
    if (!token) return { error: "No token provided", status: 400 };

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return { error: "Invalid token payload", status: 400 };

    const { email, name, picture } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "User",
          image: picture,
          vpnStatus: "Inactive",
          vpnConfigKey: "Pending config generation...",
        },
      });
    }

    const jwtPayload = { userId: user.id, email: user.email };
    const sessionToken = await signJwt(jwtPayload);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return { success: true, user };
  } catch (error) {
    console.error("Google Auth Error:", error);
    return { error: "Authentication failed", status: 500 };
  }
}

export async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return { authorized: false, users: [] };

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.userId) return { authorized: false, users: [] };

    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    if (!user || user.email !== "dulangathipul@gmail.com") return { authorized: false, users: [] };

    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

    return { 
      authorized: true, 
      users: JSON.parse(JSON.stringify(allUsers)) 
    };
  } catch (error) {
    console.error("Admin Data Error:", error);
    return { authorized: false, users: [] };
  }
}

// 🚀 අලුතින්ම එකතු කරපු කෑල්ල (Database Update කිරීම)
export async function updateUserAdmin(userId: string, newConfig: string, newLink: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        vpnConfigKey: newConfig,
        subscriptionLink: newLink,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: "Failed to update user" };
  }
}
