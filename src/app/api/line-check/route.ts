import { NextResponse } from "next/server";
import dns from "dns";
import net from "net";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let rawHost = (body.host || "").trim();
    const rawPort = parseInt(body.port, 10) || 443;

    if (!rawHost) {
      return NextResponse.json({
        success: false,
        error: "Host is required",
        dnsOk: false,
        reachable: false
      });
    }

    // Clean host in case user or config includes protocol or port
    let cleanHost = rawHost.replace(/^[a-z]+:\/\//i, "").replace(/:[0-9]+$/, "").trim();

    // Auto-map unresolvable legacy subdomain singapore.legiongraphics.site to active root domain legiongraphics.site
    if (cleanHost.toLowerCase() === "singapore.legiongraphics.site") {
      cleanHost = "legiongraphics.site";
    }

    // 🛡️ STRICT LEGION BRAND RESTRICTION:
    // Only configs with *.legiongraphics.site or legiongraphics.site (or official dedicated server IPs) are permitted.
    // External / other sellers' domains are blocked.
    const isLegionDomain = 
      cleanHost.toLowerCase() === "legiongraphics.site" || 
      cleanHost.toLowerCase().endsWith(".legiongraphics.site");

    const isLegionDedicatedIp = [
      "23.94.85.181", 
      "143.42.79.58", 
      "103.170.217.251", 
      "103.179.44.75"
    ].includes(cleanHost);

    if (!isLegionDomain && !isLegionDedicatedIp) {
      return NextResponse.json({
        success: false,
        host: cleanHost,
        port: rawPort,
        dnsOk: false,
        reachable: false,
        isLegionAuthorized: false,
        error: "Access Denied: Only official Legion VPN domains (*.legiongraphics.site) are permitted. Third-party seller configs cannot be checked."
      }, { status: 403 });
    }

    // 1. Check DNS Resolution
    let resolvedIp = "";
    let dnsOk = false;
    let dnsError = "";

    try {
      const lookupResult = await dns.promises.lookup(cleanHost, { all: false });
      if (lookupResult && lookupResult.address) {
        resolvedIp = lookupResult.address;
        dnsOk = true;
      }
    } catch (err: any) {
      dnsOk = false;
      dnsError = err?.code || err?.message || "DNS Lookup Failed";
    }

    // If DNS failed completely, return immediately with accurate diagnosis
    if (!dnsOk) {
      return NextResponse.json({
        success: true,
        host: cleanHost,
        port: rawPort,
        dnsOk: false,
        ip: null,
        reachable: false,
        latencyMs: 0,
        country: null,
        countryCode: null,
        city: null,
        error: `DNS resolution failed: ${dnsError}. Domain does not exist or has no active DNS A/AAAA records.`
      });
    }

    // 2. Perform TCP Connect Probe to host:port with 2500ms timeout
    const tcpStart = performance.now();
    const tcpResult = await new Promise<{ reachable: boolean; latencyMs: number; error?: string }>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);

      socket.on("connect", () => {
        const latency = Math.max(1, Math.round(performance.now() - tcpStart));
        socket.destroy();
        resolve({ reachable: true, latencyMs: latency });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({ reachable: false, latencyMs: 2500, error: "Connection timed out (2.5s)" });
      });

      socket.on("error", (err: any) => {
        socket.destroy();
        resolve({ reachable: false, latencyMs: Math.round(performance.now() - tcpStart), error: err.code || err.message });
      });

      try {
        socket.connect(rawPort, resolvedIp || cleanHost);
      } catch (err: any) {
        resolve({ reachable: false, latencyMs: 0, error: err?.message || "Socket connect failed" });
      }
    });

    // 3. GeoIP Lookup for Country & City
    let country = "";
    let countryCode = "";
    let city = "";
    let org = "";

    const targetIp = resolvedIp || cleanHost;
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,country,countryCode,city,org`, {
        signal: AbortSignal.timeout(1800),
        cache: "no-store"
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.status === "success") {
          country = geoData.country || "";
          countryCode = geoData.countryCode || "";
          city = geoData.city || "";
          org = geoData.org || "";
        }
      }
    } catch {}

    // Fallback if GeoIP returned empty or was throttled
    if (!countryCode) {
      const lower = cleanHost.toLowerCase();
      if (lower.includes("usa") || lower.includes("bonus-usa") || targetIp === "23.94.85.181" || targetIp === "40.160.38.154") {
        country = "United States";
        countryCode = "US";
        city = "Los Angeles";
      } else if (lower.includes("sg") || lower.includes("singapore") || targetIp === "143.42.79.58" || targetIp === "103.179.44.75" || targetIp === "103.170.217.251") {
        country = "Singapore";
        countryCode = "SG";
        city = "Singapore";
      }
    }

    return NextResponse.json({
      success: true,
      host: cleanHost,
      port: rawPort,
      dnsOk: true,
      ip: resolvedIp,
      reachable: tcpResult.reachable,
      latencyMs: tcpResult.latencyMs,
      country: country || null,
      countryCode: countryCode || null,
      city: city || null,
      org: org || null,
      error: tcpResult.error || null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal diagnostic error",
      dnsOk: false,
      reachable: false
    }, { status: 500 });
  }
}

