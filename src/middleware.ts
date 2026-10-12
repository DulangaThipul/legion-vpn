import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// 🚀 Maintenance Mode එක On/Off කිරීමට මෙතන true / false කරන්න
const IS_MAINTENANCE_MODE = false; 

// Admin Email එක
const ADMIN_EMAIL = "dulangathipul@gmail.com";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Maintenance Mode අක්‍රිය නම් සාමාන්‍ය විදිහට වැඩ කරන්න දෙන්න
  if (!IS_MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  // 2. Static files, API routes, සහ maintenance page එක bypass කරන්න
  if (
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/avatars") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 3. User ගේ Session Cookie එක පරීක්ෂා කිරීම
  const sessionCookie = request.cookies.get("session")?.value;

  if (sessionCookie) {
    try {
      // JWT Token එක Decrypt කර Email එක බලනවා
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
      
      // 👑 ලොග් වී සිටින්නේ Admin (dulangathipul@gmail.com) නම් bypass වෙන්න දෙන්න!
      if (payload && payload.email === ADMIN_EMAIL) {
        return NextResponse.next();
      }
    } catch (error) {
      // Token එක invalid නම් maintenance එකට යවනවා
    }
  }

  // 4. Admin නෙවෙයි නම් හෝ ලොග් වී නැත්නම් Maintenance Page එකට Redirect කරනවා
  return NextResponse.redirect(new URL("/maintenance", request.url));
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
