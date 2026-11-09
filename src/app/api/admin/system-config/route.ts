import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, updateGlobalSystemConfig, GlobalSystemConfig } from "@/lib/systemConfig";
import { buildVlessLink, PACKAGE_ISP_PRICES } from "@/lib/vlessGenerator";

export const runtime = "nodejs";

// Bypass self-signed SSL errors for VPS / 3x-ui panels
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const ADMIN_EMAIL = "dulangathipul@gmail.com";

async function isAuthorizedAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return false;
    const payload = await verifyJwt(sessionCookie.value);
    return payload?.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/system-config
 * Returns current global system config for Admin Command Center
 */
export async function GET() {
  const authorized = await isAuthorizedAdmin();
  if (!authorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getGlobalSystemConfig();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch config" }, { status: 500 });
  }
}

/**
 * POST /api/admin/system-config
 * Supports:
 * - Update global config
 * - Action: "test-3xui" (Live connection & latency test with dual panel/xui paths)
 * - Action: "bulk-update-configs" (Re-generate client configs with new domains/SNIs & accurate ISP prices)
 */
export async function POST(req: Request) {
  const authorized = await isAuthorizedAdmin();
  if (!authorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 1. Action: Test 3x-ui Server Node Connection (Dual Paths)
    if (body.action === "test-3xui") {
      const node = body.node || {};
      const baseUrl = (node.baseUrl || "").trim().replace(/\/+$/, "");
      const username = (node.username || "").trim();
      const password = (node.password || "").trim();
      const inboundId = node.inboundId || 1;

      if (!baseUrl) {
        return NextResponse.json({ success: false, error: "Base URL is required" }, { status: 400 });
      }

      const start = performance.now();

      try {
        // Step A: Attempt Login
        const loginUrl = `${baseUrl}/login`;
        const loginParams = new URLSearchParams();
        loginParams.append("username", username);
        loginParams.append("password", password);

        const loginRes = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: loginParams.toString(),
          signal: AbortSignal.timeout(6000)
        });

        const latencyMs = Math.round(performance.now() - start);

        if (!loginRes.ok && loginRes.status !== 302) {
          return NextResponse.json({
            success: false,
            latencyMs,
            error: `Login failed with HTTP status ${loginRes.status}: ${loginRes.statusText}`
          });
        }

        const setCookieHeader = loginRes.headers.get("set-cookie") || "";

        // Step B: Fetch Inbound Info if login succeeded (Try /panel/api/ first, fallback to /xui/API/)
        let inboundDetails = null;
        if (setCookieHeader) {
          for (const inboundPath of [`/panel/api/inbounds/get/${inboundId}`, `/xui/API/inbounds/get/${inboundId}`]) {
            try {
              const inbRes = await fetch(`${baseUrl}${inboundPath}`, {
                headers: { Cookie: setCookieHeader },
                signal: AbortSignal.timeout(4000)
              });
              if (inbRes.ok) {
                const inbJson = await inbRes.json();
                if (inbJson.success && inbJson.obj) {
                  inboundDetails = {
                    port: inbJson.obj.port,
                    protocol: inbJson.obj.protocol,
                    remark: inbJson.obj.remark,
                    clientCount: Array.isArray(inbJson.obj.clientStats) ? inbJson.obj.clientStats.length : 0
                  };
                  break;
                }
              }
            } catch {
              // Try next path
            }
          }
        }

        return NextResponse.json({
          success: true,
          latencyMs,
          message: `3x-ui Node responded in ${latencyMs}ms!`,
          inboundDetails
        });
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - start);
        return NextResponse.json({
          success: false,
          latencyMs,
          error: `Connection error: ${err?.message || "Failed to connect to 3x-ui server"}`
        });
      }
    }

    // 2. Action: Bulk Re-generate / Update All Client VLESS Configs
    if (body.action === "bulk-update-configs") {
      const currentConfig = await getGlobalSystemConfig();
      const users = await prisma.user.findMany({
        where: {
          vpnConfigKey: {
            contains: "vless://"
          }
        }
      });

      let updatedCount = 0;

      for (const u of users) {
        if (!u.vpnConfigKey) continue;

        // Parse individual config slots
        const regex = /(?:📦\s*)?\[(.*?)\]\s*([\s\S]*?)(?=(?:📦\s*)?\[|$)/g;
        const matches = [...u.vpnConfigKey.matchAll(regex)];

        let rebuiltSlots: string[] = [];

        // Determine user UUID from config or metadata
        let userUuid = "";
        if (u.subscriptionLink) {
          try {
            const meta = JSON.parse(u.subscriptionLink);
            if (meta.customVpnUserId) userUuid = meta.customVpnUserId;
          } catch {}
        }
        if (!userUuid) {
          const uuidMatch = u.vpnConfigKey.match(/vless:\/\/([a-f0-9\-]{36})/i);
          if (uuidMatch) userUuid = uuidMatch[1];
        }

        if (matches.length > 0) {
          for (const m of matches) {
            const slotTitle = (m[1] || "").replace(/^📦\s*/, "").replace(/[\[\]]/g, "").trim();
            const slotCode = m[2].trim();

            // Extract UUID from existing slot if userUuid is still missing
            const slotUuidMatch = slotCode.match(/vless:\/\/([a-f0-9\-]{36})/i);
            const activeUuid = userUuid || (slotUuidMatch ? slotUuidMatch[1] : "");

            if (!activeUuid) {
              rebuiltSlots.push(`[ ${slotTitle} ]\n${slotCode}`);
              continue;
            }

            const isBonus = slotTitle.toLowerCase().includes("bonus");
            let targetDomain = isBonus ? (currentConfig.ispDomains["Bonus USA"] || "bonus-usa.legiongraphics.site") : currentConfig.ispDomains["Dialog"];

            // Identify matching ISP domain
            for (const [ispKey, domainVal] of Object.entries(currentConfig.ispDomains)) {
              if (slotTitle.toLowerCase().includes(ispKey.toLowerCase())) {
                targetDomain = domainVal;
                break;
              }
            }

            // Identify matching SNI
            let targetSni = "zoom.us";
            for (const [pkgKey, sniVal] of Object.entries(currentConfig.packageSnis)) {
              const cleanKey = pkgKey.toLowerCase().replace(/-/g, " ");
              if (slotTitle.toLowerCase().includes(cleanKey)) {
                targetSni = sniVal;
                break;
              }
            }

            // Match slot title against PACKAGE_ISP_PRICES for accurate ISP & price digits
            let matchedPriceDigits = "VPN";
            let matchedIspName = isBonus ? "Bonus USA" : "Dialog";

            for (const [pkgSlug, pkgInfo] of Object.entries(PACKAGE_ISP_PRICES)) {
              const shortLower = pkgInfo.shortName.toLowerCase();
              const slugClean = pkgSlug.replace(/-/g, " ").toLowerCase();
              if (slotTitle.toLowerCase().includes(shortLower) || slotTitle.toLowerCase().includes(slugClean)) {
                matchedPriceDigits = pkgInfo.priceDigits;
                matchedIspName = pkgInfo.isp;
                break;
              }
            }

            if (matchedPriceDigits === "VPN") {
              const remarkMatch = slotCode.match(/#LEGION-VPN-(\d+)([A-Za-z]+)-/i);
              if (remarkMatch) {
                matchedPriceDigits = remarkMatch[1];
                matchedIspName = remarkMatch[2];
              }
            }

            const newLink = buildVlessLink({
              uuid: activeUuid,
              ispDomain: targetDomain,
              packageSni: targetSni,
              ispName: isBonus ? "Bonus USA" : matchedIspName,
              ispPrice: matchedPriceDigits,
              clientEmail: u.email,
              isBonusUsa: isBonus
            });

            rebuiltSlots.push(`[ ${slotTitle} ]\n${newLink}`);
          }
        } else if (u.vpnConfigKey.trim().startsWith("vless://")) {
          // Single standalone config
          const slotUuidMatch = u.vpnConfigKey.match(/vless:\/\/([a-f0-9\-]{36})/i);
          const activeUuid = userUuid || (slotUuidMatch ? slotUuidMatch[1] : "");

          if (activeUuid) {
            const defaultDomain = currentConfig.ispDomains["Dialog"] || "dialog.legiongraphics.site";
            const newLink = buildVlessLink({
              uuid: activeUuid,
              ispDomain: defaultDomain,
              packageSni: "zoom.us",
              ispName: "Dialog",
              ispPrice: "724",
              clientEmail: u.email
            });
            rebuiltSlots.push(`[ Dialog Zoom ]\n${newLink}`);
          }
        }

        if (rebuiltSlots.length > 0) {
          const newSerialized = rebuiltSlots.join("\n\n");
          if (newSerialized !== u.vpnConfigKey) {
            await prisma.user.update({
              where: { id: u.id },
              data: { vpnConfigKey: newSerialized }
            });
            updatedCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        updatedCount,
        message: `Successfully rebuilt and synchronized configs for ${updatedCount} clients!`
      });
    }

    // 3. Action: Update Global System Settings
    if (body.config) {
      const updated = await updateGlobalSystemConfig(body.config);
      return NextResponse.json({
        success: true,
        config: updated,
        message: "System settings saved successfully!"
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action or payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to process request" }, { status: 500 });
  }
}
