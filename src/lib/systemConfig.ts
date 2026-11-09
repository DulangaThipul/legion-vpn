// ========================================================================
// LEGION VPN - GLOBAL SYSTEM CONFIGURATION HELPER (ZERO-MIGRATION)
// Stores global admin configurations in Admin user's subscriptionLink JSON
// ========================================================================

import https from "https";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ISP_DOMAINS, DEFAULT_PACKAGE_SNIS } from "./vlessGenerator";

// Bypass self-signed SSL errors globally for VPS connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

// Create custom HTTPS agent that ignores self-signed certificate errors for serverless runtime
export const unsafeAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function authenticate3xui(nodeConfig: {
  baseUrl: string;
  username: string;
  password: string;
}): Promise<{
  success: boolean;
  cookie?: string;
  latencyMs?: number;
  error?: string;
  details?: any;
}> {
  const rawBase = (nodeConfig.baseUrl || "").trim().replace(/\/+$/, "");
  const username = (nodeConfig.username || "").trim();
  const password = (nodeConfig.password || "").trim();

  if (!rawBase) {
    return { success: false, error: "Base URL is required" };
  }

  const start = performance.now();
  const originUrl = new URL(rawBase).origin;
  const browserUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  const standardHeaders = {
    "User-Agent": browserUA,
    "Origin": originUrl,
    "Referer": `${rawBase}/`,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest"
  };

  try {
    // 1. Pre-flight GET to capture initial session cookie
    let initialCookie = "";
    try {
      const preRes = await fetch(`${rawBase}/`, {
        headers: standardHeaders,
        //@ts-ignore
        agent: unsafeAgent,
        signal: AbortSignal.timeout(6000)
      });
      const rawCookie = preRes.headers.get("set-cookie");
      if (rawCookie) {
        initialCookie = rawCookie;
      }
    } catch {}

    const reqHeaders = {
      ...standardHeaders,
      ...(initialCookie ? { "Cookie": initialCookie } : {})
    };

    // 2. Attempt Login via JSON payload
    let loginRes = await fetch(`${rawBase}/login`, {
      method: "POST",
      headers: {
        ...reqHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password }),
      //@ts-ignore
      agent: unsafeAgent,
      signal: AbortSignal.timeout(6000)
    });

    // Fallback to x-www-form-urlencoded if 404/415 returned on JSON
    if (loginRes.status === 404 || loginRes.status === 415) {
      const formParams = new URLSearchParams();
      formParams.append("username", username);
      formParams.append("password", password);

      loginRes = await fetch(`${rawBase}/login`, {
        method: "POST",
        headers: {
          ...reqHeaders,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formParams.toString(),
        //@ts-ignore
        agent: unsafeAgent,
        signal: AbortSignal.timeout(6000)
      });
    }

    const latencyMs = Math.round(performance.now() - start);
    const postCookie = loginRes.headers.get("set-cookie") || "";
    const finalCookie = [initialCookie, postCookie].filter(Boolean).join("; ");

    let resJson: any = null;
    let resText = "";
    try {
      resText = await loginRes.text();
      resJson = JSON.parse(resText);
    } catch {}

    if (!loginRes.ok) {
      const errMsg = resJson?.msg || resJson?.message || resText || `HTTP ${loginRes.status}: ${loginRes.statusText}`;
      return {
        success: false,
        latencyMs,
        error: `3x-ui Login Rejected (${errMsg})`
      };
    }

    if (resJson && resJson.success === false) {
      return {
        success: false,
        latencyMs,
        error: resJson.msg || "Invalid 3x-ui Username or Password"
      };
    }

    return {
      success: true,
      cookie: finalCookie,
      latencyMs,
      details: resJson
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs,
      error: `Connection failed: ${err?.message || "Server unreachable or SSL handshake failed"}`
    };
  }
}
