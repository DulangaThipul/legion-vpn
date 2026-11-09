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
): Promise<{ headers: Record<string, string | string[] | undefined>; statusCode?: number; body?: string }> {
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
          let body = "";
          res.setEncoding("utf-8");
          res.on("data", (chunk) => {
            if (body.length < 65536) body += chunk;
          });
          res.on("end", () => {
            resolve({ headers: res.headers, statusCode: res.statusCode, body });
          });
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

function extractConfigsFromBody(body?: string): string[] {
  if (!body) return [];
  let decoded = body.trim();
  if (!decoded.startsWith("vless://") && !decoded.startsWith("vmess://") && !decoded.startsWith("trojan://")) {
    try {
      decoded = Buffer.from(decoded, "base64").toString("utf-8");
    } catch {}
  }
  return decoded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("vless://") || line.startsWith("vmess://") || line.startsWith("trojan://") || line.startsWith("ss://"));
}

function parseUserInfoHeader(headers: Record<string, string | string[] | undefined>) {
  let userinfoRaw: string | null = null;
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

  if (!userinfoRaw) return null;

  let uploadBytes = 0;
  let downloadBytes = 0;
  let totalLimitBytes = 0;
  let expireTimestamp = 0;

  const parts = userinfoRaw.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [k, v] = trimmed.split("=").map((s) => s.trim().toLowerCase());
    if (k === "upload") uploadBytes = Number(v) || 0;
    else if (k === "download") downloadBytes = Number(v) || 0;
    else if (k === "total") totalLimitBytes = Number(v) || 0;
    else if (k === "expire" || k === "expiry") expireTimestamp = Number(v) || 0;
  }

  if (!expireTimestamp) {
    for (const [key, val] of Object.entries(headers)) {
      if (key.toLowerCase().includes("expire")) {
        const valStr = Array.isArray(val) ? val[0] : (val || "");
        const num = Number(valStr);
        if (num > 0) {
          expireTimestamp = num;
          break;
        }
      }
    }
  }

  return { uploadBytes, downloadBytes, totalLimitBytes, expireTimestamp };
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

    const isAdmin = payload.email === "dulangathipul@gmail.com";
    const { searchParams } = new URL(req.url);
    const isBulk = searchParams.get("bulk") === "true";
    const queryUserId = searchParams.get("userId");

    // ========================================================
    // 1. ADMIN BULK REFRESH FOR ALL CLIENTS WITH 3X-UI LINKS
    // ========================================================
    if (isAdmin && isBulk) {
      const users = await prisma.user.findMany({
        where: { subscriptionLink: { not: null } },
      });

      let updatedCount = 0;
      const results: any[] = [];

      for (const u of users) {
        if (!u.subscriptionLink) continue;
        let meta: any = {};
        try {
          meta = JSON.parse(u.subscriptionLink);
        } catch {
          continue;
        }

        let subUrl = meta.subscriptionUrl || (u.subscriptionLink.startsWith("http") ? u.subscriptionLink : null);
        if (!subUrl) continue;
        subUrl = subUrl.trim();
        if (!subUrl.startsWith("http://") && !subUrl.startsWith("https://")) {
          subUrl = "https://" + subUrl;
        }

        try {
          const subRes = await fetchSubscriptionHeaders(subUrl, 5000);
          const parsed = parseUserInfoHeader(subRes.headers);
          if (parsed) {
            const current3xuiBytes = parsed.uploadBytes + parsed.downloadBytes;
            const current3xuiGB = current3xuiBytes / (1024 * 1024 * 1024);
            const previousUsage = Number(meta.previousUsage ?? meta.previousUsageGB ?? 0);
            const totalUsedGB = previousUsage + current3xuiGB;
            const formattedDataUsed = `${totalUsedGB.toFixed(2)} GB`;

            meta.dataUsed = formattedDataUsed;
            meta.lastRecordedUsage = formattedDataUsed;
            meta.current3xuiUsageGB = Number(current3xuiGB.toFixed(2));
            meta.previousUsage = previousUsage;
            meta.previousUsageGB = previousUsage;
            meta.lastUsageSync = new Date().toISOString();

            let expireUpdate: any = {};
            if (parsed.expireTimestamp > 0) {
              const ts = parsed.expireTimestamp < 10000000000 ? parsed.expireTimestamp * 1000 : parsed.expireTimestamp;
              const expDate = new Date(ts);
              if (!isNaN(expDate.getTime())) {
                meta.expiryDate = expDate.toISOString();
                expireUpdate = { expiryDate: expDate };
              }
            }

            let configUpdate: any = {};
            if (!u.vpnConfigKey || !u.vpnConfigKey.trim()) {
              const configs = extractConfigsFromBody(subRes.body);
              if (configs.length > 0) {
                configUpdate = { vpnConfigKey: configs.join("\n"), vpnStatus: "Active" };
              }
            }

            await prisma.user.update({
              where: { id: u.id },
              data: { 
                subscriptionLink: JSON.stringify(meta),
                ...expireUpdate,
                ...configUpdate
              },
            });

            updatedCount++;
            results.push({ userId: u.id, name: u.name, dataUsed: formattedDataUsed });
          }
        } catch {
          // Ignore individual client timeout in bulk
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk sync completed. Updated ${updatedCount} clients.`,
        updatedCount,
        results,
      });
    }

    // ========================================================
    // 2. SINGLE CLIENT REFRESH (Client or Admin-Selected)
    // ========================================================
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

    const previousUsage = Number(metaData.previousUsage ?? metaData.previousUsageGB ?? 0);
    const fallbackUsed = metaData.lastRecordedUsage || metaData.dataUsed || "0 GB";
    const fallbackTotal = metaData.dataTotal || "Unlimited";

    // 🇺🇸 USA VPN Usage Metadata
    const showUsaUsage = Boolean(metaData.showUsaUsage);
    let usaSubscriptionUrl = metaData.usaSubscriptionUrl ? String(metaData.usaSubscriptionUrl).trim() : "";
    if (usaSubscriptionUrl && !usaSubscriptionUrl.startsWith("http://") && !usaSubscriptionUrl.startsWith("https://")) {
      usaSubscriptionUrl = "https://" + usaSubscriptionUrl;
    }
    const usaPreviousUsage = Number(metaData.usaPreviousUsage ?? 0);
    let formattedUsaDataUsed = metaData.usaLastRecordedUsage || metaData.usaDataUsed || "0 GB";
    let calculatedUsaDataTotal = metaData.usaDataTotal || "Unlimited";
    let usaCurrent3xuiUsageGB = 0;

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

    // Helper to fetch USA VPN Usage
    const fetchUsaUsageIfEnabled = async () => {
      if (!showUsaUsage || !usaSubscriptionUrl) return;
      try {
        const { headers: usaHeaders } = await fetchSubscriptionHeaders(usaSubscriptionUrl, 6000);
        const usaParsed = parseUserInfoHeader(usaHeaders);
        if (usaParsed) {
          const usaBytes = usaParsed.uploadBytes + usaParsed.downloadBytes;
          usaCurrent3xuiUsageGB = usaBytes / (1024 * 1024 * 1024);
          const usaTotalGB = usaPreviousUsage + usaCurrent3xuiUsageGB;
          formattedUsaDataUsed = `${usaTotalGB.toFixed(2)} GB`;
          if (usaParsed.totalLimitBytes > 0 && (!metaData.usaDataTotal || metaData.usaDataTotal === "Unlimited")) {
            calculatedUsaDataTotal = `${(usaParsed.totalLimitBytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
          }
        }
      } catch (err) {
        console.warn("USA 3x-ui server unreachable or timeout:", err);
      }
    };

    // If no main subscription URL is configured, return whatever was last recorded safely
    if (!subscriptionUrl) {
      await fetchUsaUsageIfEnabled();

      if (showUsaUsage) {
        try {
          const updatedMeta = {
            ...metaData,
            usaDataUsed: formattedUsaDataUsed,
            usaLastRecordedUsage: formattedUsaDataUsed,
            usaCurrent3xuiUsageGB: Number(usaCurrent3xuiUsageGB.toFixed(2)),
            usaDataTotal: calculatedUsaDataTotal,
          };
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionLink: JSON.stringify(updatedMeta) },
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        lastRecordedUsage: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsage,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        showUsaUsage,
        usaDataUsed: formattedUsaDataUsed,
        usaLastRecordedUsage: formattedUsaDataUsed,
        usaDataTotal: calculatedUsaDataTotal,
        usaPreviousUsage,
        usaCurrent3xuiUsageGB: Number(usaCurrent3xuiUsageGB.toFixed(2)),
        message: "No main 3x-ui subscription URL configured",
      });
    }

    // Parallel fetch main 3x-ui and USA 3x-ui if enabled
    let parsedHeader: { uploadBytes: number; downloadBytes: number; totalLimitBytes: number; expireTimestamp?: number } | null = null;
    let mainResponseBody = "";

    try {
      const [mainRes] = await Promise.all([
        fetchSubscriptionHeaders(subscriptionUrl, 8000),
        fetchUsaUsageIfEnabled(),
      ]);
      parsedHeader = parseUserInfoHeader(mainRes.headers);
      mainResponseBody = mainRes.body || "";
    } catch (fetchErr: any) {
      console.warn("3x-ui server unreachable or timeout:", fetchErr?.message || fetchErr);
      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        lastRecordedUsage: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsage,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        showUsaUsage,
        usaDataUsed: formattedUsaDataUsed,
        usaLastRecordedUsage: formattedUsaDataUsed,
        usaDataTotal: calculatedUsaDataTotal,
        usaPreviousUsage,
        usaCurrent3xuiUsageGB: Number(usaCurrent3xuiUsageGB.toFixed(2)),
        warning: "3x-ui server unreachable, returning last recorded usage from database",
      });
    }

    if (!parsedHeader) {
      return NextResponse.json({
        success: true,
        dataUsed: fallbackUsed,
        lastRecordedUsage: fallbackUsed,
        dataTotal: fallbackTotal,
        previousUsage,
        current3xuiUsageGB: 0,
        isLiveSync: false,
        showUsaUsage,
        usaDataUsed: formattedUsaDataUsed,
        usaLastRecordedUsage: formattedUsaDataUsed,
        usaDataTotal: calculatedUsaDataTotal,
        usaPreviousUsage,
        usaCurrent3xuiUsageGB: Number(usaCurrent3xuiUsageGB.toFixed(2)),
        warning: "subscription-userinfo header missing, returning last recorded usage",
      });
    }

    // Total Displayed Used = previousUsage + current 3x-ui Usage
    const current3xuiBytes = parsedHeader.uploadBytes + parsedHeader.downloadBytes;
    const current3xuiGB = current3xuiBytes / (1024 * 1024 * 1024);
    const finalTotalUsedGB = previousUsage + current3xuiGB;
    const formattedDataUsed = `${finalTotalUsedGB.toFixed(2)} GB`;

    let calculatedDataTotal = fallbackTotal;
    if (parsedHeader.totalLimitBytes > 0 && (!metaData.dataTotal || metaData.dataTotal === "Unlimited")) {
      calculatedDataTotal = `${(parsedHeader.totalLimitBytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
    }

    let liveExpiryIso: string | null = null;
    let liveExpiryDateObj: Date | null = null;
    if (parsedHeader.expireTimestamp > 0) {
      const ts = parsedHeader.expireTimestamp < 10000000000 ? parsedHeader.expireTimestamp * 1000 : parsedHeader.expireTimestamp;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        liveExpiryIso = d.toISOString();
        liveExpiryDateObj = d;
      }
    }

    // Auto-save lastRecordedUsage & dataUsed into MongoDB so data is NEVER lost even if VPS terminates
    try {
      const updatedMeta = {
        ...metaData,
        dataUsed: formattedDataUsed,
        lastRecordedUsage: formattedDataUsed,
        current3xuiUsageGB: Number(current3xuiGB.toFixed(2)),
        previousUsage: previousUsage,
        previousUsageGB: previousUsage,
        lastUsageSync: new Date().toISOString(),
        ...(liveExpiryIso ? { expiryDate: liveExpiryIso } : {}),
        ...(showUsaUsage ? {
          usaDataUsed: formattedUsaDataUsed,
          usaLastRecordedUsage: formattedUsaDataUsed,
          usaCurrent3xuiUsageGB: Number(usaCurrent3xuiUsageGB.toFixed(2)),
          usaDataTotal: calculatedUsaDataTotal,
        } : {})
      };
      let configUpdate: any = {};
      if (!user.vpnConfigKey || !user.vpnConfigKey.trim()) {
        const extracted = extractConfigsFromBody(mainResponseBody);
        if (extracted.length > 0) {
          configUpdate = {
            vpnConfigKey: extracted.join("\n"),
            vpnStatus: "Active"
          };
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          subscriptionLink: JSON.stringify(updatedMeta),
          ...(liveExpiryDateObj ? { expiryDate: liveExpiryDateObj } : {}),
          ...configUpdate
        },
      });
    } catch (dbErr) {
      console.error("Failed to update lastRecordedUsage in MongoDB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      dataUsed: formattedDataUsed,
      lastRecordedUsage: formattedDataUsed,
      dataTotal: calculatedDataTotal,
      previousUsage,
      current3xuiUsageGB: Number(current3xuiGB.toFixed(2)),
      uploadGB: Number((parsedHeader.uploadBytes / (1024 * 1024 * 1024)).toFixed(2)),
      downloadGB: Number((parsedHeader.downloadBytes / (1024 * 1024 * 1024)).toFixed(2)),
      isLiveSync: true,
      expiryDate: liveExpiryIso || metaData.expiryDate || (user.expiryDate ? user.expiryDate.toISOString() : null),
      showUsaUsage,
      usaDataUsed: formattedUsaDataUsed,
      usaLastRecordedUsage: formattedUsaDataUsed,
      usaDataTotal: calculatedUsaDataTotal,
      usaPreviousUsage,
      usaCurrent3xuiUsageGB: Number(usaCurrent3xuiUsageGB.toFixed(2)),
    });
  } catch (error: any) {
    console.error("Error in /api/usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
