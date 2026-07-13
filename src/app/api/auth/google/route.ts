import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // 2. Find or Create User in MongoDB
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || "VPN User",
          image: payload.picture || null,
        },
      });
    }

    // 3. Create Session JWT
    const sessionToken = await signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({ success: true });

    // 4. Set HttpOnly Cookie
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Backend Auth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
