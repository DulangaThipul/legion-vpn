import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id || payload.email !== "dulangathipul@gmail.com") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, userId, targetUserId = userId, data = {} } = body;

    const effectiveTargetId = targetUserId || userId;
    if (!effectiveTargetId) {
      return NextResponse.json({ success: false, error: "Target User ID is required" }, { status: 400 });
    }

    // 1. Reset user account: clean wipe user metadata and reset to initial inactive state
    if (action === "reset") {
      const clearedMetadata = {
        payments: [],
        pendingOrders: [],
        vlessConfig: "",
        subscriptionUrl: "",
        vpnUuid: "",
        customVpnUserId: "",
        dataTotal: "0 GB",
        dataUsed: "0 GB",
        isRenewUnlocked: false
      };

      // Safely delete any records in vpnConfig if model exists (no unhandled deleteMany on undefined)
      try {
        if ((prisma as any).vpnConfig?.deleteMany) {
          await (prisma as any).vpnConfig.deleteMany({
            where: { userId: effectiveTargetId }
          });
        }
      } catch {
        // Ignored
      }

      const updatedUser = await prisma.user.update({
        where: { id: effectiveTargetId },
        data: {
          vpnStatus: "Inactive",
          expiryDate: null,
          vpnConfigKey: null,
          subscriptionLink: JSON.stringify(clearedMetadata),
          alertMessage: null
        }
      });

      return NextResponse.json({
        success: true,
        message: "Client reset successfully. All orders and credentials cleared.",
        user: updatedUser
      });
    }

    // 2. Ban user
    if (action === "ban") {
      const updatedUser = await prisma.user.update({
        where: { id: effectiveTargetId },
        data: { vpnStatus: "Banned" }
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // 3. Unban user
    if (action === "unban") {
      const updatedUser = await prisma.user.update({
        where: { id: effectiveTargetId },
        data: { vpnStatus: "Active" }
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // 4. Update user attributes
    if (action === "update") {
      const updateData: any = {};
      if (data.vpnStatus !== undefined) updateData.vpnStatus = data.vpnStatus;
      if (data.expiryDate !== undefined) {
        updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
      }
      if (data.vpnConfigKey !== undefined) updateData.vpnConfigKey = data.vpnConfigKey;
      if (data.subscriptionLink !== undefined) updateData.subscriptionLink = data.subscriptionLink;

      const updatedUser = await prisma.user.update({
        where: { id: effectiveTargetId },
        data: updateData
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/admin/users:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id || payload.email !== "dulangathipul@gmail.com") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch users" }, { status: 500 });
  }
}
