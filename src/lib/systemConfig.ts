// ========================================================================
// LEGION VPN - GLOBAL SYSTEM CONFIGURATION HELPER (ZERO-MIGRATION)
// Stores global admin configurations in Admin user's subscriptionLink JSON
// ========================================================================

import https from "https";
import http from "http";
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
  geminiApiKey?: string;
  groqApiKey?: string;
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
  geminiApiKey: "",
  groqApiKey: "",
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
      geminiApiKey: saved.geminiApiKey || process.env.GEMINI_API_KEY || "",
      groqApiKey: saved.groqApiKey || process.env.GROQ_API_KEY || "",
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
      geminiApiKey: updates.geminiApiKey !== undefined ? updates.geminiApiKey : (currentGlobal.geminiApiKey || ""),
      groqApiKey: updates.groqApiKey !== undefined ? updates.groqApiKey : (currentGlobal.groqApiKey || ""),
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

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string | undefined>;
  body?: string | Buffer;
  timeout?: number;
}

export interface HttpResponse {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  json: any;
  cookies: string[];
}

/**
 * Robust low-level HTTP/HTTPS client that bypasses TLS self-signed certificate rejections
 * natively using Node.js https/http module (works 100% reliably in Vercel Serverless & Node runtimes)
 */
export function httpRequestUnsafe(urlStr: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;

      const method = options.method || "GET";
      const headers: Record<string, string | number> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        ...(options.headers as any || {})
      };

      const bodyData = options.body ? (typeof options.body === "string" ? Buffer.from(options.body) : options.body) : null;
      if (bodyData && !headers["Content-Length"] && !headers["content-length"]) {
        headers["Content-Length"] = bodyData.length;
      }

      const req = lib.request(url, {
        method,
        rejectUnauthorized: false, // Critical: allows self-signed SSL certificates on VPS
        timeout: options.timeout || 8000,
        headers
      }, (res) => {
        let raw = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => raw += chunk);
        res.on("end", () => {
          const rawCookies = res.headers["set-cookie"] || [];
          let json: any = null;
          try {
            json = JSON.parse(raw);
          } catch {}
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: raw,
            json,
            cookies: rawCookies
          });
        });
      });

      req.on("timeout", () => {
        req.destroy(new Error(`Request timed out after ${options.timeout || 8000}ms`));
      });

      req.on("error", (err) => {
        reject(err);
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 3x-ui Authenticator with CSRF Pre-Flight Handshake, Session Cookie Capture,
 * and Protocol Auto-Healing (automatically retries https:// if user entered http://)
 */
export async function authenticate3xui(nodeConfig: {
  baseUrl: string;
  username: string;
  password: string;
}): Promise<{
  success: boolean;
  cookie?: string;
  csrfToken?: string;
  effectiveBaseUrl?: string;
  latencyMs?: number;
  error?: string;
  details?: any;
}> {
  let targetUrl = (nodeConfig.baseUrl || "").trim().replace(/\/+$/, "");
  const username = (nodeConfig.username || "").trim();
  const password = (nodeConfig.password || "").trim();

  if (!targetUrl) {
    return { success: false, error: "Base URL is required" };
  }

  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  const start = performance.now();

  // Helper function to perform login attempt against a specific base URL
  async function attemptLogin(baseUrl: string) {
    const origin = new URL(baseUrl).origin;

    // Step 1: Preflight GET to capture initial session cookie and CSRF token from HTML
    const preRes = await httpRequestUnsafe(`${baseUrl}/`, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Origin": origin,
        "Referer": `${baseUrl}/`
      }
    });

    const initialCookie = (preRes.cookies || []).map(c => c.split(";")[0]).join("; ");
    const csrfMatch = preRes.body.match(/<meta[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i) ||
                      preRes.body.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']csrf-token["']/i);
    const csrfToken = csrfMatch ? csrfMatch[1] : "";

    // Step 2: POST /login with credentials, initial session cookie, and CSRF token
    const loginPayload = JSON.stringify({ username, password });
    const loginHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Origin": origin,
      "Referer": `${baseUrl}/`,
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json, text/plain, */*",
      ...(initialCookie ? { "Cookie": initialCookie } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
    };

    let loginRes = await httpRequestUnsafe(`${baseUrl}/login`, {
      method: "POST",
      headers: loginHeaders,
      body: loginPayload
    });

    // Fallback to x-www-form-urlencoded if JSON failed or rejected
    if (loginRes.statusCode !== 200 || (loginRes.json && loginRes.json.success === false)) {
      const formBody = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const fallbackRes = await httpRequestUnsafe(`${baseUrl}/login`, {
        method: "POST",
        headers: {
          ...loginHeaders,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formBody
      });
      if (fallbackRes.statusCode === 200 && (!fallbackRes.json || fallbackRes.json.success !== false)) {
        loginRes = fallbackRes;
      }
    }

    const postCookies = (loginRes.cookies || []).map(c => c.split(";")[0]).join("; ");
    const finalCookie = postCookies || initialCookie;

    return {
      statusCode: loginRes.statusCode,
      json: loginRes.json,
      body: loginRes.body,
      cookie: finalCookie,
      csrfToken,
      effectiveBaseUrl: baseUrl
    };
  }

  let result: any = null;
  const isHttp = targetUrl.startsWith("http://");
  const altUrl = isHttp
    ? targetUrl.replace(/^http:\/\//, "https://")
    : targetUrl.replace(/^https:\/\//, "http://");

  try {
    result = await attemptLogin(targetUrl);
    // If targetUrl was http:// and failed (e.g. 400 Bad Request against HTTPS port, or 404), try altUrl!
    if (result.statusCode !== 200 || (result.json && result.json.success === false)) {
      try {
        const altResult = await attemptLogin(altUrl);
        if (altResult.statusCode === 200 && (!altResult.json || altResult.json.success !== false)) {
          result = altResult;
        }
      } catch {}
    }
  } catch (err: any) {
    try {
      result = await attemptLogin(altUrl);
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        latencyMs,
        error: `Connection failed: ${err?.message || "Server unreachable or connection reset"}`
      };
    }
  }

  const latencyMs = Math.round(performance.now() - start);

  if (result.statusCode !== 200) {
    const errMsg = result.json?.msg || result.body || `HTTP ${result.statusCode}`;
    return {
      success: false,
      latencyMs,
      error: `3x-ui Login Rejected (${errMsg})`
    };
  }

  if (result.json && result.json.success === false) {
    return {
      success: false,
      latencyMs,
      error: result.json.msg || "Invalid 3x-ui Username or Password"
    };
  }

  return {
    success: true,
    latencyMs,
    cookie: result.cookie,
    csrfToken: result.csrfToken,
    effectiveBaseUrl: result.effectiveBaseUrl,
    details: result.json
  };
}
