// ========================================================================
// LEGION VPN - GLOBAL SYSTEM CONFIGURATION HELPER (ZERO-MIGRATION)
// Stores global admin configurations in Admin user's subscriptionLink JSON
// ========================================================================

import { prisma } from "@/lib/prisma";
import { DEFAULT_ISP_DOMAINS, DEFAULT_PACKAGE_SNIS } from "./vlessGenerator";

export interface GlobalSystemConfig {
  ispDomains: Record<string, string>;
  packageSnis: Record<string, string>;
  primary3xui: {
    baseUrl: string;
    username: string;
    password: string;
    inboundId: number | string;
    port: number | string;
    subBaseUrl: string;
  };
  bonusUsa3xui: {
    enabled: boolean;
    baseUrl: string;
    username: string;
    password: string;
    inboundId: number | string;
  };
  autoApprovalEnabled: boolean;
  expectedBankAccount: string;
  allowedTimeWindowMinutes: number;
  verifiedRefLedger: Array<{
    refNumber: string;
    email: string;
    packageName: string;
    amount: number;
    date: string;
    verifiedAt: string;
  }>;
}

export const DEFAULT_SYSTEM_CONFIG: GlobalSystemConfig = {
  ispDomains: { ...DEFAULT_ISP_DOMAINS },
  packageSnis: { ...DEFAULT_PACKAGE_SNIS },
  primary3xui: {
    baseUrl: "https://103.179.44.75:2096",
    username: "",
    password: "",
    inboundId: 1,
    port: 443,
    subBaseUrl: "https://103.179.44.75:2096/sub/"
  },
  bonusUsa3xui: {
    enabled: false,
    baseUrl: "",
    username: "",
    password: "",
    inboundId: 1
  },
  autoApprovalEnabled: true,
  expectedBankAccount: "8029138148",
  allowedTimeWindowMinutes: 120,
  verifiedRefLedger: []
};

const ADMIN_EMAIL = "dulangathipul@gmail.com";

/**
 * Loads the Global System Configuration from Admin user's subscriptionLink JSON
 */
export async function getGlobalSystemConfig(): Promise<GlobalSystemConfig> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL }
    });

    if (!adminUser || !adminUser.subscriptionLink) {
      return { ...DEFAULT_SYSTEM_CONFIG };
    }

    let parsedMeta: any = {};
    try {
      parsedMeta = JSON.parse(adminUser.subscriptionLink);
    } catch {
      return { ...DEFAULT_SYSTEM_CONFIG };
    }

    const saved = parsedMeta._globalSystemConfig || {};

    return {
      ispDomains: { ...DEFAULT_SYSTEM_CONFIG.ispDomains, ...(saved.ispDomains || {}) },
      packageSnis: { ...DEFAULT_PACKAGE_SNIS, ...(saved.packageSnis || {}) },
      primary3xui: { ...DEFAULT_SYSTEM_CONFIG.primary3xui, ...(saved.primary3xui || {}) },
      bonusUsa3xui: { ...DEFAULT_SYSTEM_CONFIG.bonusUsa3xui, ...(saved.bonusUsa3xui || {}) },
      autoApprovalEnabled: saved.autoApprovalEnabled !== undefined ? Boolean(saved.autoApprovalEnabled) : true,
      expectedBankAccount: saved.expectedBankAccount || DEFAULT_SYSTEM_CONFIG.expectedBankAccount,
      allowedTimeWindowMinutes: Number(saved.allowedTimeWindowMinutes) || DEFAULT_SYSTEM_CONFIG.allowedTimeWindowMinutes,
      verifiedRefLedger: Array.isArray(saved.verifiedRefLedger) ? saved.verifiedRefLedger : []
    };
  } catch (error) {
    console.error("Error reading GlobalSystemConfig:", error);
    return { ...DEFAULT_SYSTEM_CONFIG };
  }
}

/**
 * Updates Global System Configuration in Admin user's subscriptionLink JSON
 */
export async function updateGlobalSystemConfig(updates: Partial<GlobalSystemConfig>): Promise<{ success: boolean; config?: GlobalSystemConfig; error?: string }> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL }
    });

    if (!adminUser) {
      return { success: false, error: "Admin user not found" };
    }

    let parsedMeta: any = {};
    if (adminUser.subscriptionLink) {
      try {
        parsedMeta = JSON.parse(adminUser.subscriptionLink);
      } catch {
        parsedMeta = {};
      }
    }

    const currentGlobal = parsedMeta._globalSystemConfig || {};
    const mergedGlobal: GlobalSystemConfig = {
      ispDomains: { ...DEFAULT_SYSTEM_CONFIG.ispDomains, ...(currentGlobal.ispDomains || {}), ...(updates.ispDomains || {}) },
      packageSnis: { ...DEFAULT_PACKAGE_SNIS, ...(currentGlobal.packageSnis || {}), ...(updates.packageSnis || {}) },
      primary3xui: { ...DEFAULT_SYSTEM_CONFIG.primary3xui, ...(currentGlobal.primary3xui || {}), ...(updates.primary3xui || {}) },
      bonusUsa3xui: { ...DEFAULT_SYSTEM_CONFIG.bonusUsa3xui, ...(currentGlobal.bonusUsa3xui || {}), ...(updates.bonusUsa3xui || {}) },
      autoApprovalEnabled: updates.autoApprovalEnabled !== undefined ? Boolean(updates.autoApprovalEnabled) : (currentGlobal.autoApprovalEnabled ?? true),
      expectedBankAccount: updates.expectedBankAccount || currentGlobal.expectedBankAccount || DEFAULT_SYSTEM_CONFIG.expectedBankAccount,
      allowedTimeWindowMinutes: Number(updates.allowedTimeWindowMinutes) || currentGlobal.allowedTimeWindowMinutes || DEFAULT_SYSTEM_CONFIG.allowedTimeWindowMinutes,
      verifiedRefLedger: updates.verifiedRefLedger || currentGlobal.verifiedRefLedger || []
    };

    parsedMeta._globalSystemConfig = mergedGlobal;

    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        subscriptionLink: JSON.stringify(parsedMeta)
      }
    });

    return { success: true, config: mergedGlobal };
  } catch (error: any) {
    console.error("Error updating GlobalSystemConfig:", error);
    return { success: false, error: error?.message || "Failed to update global config" };
  }
}

/**
 * Helper to parse Set-Cookie headers from fetch response
 */
export function parseSetCookieHeaders(res: Response): string[] {
  if (typeof (res.headers as any).getSetCookie === "function") {
    const list = (res.headers as any).getSetCookie();
    if (Array.isArray(list) && list.length > 0) return list;
  }
  const raw = res.headers.get("set-cookie");
  if (!raw) return [];
  return [raw];
}

/**
 * Merges cookies from existing cookie string and a new fetch response
 */
export function mergeCookies(existingCookieStr: string, res: Response): string {
  const cookieMap = new Map<string, string>();
  if (existingCookieStr) {
    existingCookieStr.split(";").forEach(c => {
      const eq = c.indexOf("=");
      if (eq > 0) {
        cookieMap.set(c.slice(0, eq).trim(), c.slice(eq + 1).trim());
      }
    });
  }

  const rawCookies = parseSetCookieHeaders(res);
  for (const rc of rawCookies) {
    if (!rc) continue;
    const segments = rc.split(/,(?=[^;,]+=[^;,]+)/);
    for (const seg of segments) {
      const first = seg.split(";")[0].trim();
      const eq = first.indexOf("=");
      if (eq > 0) {
        const k = first.slice(0, eq).trim();
        const v = first.slice(eq + 1).trim();
        if (k && v && !k.toLowerCase().startsWith("path") && !k.toLowerCase().startsWith("domain") && !k.toLowerCase().startsWith("expires")) {
          cookieMap.set(k, v);
        }
      }
    }
  }

  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

/**
 * 3x-ui Pre-flight CSRF Handshake & Login
 * Handles session cookies and CSRF tokens to avoid 403 Forbidden
 */
export async function authenticate3xui(
  baseUrl: string,
  username: string,
  password: string
): Promise<{ cookie: string; error?: string }> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, "");
  const browserUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  let initialCookie = "";
  let csrfToken = "";

  // Step 1: Pre-flight GET request to extract initial session & CSRF token
  for (const preflightPath of ["/login", "/"]) {
    try {
      const preflightRes = await fetch(`${cleanBase}${preflightPath}`, {
        method: "GET",
        headers: {
          "User-Agent": browserUA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(5000)
      });

      initialCookie = mergeCookies(initialCookie, preflightRes);
      const htmlText = await preflightRes.text();

      const metaMatch = htmlText.match(/<meta[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i) 
                     || htmlText.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']csrf-token["']/i);
      if (metaMatch && metaMatch[1]) {
        csrfToken = metaMatch[1];
        break;
      }
    } catch {}
  }

  // Fallback: If not found in HTML, try /csrf-token endpoint
  if (!csrfToken) {
    try {
      const csrfRes = await fetch(`${cleanBase}/csrf-token`, {
        method: "GET",
        headers: {
          "User-Agent": browserUA,
          ...(initialCookie ? { "Cookie": initialCookie } : {})
        },
        signal: AbortSignal.timeout(3000)
      });
      if (csrfRes.ok) {
        initialCookie = mergeCookies(initialCookie, csrfRes);
        const csrfData = await csrfRes.text();
        try {
          const parsed = JSON.parse(csrfData);
          csrfToken = parsed.token || parsed.csrfToken || parsed.csrf || "";
        } catch {
          csrfToken = csrfData.trim().replace(/^"|"$/g, "");
        }
      }
    } catch {}
  }

  // Step 2: POST /login with initial cookie and CSRF token
  const loginParams = new URLSearchParams();
  loginParams.append("username", username.trim());
  loginParams.append("password", password.trim());

  const loginRes = await fetch(`${cleanBase}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": browserUA,
      ...(initialCookie ? { "Cookie": initialCookie } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken, "x-csrf-token": csrfToken } : {})
    },
    body: loginParams.toString(),
    signal: AbortSignal.timeout(6000)
  });

  if (!loginRes.ok && loginRes.status !== 302) {
    return {
      cookie: "",
      error: `Login failed with HTTP status ${loginRes.status}: ${loginRes.statusText}`
    };
  }

  try {
    const cloned = loginRes.clone();
    const loginJson = await cloned.json();
    if (loginJson && loginJson.success === false) {
      return {
        cookie: "",
        error: loginJson.msg || "Invalid 3x-ui username or password"
      };
    }
  } catch {}

  const finalCookie = mergeCookies(initialCookie, loginRes);
  if (!finalCookie) {
    return {
      cookie: "",
      error: "No session cookie returned by 3x-ui server"
    };
  }

  return { cookie: finalCookie };
}
