import https from "https";
import http from "http";

export class ThreeXUI {
  private baseURL: string;
  private username: string;
  private password: string;
  private cookie: string = "";
  private csrfToken: string = "";

  constructor(baseURL: string, username: string, password: string) {
    this.baseURL = (baseURL || "")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/panel\/?$/, "");
    this.username = (username || "").trim();
    this.password = (password || "").trim();
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

      if (this.cookie) {
        headers["Cookie"] = this.cookie;
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
            if (Array.isArray(setCookies) && setCookies.length > 0) {
              const cookieMap = new Map<string, string>();
              if (this.cookie) {
                this.cookie.split(";").forEach((pair) => {
                  const [k, ...v] = pair.trim().split("=");
                  if (k) cookieMap.set(k.trim(), v.join("="));
                });
              }
              setCookies.forEach((c) => {
                const firstPart = c.split(";")[0];
                const [k, ...v] = firstPart.trim().split("=");
                if (k) cookieMap.set(k.trim(), v.join("="));
              });
              const merged: string[] = [];
              cookieMap.forEach((v, k) => merged.push(`${k}=${v}`));
              this.cookie = merged.join("; ");
            }
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
      this.cookie = "";
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
      if (!this.cookie) {
        throw new Error("Login succeeded but no session cookie was returned by 3x-ui.");
      }
      return { success: true, cookie: this.cookie, data: res.data, msg: res.data?.msg || "Success" };
    }

    throw new Error(
      res.data?.msg || `3x-ui Login failed (HTTP ${res.status})`
    );
  }

  private async request(method: string, path: string, payload?: any) {
    if (!this.cookie) {
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

    if (res.data) {
      return res.data;
    }
    if (res.status >= 400) {
      throw new Error(`3x-ui API error HTTP ${res.status} on ${path}`);
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
}
