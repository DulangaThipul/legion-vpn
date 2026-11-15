import https from "https";
import http from "http";

export class ThreeXUI {
  private baseURL: string;
  private username: string;
  private password: string;
  private cookieJar: Map<string, string> = new Map<string, string>();
  private csrfToken: string = "";

  constructor(baseURL: string, username: string, password: string) {
    this.baseURL = (baseURL || "")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/panel\/?$/, "");
    this.username = (username || "").trim();
    this.password = (password || "").trim();
  }

  get cookie(): string {
    return this.getCookieString();
  }

  private getCookieString(): string {
    const pairs: string[] = [];
    this.cookieJar.forEach((val, key) => {
      pairs.push(`${key}=${val}`);
    });
    return pairs.join("; ");
  }

  private updateCookies(setCookies?: string | string[]) {
    if (!setCookies) return;
    const cookieArray = Array.isArray(setCookies) ? setCookies : [setCookies];
    for (const c of cookieArray) {
      if (!c || typeof c !== "string") continue;
      const firstPart = c.split(";")[0];
      const eqIdx = firstPart.indexOf("=");
      if (eqIdx !== -1) {
        const k = firstPart.slice(0, eqIdx).trim();
        const v = firstPart.slice(eqIdx + 1).trim();
        if (k) {
          this.cookieJar.set(k, v);
        }
      }
    }
  }

  private rawRequest(
    method: string,
    path: string,
    body?: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any; rawText: string }> {
    return new Promise((resolve, reject) => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const targetUrl = new URL(`${this.baseURL}${cleanPath}`);
      const isHttps = targetUrl.protocol === "https:";
      const transport = isHttps ? https : http;

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": targetUrl.origin,
        "Referer": `${this.baseURL}/`,
        ...extraHeaders
      };

      const cookieStr = this.getCookieString();
      if (cookieStr) {
        headers["Cookie"] = cookieStr;
      }
      if (this.csrfToken && method.toUpperCase() !== "GET") {
        headers["X-CSRF-Token"] = this.csrfToken;
      }
      if (body !== undefined) {
        headers["Content-Length"] = Buffer.byteLength(body).toString();
      }

      const req = transport.request(
        {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (isHttps ? 443 : 80),
          path: `${targetUrl.pathname}${targetUrl.search}`,
          method,
          headers,
          rejectUnauthorized: false,
          timeout: 15000
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          res.on("end", () => {
            const rawText = Buffer.concat(chunks).toString("utf8");
            const setCookies = res.headers["set-cookie"];
            this.updateCookies(setCookies);

            let parsedJson: any = null;
            try {
              parsedJson = JSON.parse(rawText);
            } catch {}

            resolve({
              status: res.statusCode || 0,
              headers: res.headers,
              data: parsedJson,
              rawText
            });
          });
        }
      );

      req.on("timeout", () => {
        req.destroy(new Error("Request timeout - 3x-ui server took too long to respond"));
      });
      req.on("error", (err) => reject(err));

      if (body !== undefined) {
        req.write(body);
      }
      req.end();
    });
  }

  async login(forceRefresh = false) {
    if (forceRefresh) {
      this.cookieJar.clear();
      this.csrfToken = "";
    }

    // 1. Check optional /csrf-token endpoint (newer React-based 3x-ui panels)
    try {
      const csrfRes = await this.rawRequest("GET", "/csrf-token");
      if (csrfRes.status === 200 && csrfRes.data?.success && csrfRes.data?.obj) {
        this.csrfToken = csrfRes.data.obj;
      }
    } catch {}

    const formBody = new URLSearchParams({
      username: this.username,
      password: this.password
    }).toString();

    const formHeaders = {
      "Content-Type": "application/x-www-form-urlencoded"
    };

    // 2. Try modern /panel/api/login first, then fallback to classic /login
    let res = await this.rawRequest("POST", "/panel/api/login", formBody, formHeaders);
    if (res.status === 404 || res.status === 405) {
      res = await this.rawRequest("POST", "/login", formBody, formHeaders);
    }

    // If form-urlencoded was rejected, try JSON
    if (res.status >= 400 || (res.data && res.data.success === false)) {
      const jsonBody = JSON.stringify({ username: this.username, password: this.password });
      const jsonHeaders = { "Content-Type": "application/json" };
      let jsonRes = await this.rawRequest("POST", "/panel/api/login", jsonBody, jsonHeaders);
      if (jsonRes.status === 404 || jsonRes.status === 405) {
        jsonRes = await this.rawRequest("POST", "/login", jsonBody, jsonHeaders);
      }
      if (jsonRes.status >= 200 && jsonRes.status < 300 && (jsonRes.data?.success || jsonRes.data === null)) {
        res = jsonRes;
      }
    }

    if (res.status >= 200 && res.status < 300 && (res.data?.success || res.data === null || res.data === undefined)) {
      const cookieStr = this.getCookieString();
      if (!cookieStr) {
        throw new Error("Login succeeded but no session cookie was returned by 3x-ui.");
      }
      return { success: true, cookie: cookieStr, data: res.data, msg: res.data?.msg || "Success" };
    }

    throw new Error(
      res.data?.msg || res.data?.error || `3x-ui Login failed (HTTP ${res.status})`
    );
  }

  private async request(method: string, path: string, payload?: any) {
    if (this.cookieJar.size === 0) {
      await this.login();
    }

    const isForm = typeof payload === "string";
    const bodyStr = payload === undefined ? undefined : isForm ? payload : JSON.stringify(payload);
    const headers: Record<string, string> = {};
    if (bodyStr !== undefined) {
      headers["Content-Type"] = isForm ? "application/x-www-form-urlencoded" : "application/json";
    }

    let res = await this.rawRequest(method, path, bodyStr, headers);

    // Auto-recover if session expired
    if (res.status === 401 || (typeof res.rawText === "string" && res.rawText.trim().toLowerCase().startsWith("<!doctype html"))) {
      await this.login(true);
      res = await this.rawRequest(method, path, bodyStr, headers);
    }

    // Preserve exact error message from 3x-ui panel when status >= 400
    if (res.status >= 400) {
      const errMsg =
        res.data?.msg ||
        res.data?.error ||
        (typeof res.data === "string" ? res.data : "") ||
        `3x-ui HTTP ${res.status} on ${path}`;
      const err = new Error(errMsg);
      (err as any).status = res.status;
      (err as any).data = res.data;
      throw err;
    }

    if (res.data) {
      return res.data;
    }
    return { success: true, raw: res.rawText };
  }

  getInbounds() {
    return this.request("GET", "/panel/api/inbounds/list");
  }

  getInbound(id: number) {
    return this.request("GET", `/panel/api/inbounds/get/${id}`);
  }

  addClient(clientConfig: { id: number; settings: string }) {
    return this.request("POST", "/panel/api/inbounds/addClient", clientConfig);
  }

  addModernClient(data: { inboundIds: number[]; client: any }) {
    let totalBytes = Number(data.client?.totalGB || 0);
    if (totalBytes > 0 && totalBytes < 100000) {
      totalBytes = totalBytes * 1024 * 1024 * 1024;
    }
    const convertedClient = data.client
      ? {
          ...data.client,
          totalGB: totalBytes
        }
      : undefined;
    return this.request("POST", "/panel/api/clients/add", {
      ...data,
      client: convertedClient
    });
  }

  updateModernClient(email: string, client: any) {
    let totalBytes = Number(client?.totalGB || 0);
    if (totalBytes > 0 && totalBytes < 100000) {
      totalBytes = totalBytes * 1024 * 1024 * 1024;
    }
    const convertedClient = client
      ? {
          ...client,
          totalGB: totalBytes
        }
      : undefined;
    return this.request("POST", `/panel/api/clients/update/${encodeURIComponent(email)}`, convertedClient);
  }

  updateClient(clientUuid: string, clientConfig: { id: number; settings: string }) {
    return this.request("POST", `/panel/api/inbounds/updateClient/${clientUuid}`, clientConfig);
  }

  getClientLinks(email: string) {
    return this.request("GET", `/panel/api/clients/links/${encodeURIComponent(email)}`);
  }

  getSubLinks(subId: string) {
    return this.request("GET", `/panel/api/clients/subLinks/${encodeURIComponent(subId)}`);
  }

  /**
   * Resets used traffic to 0 GB, sets exact 30 days validity from now,
   * and updates total quota on the Primary Singapore 3x-ui Node (ignoring USA node).
   */
  async renewClientFromPrimaryConfig(params: {
    userEmail: string;
    vlessUuid?: string;
    vlessRemark?: string;
    quotaGb: number; // 0 if Unlimited, or 20/50/100/200/300/500
    isUnlimited: boolean;
  }) {
    await this.login();

    const inboundsRes = await this.getInbounds();
    const inbounds: any[] = Array.isArray(inboundsRes?.obj) ? inboundsRes.obj : [];

    let matchedInbound: any = null;
    let matchedClient: any = null;

    const targetEmailLower = (params.userEmail || "").trim().toLowerCase();
    const targetRemarkLower = (params.vlessRemark || "").trim().toLowerCase();
    const targetUuidLower = (params.vlessUuid || "").trim().toLowerCase();

    for (const ib of inbounds) {
      let settings: any = {};
      if (typeof ib.settings === "string") {
        try {
          settings = JSON.parse(ib.settings);
        } catch {}
      } else if (typeof ib.settings === "object" && ib.settings !== null) {
        settings = ib.settings;
      }
      const clients: any[] = Array.isArray(settings?.clients) ? settings.clients : [];

      for (const c of clients) {
        const cId = String(c.id || "").trim().toLowerCase();
        const cEmail = String(c.email || "").trim().toLowerCase();

        // Match by #1 UUID first, or exact #1 remark, or client Gmail inside the remark
        if (
          (targetUuidLower && cId === targetUuidLower) ||
          (targetRemarkLower && cEmail === targetRemarkLower) ||
          (targetEmailLower && cEmail.includes(targetEmailLower))
        ) {
          matchedInbound = ib;
          matchedClient = c;
          break;
        }
      }
      if (matchedClient) break;
    }

    if (!matchedInbound || !matchedClient) {
      throw new Error(`Client configuration not found in 3x-ui for ${params.userEmail}`);
    }

    const inboundId = Number(matchedInbound.id);
    const clientEmail = String(matchedClient.email);
    const clientUuid = String(matchedClient.id);

    // 1. RESET USED TRAFFIC TO 0 GB (0 bytes up / 0 bytes down)
    try {
      await this.request("POST", `/panel/api/inbounds/${inboundId}/resetClientTraffic/${encodeURIComponent(clientEmail)}`);
    } catch {
      try {
        await this.request("POST", `/panel/api/clients/resetTraffic/${encodeURIComponent(clientEmail)}`);
      } catch {}
    }

    // 2. SET TOTAL QUOTA (0 bytes = Unlimited in 3x-ui; otherwise exact GB in bytes)
    const exactTotalBytes = params.isUnlimited
      ? 0
      : Number(params.quotaGb) * 1024 * 1024 * 1024;

    // 3. SET EXPIRY TO EXACTLY 30 DAYS FROM THIS SECOND (Date.now() + 30 days)
    const exactExpiryTimeMs = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const updatedClientObj = {
      ...matchedClient,
      id: clientUuid,
      email: clientEmail,
      totalGB: exactTotalBytes,
      expiryTime: exactExpiryTimeMs,
      enable: true
    };

    // 4. UPDATE CLIENT IN 3X-UI (Primary node only — never touch USA node)
    let updateRes = await this.request(
      "POST",
      `/panel/api/inbounds/updateClient/${clientUuid}`,
      {
        id: inboundId,
        settings: JSON.stringify({
          clients: [updatedClientObj]
        })
      }
    ).catch(() => null);

    if (!updateRes || updateRes.success === false) {
      updateRes = await this.request(
        "POST",
        `/panel/api/clients/update/${encodeURIComponent(clientEmail)}`,
        updatedClientObj
      );
    }

    if (!updateRes || updateRes.success === false) {
      throw new Error(updateRes?.msg || `Failed to update client ${clientEmail} in 3x-ui`);
    }

    return {
      success: true,
      inboundId,
      clientEmail,
      resetUsedTo: "0 GB",
      newTotalQuota: params.isUnlimited ? "Unlimited" : `${params.quotaGb} GB`,
      newExpiryDate: new Date(exactExpiryTimeMs).toISOString().split("T")[0],
      expiryTimeMs: exactExpiryTimeMs
    };
  }
}

/**
 * Extracts quota from Primary Config #1 title (e.g. "Dialog Zoom (200GB)" -> 200 GB, "Airtel Unlimited" -> Unlimited)
 */
export function extractQuotaFromPrimaryConfig(configTitle: string, fallbackDataTotal?: string): {
  isUnlimited: boolean;
  quotaGb: number; // 0 for Unlimited in 3x-ui, or exact GB (20, 50, 100, 200, 300, 500)
  displayQuota: string; // "Unlimited" or "200 GB"
} {
  const sourceText = `${configTitle || ""} ${fallbackDataTotal || ""}`.trim();

  if (/unlimited/i.test(sourceText)) {
    return { isUnlimited: true, quotaGb: 0, displayQuota: "Unlimited" };
  }

  const gbMatch = sourceText.match(/\b(20|50|100|200|300|500)\s*gb\b/i) || sourceText.match(/(\d+)\s*gb/i);
  if (gbMatch && gbMatch[1]) {
    const parsedGb = Number(gbMatch[1]);
    return { isUnlimited: false, quotaGb: parsedGb, displayQuota: `${parsedGb} GB` };
  }

  return { isUnlimited: false, quotaGb: 100, displayQuota: "100 GB" };
}

/**
 * Extracts UUID, decoded remark, and tariff price from Config #1 VLESS URI
 */
export function parsePrimaryVlessUri(vlessUri: string, userEmail: string) {
  const uuidMatch = (vlessUri || "").match(/vless:\/\/([^@]+)@/i);
  const extractedUuid = uuidMatch ? uuidMatch[1].trim() : "";

  const hashIndex = (vlessUri || "").indexOf("#");
  const rawFragment = hashIndex !== -1 ? vlessUri.slice(hashIndex + 1).trim() : "";
  const decodedRemark = decodeURIComponent(rawFragment);

  // Extract price from remark like LEGION-VPN-724Dialog-email@gmail.com
  const priceMatch = decodedRemark.match(/LEGION-VPN-(\d+)/i);
  const extractedPrice = priceMatch ? Number(priceMatch[1]) : null;

  return {
    uuid: extractedUuid,
    remark: decodedRemark,
    extractedPrice,
    userEmail: (userEmail || "").trim().toLowerCase()
  };
}
