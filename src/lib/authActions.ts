"use server";

import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";
import { cookies } from "next/headers";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1. Google Auth සඳහා සර්වර් ඇක්ෂන් එක
export async function handleGoogleAuth(token: string) {
  try {
    if (!token) {
      return { error: "No token provided", status: 400 };
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { error: "Invalid token payload", status: 400 };
    }

    const { email, name, picture } = payload;

    // Find or create user in MongoDB via Prisma
    let user = await prisma.user.findUnique({
      where: { email },
    });

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

    // Create session JWT
    const jwtPayload = {
      userId: user.id,
      email: user.email,
    };
    const sessionToken = await signJwt(jwtPayload);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true, user };
  } catch (error) {
    console.error("Google Auth Error:", error);
    return { error: "Authentication failed", status: 500 };
  }
}

// 2. 🚀 Admin Users ලා සේරම Build එකට බාධා නොවී ගෙන්න ගන්න අලුතින්ම එකතු කරපු සර්වර් ඇක්ෂන් එක!
export async function getAdminUsers() {
  try {
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    // JSON දත්ත සරල array එකක් විදිහට සකස් කරලා පිටුවට යවනවා
    return { success: true, users: JSON.parse(JSON.stringify(allUsers)) };
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return { success: false, users: [] };
  }
}
