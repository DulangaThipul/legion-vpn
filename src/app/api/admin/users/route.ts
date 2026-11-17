import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, createXuiClient } from "@/lib/systemConfig";

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
    const email = (typeof payload?.email === "string" ? payload.email : "").toLowerCase();
    const adminEmailEnv = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdmin = email === "dulangathipul@gmail.com" || 
                    email === "legionzinfo@gmail.com" || 
                    (Boolean(adminEmailEnv) && email === adminEmailEnv);

    if (!payload || !payload.id || !isAdmin) {
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

    // 5. Adjust Days & Validity
    if (action === "adjust-days") {
      const targetUser = await prisma.user.findUnique({
        where: { id: effectiveTargetId }
      });

      if (!targetUser) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      let existingMeta: any = {};
      try {
        if (targetUser.subscriptionLink) existingMeta = JSON.parse(targetUser.subscriptionLink);
      } catch {}

      const now = Date.now();
      let baseExpiryMs = Number(existingMeta.expiryTimeMs) || 0;
      if (!baseExpiryMs && existingMeta.expiryDate) {
        baseExpiryMs = new Date(`${existingMeta.expiryDate}T23:59:59`).getTime();
      }
      if (!baseExpiryMs && targetUser.expiryDate) {
        baseExpiryMs = new Date(targetUser.expiryDate).getTime();
      }
      if (!baseExpiryMs || baseExpiryMs < now) {
        baseExpiryMs = now;
      }

      const deltaDays = Number(body.deltaDays ?? data.deltaDays ?? 0);
      const newExpiryMs = Math.max(now, baseExpiryMs + deltaDays * 86400000);
      const newExpiryDateStr = new Date(newExpiryMs).toISOString().split("T")[0];
      const newExpiryIso = new Date(newExpiryMs).toISOString();

      const updatedMeta = {
        ...existingMeta,
        expiryTimeMs: newExpiryMs,
        expiryDate: newExpiryDateStr,
        accountStatus: "Active"
      };

      // Also update client's expiry in 3x-ui if active
      try {
        const clientUuid = existingMeta.vpnUuid || existingMeta.customVpnUserId;
        const systemConfig = await getGlobalSystemConfig();
        if (clientUuid && systemConfig.primary3xui.baseUrl && systemConfig.primary3xui.username) {
          const xui = createXuiClient(systemConfig.primary3xui);
          await xui.login(true);
          const inboundsRes = await xui.getInbounds().catch(() => null);
          const inbounds = Array.isArray(inboundsRes?.obj) ? inboundsRes.obj : [];
          for (const ib of inbounds) {
            let clients: any[] = [];
            try {
              if (ib.settings) {
                const s = typeof ib.settings === "string" ? JSON.parse(ib.settings) : ib.settings;
                clients = Array.isArray(s.clients) ? s.clients : [];
              }
            } catch {}
            const matchedClient = clients.find((c: any) => c.id === clientUuid || (targetUser.email && c.email?.toLowerCase().includes(targetUser.email.toLowerCase())));
            if (matchedClient) {
              await xui.updateClient(String(matchedClient.id), {
                id: Number(ib.id),
                settings: JSON.stringify({
                  clients: [{
                    ...matchedClient,
                    expiryTime: newExpiryMs,
                    enable: true
                  }]
                })
              }).catch(async () => {
                await xui.updateModernClient(String(matchedClient.email), {
                  ...matchedClient,
                  expiryTime: newExpiryMs,
                  enable: true
                }).catch(() => null);
              });
              break;
            }
          }
        }
      } catch (xuiSyncErr) {
        console.warn("3x-ui expiry sync error (non-fatal):", xuiSyncErr);
      }

      const updatedUser = await prisma.user.update({
        where: { id: effectiveTargetId },
        data: {
          vpnStatus: "Active",
          expiryDate: newExpiryIso,
          subscriptionLink: JSON.stringify(updatedMeta)
        }
      });

      return NextResponse.json({
        success: true,
        expiryTimeMs: newExpiryMs,
        expiryDate: newExpiryDateStr,
        user: updatedUser
      });
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
    const email = (typeof payload?.email === "string" ? payload.email : "").toLowerCase();
    const adminEmailEnv = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdmin = email === "dulangathipul@gmail.com" || 
                    email === "legionzinfo@gmail.com" || 
                    (Boolean(adminEmailEnv) && email === adminEmailEnv);

    if (!payload || !payload.id || !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch users" }, { status: 500 });
  }
}
