import { NextResponse } from "next/server";
import dns from "dns";
import net from "net";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawHost = (body.host || "").trim();
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
    const cleanHost = rawHost.replace(/^[a-z]+:\/\//i, "").replace(/:[0-9]+$/, "").trim();

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

    return NextResponse.json({
      success: true,
      host: cleanHost,
      port: rawPort,
      dnsOk: true,
      ip: resolvedIp,
      reachable: tcpResult.reachable,
      latencyMs: tcpResult.latencyMs,
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
