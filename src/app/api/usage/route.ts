export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Handle self-signed certificates on non-standard VPS deployments
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine target user (client themselves or admin inspecting a client)
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");
    const isAdmin = payload.email === "dulangathipul@gmail.com";
    const targetUserId = (isAdmin && queryUserId) ? queryUserId : (payload.id as string);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse metadata from subscriptionLink JSON
    let metaData: any = {};
    if (user.subscriptionLink) {
      try {
        metaData = JSON.parse(user.subscriptionLink);
      } catch {
        metaData = { alert: user.subscriptionLink };
      }
    }

    const previousUsageGB = Number(metaData.previousUsageGB) || 0;
    const fallbackUsed = metaData.dataUsed || "0 GB";
    const fallbackTotal = metaData.dataTotal || "Unlimited";

    // 3x-ui Subscription link check
    const subscriptionUrl = metaData.subscriptionUrl || (
      typeof user.subscriptionLink === "string" && user.subscriptionLink.startsWith("http")
        ? user.subscriptionLink
        : null
    );

    // If no 3x-ui link configured, return fallback data safely
    if (!subscriptionUrl) {
      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsageGB,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        message: "No 3x-ui subscription URL configured",
      });
    }

    let userinfoRaw: string | null = null;

    try {
      // 6-second timeout controller to prevent hanging if VPS is down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(subscriptionUrl, {
        method: "GET",
        headers: {
          "User-Agent": "v2rayng/1.8.5 (SpacemanVPN Auto-Sync)",
          "Accept": "*/*",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      // Flexible case-insensitive parsing for subscription-userinfo header
      for (const [key, value] of res.headers.entries()) {
        if (key.toLowerCase() === "subscription-userinfo") {
          userinfoRaw = value;
          break;
        }
      }
    } catch (fetchErr: any) {
      console.warn("3x-ui server unreachable or timeout:", fetchErr?.message || fetchErr);
      // Graceful fallback: return previous stored data without crashing
      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsageGB,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        warning: "3x-ui server unreachable or timed out, returning cached data",
      });
    }

    // If 3x-ui did not return subscription-userinfo header
    if (!userinfoRaw) {
      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsageGB,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        warning: "subscription-userinfo header missing in 3x-ui response",
      });
    }

    // Parse: upload=12345; download=67890; total=...; expire=...
    let uploadBytes = 0;
    let downloadBytes = 0;
    let totalLimitBytes = 0;

    const parts = userinfoRaw.split(";");
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const [k, v] = trimmed.split("=").map((s) => s.trim().toLowerCase());
      if (k === "upload") uploadBytes = Number(v) || 0;
      else if (k === "download") downloadBytes = Number(v) || 0;
      else if (k === "total") totalLimitBytes = Number(v) || 0;
    }

    // Calculate GB
    const current3xuiBytes = uploadBytes + downloadBytes;
    const current3xuiGB = current3xuiBytes / (1024 * 1024 * 1024);
    const finalTotalUsedGB = previousUsageGB + current3xuiGB;
    const formattedDataUsed = `${finalTotalUsedGB.toFixed(2)} GB`;

    let calculatedDataTotal = fallbackTotal;
    if (totalLimitBytes > 0 && (!metaData.dataTotal || metaData.dataTotal === "Unlimited")) {
      calculatedDataTotal = `${(totalLimitBytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
    }

    // Save updated synced value in MongoDB cache
    try {
      const updatedMeta = {
        ...metaData,
        dataUsed: formattedDataUsed,
        lastUsageSync: new Date().toISOString(),
      };
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionLink: JSON.stringify(updatedMeta) },
      });
    } catch (dbErr) {
      console.error("Failed to update cached usage in MongoDB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      dataUsed: formattedDataUsed,
      dataTotal: calculatedDataTotal,
      previousUsageGB,
      current3xuiUsageGB: Number(current3xuiGB.toFixed(2)),
      uploadGB: Number((uploadBytes / (1024 * 1024 * 1024)).toFixed(2)),
      downloadGB: Number((downloadBytes / (1024 * 1024 * 1024)).toFixed(2)),
      isLiveSync: true,
    });
  } catch (error: any) {
    console.error("Error in /api/usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
