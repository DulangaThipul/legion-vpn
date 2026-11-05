export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import https from "https";
import http from "http";

// Bypass self-signed SSL errors on VPS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Helper function to fetch headers with rejectUnauthorized: false and follow redirects
function fetchSubscriptionHeaders(
  urlStr: string,
  timeoutMs = 8000
): Promise<{ headers: Record<string, string | string[] | undefined>; statusCode?: number }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === "https:";
      const lib = isHttps ? https : http;

      const req = lib.request(
        parsedUrl,
        {
          method: "GET",
          rejectUnauthorized: false, // Critical: allows self-signed SSL certificates on VPS
          timeout: timeoutMs,
          headers: {
            "User-Agent": "v2rayNG/1.8.12 (Android; Mobile)",
            "Accept": "*/*",
            "Connection": "close",
          },
        },
        (res) => {
          // Follow standard redirects (301, 302, 307, 308)
          if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            try {
              const redirectUrl = new URL(res.headers.location, parsedUrl).toString();
              resolve(fetchSubscriptionHeaders(redirectUrl, timeoutMs));
              return;
            } catch {
              // Ignore invalid redirect URL
            }
          }
          resolve({ headers: res.headers, statusCode: res.statusCode });
          res.resume(); // consume stream to release socket
        }
      );

      req.on("timeout", () => {
        req.destroy(new Error("Request timed out"));
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.end();
    } catch (e) {
      reject(e);
    }
  });
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
    const targetUserId = isAdmin && queryUserId ? queryUserId : (payload.id as string);

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

    // Detect 3x-ui subscription URL
    let subscriptionUrl =
      metaData.subscriptionUrl ||
      (typeof user.subscriptionLink === "string" && user.subscriptionLink.startsWith("http")
        ? user.subscriptionLink
        : null);

    if (!subscriptionUrl && metaData.alert && (metaData.alert.startsWith("http://") || metaData.alert.startsWith("https://"))) {
      subscriptionUrl = metaData.alert;
    }

    if (subscriptionUrl) {
      subscriptionUrl = subscriptionUrl.trim();
      if (!subscriptionUrl.startsWith("http://") && !subscriptionUrl.startsWith("https://")) {
        subscriptionUrl = "https://" + subscriptionUrl;
      }
    }

    // If no subscription URL is configured, return whatever was saved
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

    // Check if manual input was "0 GB", "0" or empty
    const rawManualUsed = (metaData.dataUsed || "").toString().trim().toLowerCase();
    const isManualZero = !rawManualUsed || rawManualUsed === "0" || rawManualUsed === "0 gb" || rawManualUsed === "0gb";

    let userinfoRaw: string | null = null;

    try {
      const { headers } = await fetchSubscriptionHeaders(subscriptionUrl, 8000);

      if (headers["subscription-userinfo"]) {
        userinfoRaw = Array.isArray(headers["subscription-userinfo"])
          ? headers["subscription-userinfo"][0]
          : headers["subscription-userinfo"];
      } else {
        for (const [key, val] of Object.entries(headers)) {
          if (key.toLowerCase().includes("userinfo")) {
            userinfoRaw = Array.isArray(val) ? val[0] : (val || null);
            break;
          }
        }
      }
    } catch (fetchErr: any) {
      console.warn("3x-ui server unreachable or timeout:", fetchErr?.message || fetchErr);
      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsageGB,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        warning: "3x-ui server unreachable, showing cached data",
      });
    }

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
