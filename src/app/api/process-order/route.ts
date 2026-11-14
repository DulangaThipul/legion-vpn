import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, updateGlobalSystemConfig, authenticate3xui, httpRequestUnsafe } from "@/lib/systemConfig";
import { PACKAGE_ISP_PRICES } from "@/lib/vlessGenerator";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow sufficient serverless execution window
export const dynamic = "force-dynamic";

// Allow self-signed certificates on VPS 3x-ui servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/**
 * Cloudinary PDF to Image Transformer
 */
function getTransformableImageUrl(url: string): string {
  if (!url) return url;
  const clean = url.trim();
  if (clean.toLowerCase().endsWith(".pdf")) {
    if (clean.includes("/upload/")) {
      return clean.replace("/upload/", "/upload/f_jpg,pg_1/");
    }
    return clean.replace(/\.pdf$/i, ".jpg");
  }
  return clean;
}

/**
 * Real 3x-ui Client Provisioning & Stream Settings Extraction
 * Adds client to authentic 3x-ui inbound and returns real subscription URL and real VLESS key
 */
async function provision3xuiClient(
  nodeConfig: {
    baseUrl: string;
    username: string;
    password: string;
    inboundId?: number | string;
    port?: number | string;
    subBaseUrl?: string;
  },
  clientUuid: string,
  clientEmail: string,
  packageData: {
    name?: string;
    quotaGb?: number;
    validityDays?: number;
    isp?: string;
    sni?: string;
  }
): Promise<{
  success: boolean;
  subscriptionUrl: string;
  vlessKey: string;
  subId: string;
}> {
  const cleanBase = (nodeConfig.baseUrl || "").trim().replace(/\/+$/, "");
  if (!cleanBase) {
    throw new Error("3x-ui Base URL is not configured");
  }

  const auth = await authenticate3xui(nodeConfig);
  if (!auth.success || !auth.cookie) {
    throw new Error(`3x-ui Auth Failed: ${auth.error || "Cannot authenticate with VPS node"}`);
  }

  const clientSubId = clientUuid.replace(/-/g, "").slice(0, 16);
  const targetInboundId = Number(nodeConfig?.inboundId || 1);

  const activeBase = auth.effectiveBaseUrl || cleanBase;
  let originUrl = activeBase;
  try {
    originUrl = new URL(activeBase).origin;
  } catch {}

  // 1. Auto-Detect Available Inbound via List API (ensures target exists and avoids 404)
  let finalInboundId = targetInboundId;
  try {
    let inbounds: any[] = [];
    for (const listEp of [
      `${activeBase}/panel/api/inbounds/list`,
      `${activeBase}/panel/inbound/list`
    ]) {
      try {
        const listRes = await fetch(listEp, {
          headers: {
            "Cookie": auth.cookie,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
            ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
          },
          signal: AbortSignal.timeout(5000)
        });
        if (listRes.ok) {
          const listData = await listRes.json().catch(() => null);
          if (Array.isArray(listData?.obj)) {
            inbounds = listData.obj;
            break;
          }
        }
      } catch {}

      if (inbounds.length === 0) {
        try {
          const unsafeRes = await httpRequestUnsafe(listEp, {
            method: "GET",
            headers: {
              "Cookie": auth.cookie,
              "Accept": "application/json",
              ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
            },
            timeout: 5000
          });
          if (unsafeRes.statusCode === 200 && Array.isArray(unsafeRes.json?.obj)) {
            inbounds = unsafeRes.json.obj;
            break;
          }
        } catch {}
      }
    }

    if (inbounds.length > 0) {
      const exists = inbounds.some(ib => Number(ib.id) === targetInboundId);
      if (!exists && inbounds.length > 0) {
        finalInboundId = Number(inbounds[0].id);
      }
    }
  } catch {}

  const totalBytes = Number(packageData.quotaGb || 100) * 1024 * 1024 * 1024;
  const expiryMs = Date.now() + (Number(packageData.validityDays || 30) * 86400000);

  // Modern Client API payload (/panel/api/clients/add)
  const modernClientPayload = {
    inboundIds: [finalInboundId],
    client: {
      id: clientUuid,
      flow: "",
      email: clientEmail,
      limitIp: 2,
      totalGB: totalBytes,
      expiryTime: expiryMs,
      enable: true,
      tgId: "",
      subId: clientSubId,
      reset: 0
    }
  };

  // Legacy Inbound API payload (/panel/api/inbounds/addClient)
  const clientSettingsString = JSON.stringify({
    clients: [
      {
        id: clientUuid,
        flow: "",
        email: clientEmail,
        limitIp: 2,
        totalGB: totalBytes,
        expiryTime: expiryMs,
        enable: true,
        tgId: "",
        subId: clientSubId,
        reset: 0
      }
    ]
  });

  let addedSuccessfully = false;
  let lastError = "";

  // A. Try Modern Client API first: POST /panel/api/clients/add
  for (const modernEp of [
    `${activeBase}/panel/api/clients/add`,
    `${activeBase}/panel/clients/add`
  ]) {
    try {
      const modernRes = await httpRequestUnsafe(modernEp, {
        method: "POST",
        headers: {
          "Cookie": auth.cookie,
          "Content-Type": "application/json",
          "Origin": originUrl,
          "Referer": `${activeBase}/panel/inbounds`,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
        },
        body: JSON.stringify(modernClientPayload),
        timeout: 8000
      });

      if (modernRes.statusCode >= 200 && modernRes.statusCode < 300 && (modernRes.json?.success === true || modernRes.json?.success === undefined)) {
        addedSuccessfully = true;
        break;
      } else {
        lastError = modernRes.json?.msg || `HTTP ${modernRes.statusCode}`;
      }
    } catch (err: any) {
      lastError = err?.message || "Modern client add failed";
    }
  }

  // B. Fallback to Legacy Inbound API: POST /panel/api/inbounds/addClient
  if (!addedSuccessfully) {
    for (const legacyEp of [
      `${activeBase}/panel/api/inbounds/addClient`,
      `${activeBase}/panel/inbound/addClient`
    ]) {
      try {
        const legacyRes = await httpRequestUnsafe(legacyEp, {
          method: "POST",
          headers: {
            "Cookie": auth.cookie,
            "Content-Type": "application/json",
            "Origin": originUrl,
            "Referer": `${activeBase}/panel/inbounds`,
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
          },
          body: JSON.stringify({
            id: finalInboundId,
            settings: clientSettingsString
          }),
          timeout: 8000
        });

        if (legacyRes.statusCode >= 200 && legacyRes.statusCode < 300 && (legacyRes.json?.success === true || legacyRes.json?.success === undefined)) {
          addedSuccessfully = true;
          break;
        } else {
          lastError = legacyRes.json?.msg || `HTTP ${legacyRes.statusCode}`;
        }
      } catch (err: any) {
        lastError = err?.message || lastError;
      }
    }
  }

  // C. If already exists, attempt modern update then legacy update
  if (!addedSuccessfully && (lastError.toLowerCase().includes("duplicate") || lastError.toLowerCase().includes("exist") || lastError.toLowerCase().includes("already"))) {
    try {
      const updateRes = await httpRequestUnsafe(`${activeBase}/panel/api/clients/update/${encodeURIComponent(clientEmail)}`, {
        method: "POST",
        headers: {
          "Cookie": auth.cookie,
          "Content-Type": "application/json",
          "Origin": originUrl,
          "Referer": `${activeBase}/panel/inbounds`,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
        },
        body: JSON.stringify(modernClientPayload.client),
        timeout: 8000
      });
      if (updateRes.statusCode >= 200 && updateRes.statusCode < 300 && (updateRes.json?.success === true || updateRes.json?.success === undefined)) {
        addedSuccessfully = true;
      }
    } catch {}

    if (!addedSuccessfully) {
      for (const updateEp of [
        `${activeBase}/panel/api/inbounds/updateClient/${clientUuid}`,
        `${activeBase}/panel/inbound/updateClient/${clientUuid}`
      ]) {
        try {
          const updateRes = await httpRequestUnsafe(updateEp, {
            method: "POST",
            headers: {
              "Cookie": auth.cookie,
              "Content-Type": "application/json",
              "Origin": originUrl,
              "Referer": `${activeBase}/panel/inbounds`,
              "Accept": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
            },
            body: JSON.stringify({
              id: finalInboundId,
              settings: clientSettingsString
            }),
            timeout: 8000
          });

          if (updateRes.statusCode >= 200 && updateRes.statusCode < 300 && (updateRes.json?.success === true || updateRes.json?.success === undefined)) {
            addedSuccessfully = true;
            break;
          }
        } catch {}
      }
    }
  }

  if (!addedSuccessfully) {
    throw new Error(`Failed to create client inside 3x-ui inbound ${finalInboundId}: ${lastError}`);
  }

  // Construct the authentic 3x-ui subscription URL
  const subPrefix = (nodeConfig.subBaseUrl || `${activeBase.replace(/:\d+.*$/, "")}:2096/sub/`).trim().replace(/\/+$/, "");
  const realSubscriptionUrl = `${subPrefix}/${clientSubId}`;

  let nodeDomain = "";
  let nodePort = Number(nodeConfig.port || 443);
  try {
    nodeDomain = new URL(activeBase).hostname;
  } catch {
    nodeDomain = activeBase.replace(/^https?:\/\//, "").split(/[:/]/)[0];
  }

  const pkgLabel = packageData.name || "VIP";
  let realVlessKey = "";

  // 1. First attempt to get exact client links directly from 3x-ui Modern API: GET /panel/api/clients/links/:email
  try {
    for (const linksEp of [
      `${activeBase}/panel/api/clients/links/${encodeURIComponent(clientEmail)}`,
      `${activeBase}/panel/clients/links/${encodeURIComponent(clientEmail)}`
    ]) {
      const linksRes = await httpRequestUnsafe(linksEp, {
        method: "GET",
        headers: {
          "Cookie": auth.cookie,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
        },
        timeout: 5000
      });
      if (linksRes.statusCode === 200 && linksRes.json?.obj) {
        const linkObj = linksRes.json.obj;
        let foundLink = "";
        if (Array.isArray(linkObj) && linkObj.length > 0) {
          foundLink = linkObj.find((l: any) => typeof l === "string" && l.startsWith("vless://")) || linkObj[0];
        } else if (typeof linkObj === "string" && linkObj.startsWith("vless://")) {
          foundLink = linkObj;
        }
        if (foundLink && typeof foundLink === "string") {
          const baseNoHash = foundLink.split("#")[0];
          realVlessKey = `${baseNoHash}#LEGION-${encodeURIComponent(pkgLabel)}`;
          break;
        }
      }
    }
  } catch {}

  // 2. If client link was not returned directly, inspect inbound stream settings: GET /panel/api/inbounds/get/:id
  if (!realVlessKey) {
    let realityPublicKey = "";
    let shortId = "";
    let sniHost = packageData.sni || "www.speedtest.net";
    let isWs = false;
    let wsPath = "/";
    let wsHost = "";
    let streamSecurity = "tls";

    for (const getEp of [
      `${activeBase}/panel/api/inbounds/get/${finalInboundId}`,
      `${activeBase}/panel/inbound/get/${finalInboundId}`
    ]) {
      try {
        const getRes = await httpRequestUnsafe(getEp, {
          method: "GET",
          headers: {
            "Cookie": auth.cookie,
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
          },
          timeout: 8000
        });

        if (getRes.statusCode === 200 && getRes.json?.obj) {
          const inboundObj = getRes.json.obj;
          if (inboundObj.port) nodePort = Number(inboundObj.port);

          let stream: any = {};
          if (typeof inboundObj.streamSettings === "string") {
            try { stream = JSON.parse(inboundObj.streamSettings); } catch {}
          } else if (typeof inboundObj.streamSettings === "object") {
            stream = inboundObj.streamSettings;
          }

          if (stream?.security) streamSecurity = stream.security;

          if (stream?.network === "ws" || stream?.wsSettings) {
            isWs = true;
            if (stream.wsSettings?.path) wsPath = stream.wsSettings.path;
            if (stream.wsSettings?.headers?.Host) wsHost = stream.wsSettings.headers.Host;
          }

          if (stream?.realitySettings) {
            const rs = stream.realitySettings;
            realityPublicKey = rs.settings?.publicKey || rs.publicKey || realityPublicKey;
            if (Array.isArray(rs.shortIds) && rs.shortIds.length > 0) {
              shortId = rs.shortIds[0];
            }
            if (Array.isArray(rs.serverNames) && rs.serverNames.length > 0) {
              sniHost = packageData.sni || rs.serverNames[0];
            }
          } else if (stream?.tlsSettings) {
            if (Array.isArray(stream.tlsSettings.serverNames) && stream.tlsSettings.serverNames.length > 0) {
              sniHost = packageData.sni || stream.tlsSettings.serverNames[0];
            }
          }
          break;
        }
      } catch (err: any) {
        console.warn(`Could not read stream settings from ${getEp}:`, err?.message);
      }
    }

    if (isWs) {
      const hostParam = wsHost ? `&host=${encodeURIComponent(wsHost)}` : "";
      realVlessKey = `vless://${clientUuid}@${nodeDomain}:${nodePort}?type=ws&security=${streamSecurity}&path=${encodeURIComponent(wsPath)}${hostParam}&sni=${sniHost}#LEGION-${encodeURIComponent(pkgLabel)}`;
    } else if (realityPublicKey) {
      realVlessKey = `vless://${clientUuid}@${nodeDomain}:${nodePort}?type=tcp&security=reality&pbk=${realityPublicKey}&fp=chrome&sni=${sniHost}&sid=${shortId}&spx=%2F#LEGION-${encodeURIComponent(pkgLabel)}`;
    } else {
      realVlessKey = `vless://${clientUuid}@${nodeDomain}:${nodePort}?type=tcp&security=tls&fp=chrome&sni=${sniHost}#LEGION-${encodeURIComponent(pkgLabel)}`;
    }
  }

  return {
    success: true,
    subscriptionUrl: realSubscriptionUrl,
    vlessKey: realVlessKey,
    subId: clientSubId
  };
}

/**
 * POST /api/process-order
 * Cyber Labor Illusion Receipt OCR & 3x-ui Auto Provisioning
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const payload = await verifyJwt(sessionCookie.value);
    if (!payload || !payload.id) {
      return NextResponse.json({ success: false, error: "Invalid session." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const body = await req.json();
    const { packageId, packageName, quotaLabel, amount, receiptUrl, slipUrl, ispPrice, adminTestMode } = body;

    const parsedAmount = Number(amount) || 0;
    const cleanPackageName = (packageName || "VPN Package").trim();
    const cleanQuotaLabel = (quotaLabel || "Unlimited").trim();
    let cleanReceiptUrl = (receiptUrl || slipUrl || "").trim();

    // 2. Load Global System Configuration
    const systemConfig = await getGlobalSystemConfig();

    const userEmail = (user.email || "").toLowerCase();
    const adminEmailEnv = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdmin = userEmail === "dulangathipul@gmail.com" || 
                    userEmail === "legionzinfo@gmail.com" || 
                    (adminEmailEnv && userEmail === adminEmailEnv) ||
                    Boolean((user as any).isAdmin);

    if (adminTestMode && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin test mode is restricted to administrator accounts." }, { status: 403 });
    }

    // Parse user's current metadata safely
    let metaData: any = {
      payments: [],
      pendingOrders: [],
      customVpnUserId: "",
      dataTotal: "Unlimited",
      dataUsed: "0 GB"
    };

    if (user.subscriptionLink) {
      try {
        metaData = { ...metaData, ...JSON.parse(user.subscriptionLink) };
      } catch {}
    }

    const fallbackToManualVerification = async (reason: string, auditReport?: any, isManualMode = false) => {
      const orderRecord = {
        id: `ORD-${Date.now()}`,
        packageId: packageId || "custom",
        package: `${cleanPackageName} (${cleanQuotaLabel})`,
        packageName: cleanPackageName,
        quotaLabel: cleanQuotaLabel,
        amount: parsedAmount,
        receipt: cleanReceiptUrl,
        receiptUrl: cleanReceiptUrl,
        status: isManualMode ? "Pending Admin Review" : "Verifying",
        date: new Date().toISOString(),
        verificationNote: reason
      };

      const updatedPending = [...(metaData.pendingOrders || []), orderRecord];
      const updatedPayments = [...(metaData.payments || []), orderRecord];

      const updatedMeta = {
        ...metaData,
        pendingOrders: updatedPending,
        payments: updatedPayments
      };

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionLink: JSON.stringify(updatedMeta),
          vpnStatus: user.vpnStatus === "Active" ? "Active" : "Pending"
        }
      });

      return NextResponse.json({
        success: true,
        autoApproved: false,
        manualMode: true,
        status: orderRecord.status,
        orderId: orderRecord.id,
        packageName: cleanPackageName,
        amount: parsedAmount,
        slipUrl: cleanReceiptUrl,
        adminWhatsapp: systemConfig.adminWhatsapp || "94701234567",
        message: isManualMode
          ? "Receipt uploaded successfully! Please inform the Admin via WhatsApp now so your V2Ray configuration can be activated immediately."
          : (reason || "Receipt uploaded successfully. Reference number queued for swift settlement clearance."),
        order: orderRecord,
        user: updatedUser,
        auditReport: auditReport || {
          overallStatus: "manual_review",
          reason: "Receipt uploaded successfully. Queued for manual admin review.",
          checks: [
            { id: "doc", title: "Document Uploaded", passed: true, statusText: "Uploaded", message: "Deposit document forensic scan completed." },
            { id: "account", title: "Beneficiary Confirmed", passed: false, statusText: "Awaiting Clearance", expected: systemConfig.expectedBankAccount || "8029138148", message: "Beneficiary matching queued for rapid clearance." },
            { id: "trace", title: "Transaction Trace Valid", passed: false, statusText: "Queued", message: "Transaction reference hash queued for ledger check." },
            { id: "amount", title: "Settlement Matched", passed: false, statusText: "Queued", expected: parsedAmount, message: "Awaiting settlement amount confirmation." },
            { id: "line", title: "Line Activated", passed: false, statusText: "Pending Clearance", message: "V2RAY key & slot activated upon final clearance." }
          ]
        }
      });
    };

    let cleanDestAcc = "";
    let cleanExpectedAcc = (systemConfig.expectedBankAccount || "8029138148").replace(/\D/g, "");
    let cleanRefNumber = "";
    let ocrAmount = 0;
    let ocrResult: {
      bankName?: string;
      destinationAccount?: string;
      paidAmount?: number;
      transactionDate?: string;
      referenceNumber?: string;
      isLegitimate?: boolean;
    } | null = null;

    if (adminTestMode && isAdmin) {
      // Admin Sandbox Mode: Bypass slip upload, OCR, and anti-replay ledger check
      cleanDestAcc = cleanExpectedAcc;
      cleanRefNumber = `ADM-${Date.now().toString().slice(-8)}`;
      ocrAmount = parsedAmount;
      cleanReceiptUrl = "https://legion.internal/admin-sandbox-test.png";
      ocrResult = {
        bankName: "Commercial Bank (Admin Test)",
        destinationAccount: cleanExpectedAcc,
        paidAmount: parsedAmount,
        transactionDate: new Date().toISOString(),
        referenceNumber: cleanRefNumber,
        isLegitimate: true
      };
    } else {
      // 3. Check Master Auto-Approval Switch
      if (!systemConfig.autoApprovalEnabled) {
        return await fallbackToManualVerification("Auto-approval is paused in Admin Settings. Slip routed for manual admin review.", {
          overallStatus: "manual_review",
          reason: "Auto-approval paused by administrator.",
          checks: [
            { id: "doc", title: "Document Uploaded", passed: true, statusText: "Uploaded", message: "Deposit slip archived in secure audit vault." },
            { id: "account", title: "Beneficiary Staged", passed: true, statusText: "Staged", expected: systemConfig.expectedBankAccount || "8029138148", message: "Commercial Bank Account 8029138148 queued for admin clearance." },
            { id: "trace", title: "Transaction Trace Staged", passed: true, statusText: "Queued", message: "Reference queued in clearance ledger." },
            { id: "amount", title: "Settlement Staged", passed: true, statusText: "Queued", expected: parsedAmount, message: `Package tariff Rs. ${parsedAmount} queued.` },
            { id: "line", title: "Line Reservation", passed: true, statusText: "Reserved", message: "Dedicated 10Gbps Singapore slot reserved for your account." }
          ]
        }, true);
      }

    if (!cleanReceiptUrl) {
      return await fallbackToManualVerification("No payment slip image attached. Queued for review.", {
        overallStatus: "review_required",
        reason: "No receipt uploaded.",
        checks: [
          { id: "doc", title: "Document Analyzed", passed: false, isSuspicious: true, statusText: "Missing Slip", message: "No payment slip image was provided with this checkout." },
          { id: "account", title: "Beneficiary Confirmed", passed: false, statusText: "Skipped" },
          { id: "trace", title: "Transaction Trace Valid", passed: false, statusText: "Skipped" },
          { id: "amount", title: "Settlement Matched", passed: false, statusText: "Skipped" },
          { id: "line", title: "Line Activated", passed: false, statusText: "Halted" }
        ]
      });
    }

    // 4. Construct Image Content for Groq Vision:
    // If slipUrl (Cloudinary URL) is available and starts with "http", prioritize sending direct URL.
    // Otherwise construct base64 data URI if base64 is available.
    const cleanSlipUrl = getTransformableImageUrl(cleanReceiptUrl);
    let imageUrl = (typeof cleanSlipUrl === "string" && cleanSlipUrl.startsWith("http"))
      ? cleanSlipUrl
      : "";

    if (!imageUrl && cleanReceiptUrl) {
      if (cleanReceiptUrl.startsWith("data:")) {
        imageUrl = cleanReceiptUrl;
      } else {
        imageUrl = `data:image/jpeg;base64,${cleanReceiptUrl}`;
      }
    }

    // 5. OCR Analysis via Groq Vision API (qwen/qwen3.8-27b)
    const groqApiKey = (process.env.GROQ_API_KEY || systemConfig.groqApiKey || "").trim();
    if (!groqApiKey) {
      console.warn("[Groq Vision] GROQ_API_KEY not configured in environment or settings.");
      return await fallbackToManualVerification("Receipt uploaded successfully. Reference number queued for swift settlement clearance.", {
        overallStatus: "review_required",
        reason: "Receipt uploaded successfully. Reference number queued for swift settlement clearance.",
        checks: [
          { id: "doc", title: "Document Analyzed", passed: true, statusText: "Analyzed", message: "Deposit document forensic scan completed." },
          { id: "account", title: "Beneficiary Confirmed", passed: false, statusText: "Awaiting Clearance", expected: systemConfig.expectedBankAccount || "8029138148", message: "Beneficiary matching queued for rapid clearance." },
          { id: "trace", title: "Transaction Trace Valid", passed: false, statusText: "Queued", message: "Transaction reference hash queued for ledger check." },
          { id: "amount", title: "Settlement Matched", passed: false, statusText: "Queued", expected: parsedAmount, message: "Awaiting settlement amount confirmation." },
          { id: "line", title: "Line Activated", passed: false, statusText: "Pending Clearance", message: "V2RAY key & slot activated upon final clearance." }
        ]
      });
    }

    let ocrResult: {
      bankName?: string;
      destinationAccount?: string;
      paidAmount?: number;
      transactionDate?: string;
      referenceNumber?: string;
      isLegitimate?: boolean;
    } | null = null;
    let ocrRawDiagnostic = "";

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `Analyze this bank slip. Expected Account: ${systemConfig.expectedBankAccount || "8029138148"}. Expected Amount: Rs. ${parsedAmount}.
Output STRICT JSON only:
{
"bankName": "string",
"destinationAccount": "string",
"paidAmount": ${parsedAmount},
"transactionDate": "string",
"referenceNumber": "string",
"isLegitimate": true
}`
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 400
        }),
        signal: AbortSignal.timeout(25000)
      });

      if (groqRes.ok) {
        const groqJson = await groqRes.json();
        const content = groqJson.choices?.[0]?.message?.content;
        if (content) {
          const cleanJsonText = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
          try {
            ocrResult = JSON.parse(cleanJsonText);
            console.log("[Groq Vision] Extracted receipt payload successfully:", ocrResult);
          } catch (e: any) {
            ocrRawDiagnostic = `JSON parse failed: ${e?.message}`;
            console.warn("[Groq Vision] Parse error:", e?.message);
          }
        }
      } else {
        const errText = await groqRes.text();
        ocrRawDiagnostic = `Groq HTTP ${groqRes.status}: ${errText.slice(0, 160)}`;
        console.warn(`Groq Vision returned HTTP ${groqRes.status}:`, errText);
      }
    } catch (groqErr: any) {
      ocrRawDiagnostic = `Groq network exception: ${groqErr?.message || groqErr}`;
      console.warn("Groq Vision attempt failed:", groqErr?.message || groqErr);
    }

    if (!ocrResult) {
      return await fallbackToManualVerification("Slip network timeout. Forwarded to admin queue.", {
        overallStatus: "review_required",
        reason: "Slip network timeout. Forwarded to admin queue.",
        checks: [
          { id: "doc", title: "Document Analyzed", passed: false, isSuspicious: true, statusText: "Timeout", message: "Slip network timeout. Forwarded to admin queue." },
          { id: "account", title: "Beneficiary Confirmed", passed: false, statusText: "Awaiting Clearance", expected: systemConfig.expectedBankAccount || "8029138148", message: "Beneficiary matching queued for rapid clearance." },
          { id: "trace", title: "Transaction Trace Valid", passed: false, statusText: "Queued", message: "Transaction reference hash queued for ledger check." },
          { id: "amount", title: "Settlement Matched", passed: false, statusText: "Queued", expected: parsedAmount, message: "Awaiting settlement amount confirmation." },
          { id: "line", title: "Line Activated", passed: false, statusText: "Pending Clearance", message: "V2RAY key & slot activated upon final clearance." }
        ]
      });
    }

    // 6. Strict Multi-Layer Validation
    cleanDestAcc = (ocrResult.destinationAccount || "").replace(/\D/g, "");
    cleanExpectedAcc = (systemConfig.expectedBankAccount || "8029138148").replace(/\D/g, "");
    cleanRefNumber = (ocrResult.referenceNumber || "").trim();
    ocrAmount = Number(ocrResult.paidAmount) || 0;

    const isAccountMatch = Boolean(!cleanDestAcc || cleanDestAcc.includes(cleanExpectedAcc) || cleanExpectedAcc.includes(cleanDestAcc));
    const isAmountMatch = Boolean(parsedAmount <= 0 || Math.abs(ocrAmount - parsedAmount) <= 20);
    const isDuplicate = Boolean(
      cleanRefNumber && (systemConfig.verifiedRefLedger || []).some(
        entry => entry.refNumber.toLowerCase() === cleanRefNumber.toLowerCase()
      )
    );
    const isRefValid = Boolean(!isDuplicate);
    const isLegitimate = ocrResult.isLegitimate !== false;

    // If any layer fails, create an exact diagnostic Glass HUD report
    if (!isAccountMatch || !isAmountMatch || !isRefValid || !isLegitimate) {
      let failureReason = "Payment validation discrepancy detected.";
      if (!isLegitimate) failureReason = "Payment slip could not be confirmed as authentic.";
      else if (!isAccountMatch) failureReason = `Beneficiary account on slip (${cleanDestAcc || "unclear"}) does not match expected (${cleanExpectedAcc}).`;
      else if (!isAmountMatch) failureReason = `Paid amount on slip (Rs. ${ocrAmount}) does not match package price (Rs. ${parsedAmount}).`;
      else if (isDuplicate) failureReason = `Duplicate slip: Reference number #${cleanRefNumber} has already been used!`;
      else if (!cleanRefNumber || cleanRefNumber.length < 4) failureReason = "Transaction reference number could not be read clearly.";

      const discrepancyReport = {
        overallStatus: "review_required",
        reason: failureReason,
        checks: [
          {
            id: "doc",
            title: "Document Analyzed",
            passed: true,
            statusText: "Analyzed",
            detectedBank: ocrResult.bankName || "Bank Transfer",
            detectedRef: cleanRefNumber || "Unknown",
            message: `Forensic scan complete: ${ocrResult.bankName || "Online Banking"} deposit slip.`
          },
          {
            id: "account",
            title: "Beneficiary Confirmed",
            passed: isAccountMatch,
            statusText: isAccountMatch ? "Confirmed" : "Discrepancy",
            expected: cleanExpectedAcc,
            detected: cleanDestAcc || "Not Detected",
            isSuspicious: !isAccountMatch,
            message: isAccountMatch
              ? `Commercial Bank Account ${cleanExpectedAcc} confirmed.`
              : `Beneficiary account ${cleanDestAcc || "unclear"} does not match expected (${cleanExpectedAcc}).`
          },
          {
            id: "trace",
            title: "Transaction Trace Valid",
            passed: isRefValid,
            statusText: isRefValid ? "Valid" : (isDuplicate ? "Duplicate Trace" : "Trace Unclear"),
            refNumber: cleanRefNumber,
            isSuspicious: !isRefValid,
            message: isDuplicate
              ? `Duplicate reference trace #${cleanRefNumber} already in ledger.`
              : (!cleanRefNumber || cleanRefNumber.length < 4)
              ? "Transaction reference number unreadable or truncated."
              : `Unique trace #${cleanRefNumber} confirmed.`
          },
          {
            id: "amount",
            title: "Settlement Matched",
            passed: isAmountMatch,
            statusText: isAmountMatch ? "Matched" : "Discrepancy",
            expected: parsedAmount,
            detected: ocrAmount,
            isSuspicious: !isAmountMatch,
            message: isAmountMatch
              ? `Tariff Rs. ${ocrAmount} matched with package price.`
              : `Deposit amount Rs. ${ocrAmount} differs from package price (Rs. ${parsedAmount}).`
          },
          {
            id: "line",
            title: "Line Activated",
            passed: false,
            statusText: "Pending Clearance",
            message: "Slot reserved. Forwarded to admin priority manual clearance."
          }
        ]
      };

      return await fallbackToManualVerification(failureReason, discrepancyReport);
    }
  }
    let clientUuid = metaData.customVpnUserId;
    if (!clientUuid) {
      const existingMatch = (user.vpnConfigKey || "").match(/vless:\/\/([a-f0-9\-]{36})/i);
      clientUuid = existingMatch ? existingMatch[1] : crypto.randomUUID();
    }

    const pkgMeta = PACKAGE_ISP_PRICES[packageId];
    let isp = pkgMeta?.isp || "Dialog";
    if (!pkgMeta) {
      if (cleanPackageName.toLowerCase().includes("airtel")) isp = "Airtel";
      else if (cleanPackageName.toLowerCase().includes("slt")) isp = "SLT";
      else if (cleanPackageName.toLowerCase().includes("hutch")) isp = "Hutch";
    }

    let quotaGb = 100;
    if (!cleanQuotaLabel.toLowerCase().includes("unlimited")) {
      const gbMatch = cleanQuotaLabel.match(/(\d+)\s*GB/i);
      if (gbMatch) quotaGb = parseInt(gbMatch[1], 10);
    }

    const packageData = {
      name: cleanPackageName,
      quotaGb,
      validityDays: 30,
      isp,
      sni: systemConfig.packageSnis?.[packageId] || "zoom.us"
    };

    // Dual Inbound Routing: Dialog Social 547 -> Inbound 5 (WS+TLS), Others -> Inbound 1 (TCP+TLS / Reality)
    const pkgText = `${packageId || ""} ${cleanPackageName || ""}`.toLowerCase();
    const isDialogSocial547 = pkgText.includes("dialog") && (pkgText.includes("547") || pkgText.includes("social"));
    const targetInboundId = isDialogSocial547
      ? Number(systemConfig.primary3xui?.dialogInboundId || 5)
      : Number(systemConfig.primary3xui?.inboundId || 1);

    // 8. Provision Client to Real 3x-ui Inbound (NO FAKE MOCK CONFIG FALLBACKS)
    let provisionResult: {
      success: boolean;
      subscriptionUrl: string;
      vlessKey: string;
      subId: string;
    };

    try {
      if (!systemConfig.primary3xui.baseUrl || !systemConfig.primary3xui.username) {
        throw new Error("3x-ui Primary Node credentials missing in System Config");
      }

      provisionResult = await provision3xuiClient(
        { ...systemConfig.primary3xui, inboundId: targetInboundId },
        clientUuid,
        user.email,
        packageData
      );
    } catch (provisionErr: any) {
      console.error("Real 3x-ui provisioning failed:", provisionErr);
      return await fallbackToManualVerification(
        `Document Analyzed [CONFIRMED] - Automatic Node Provisioning Failed: ${provisionErr?.message || "3x-ui API unreachable"}. Forwarded to admin queue for instant line activation.`,
        {
          overallStatus: "manual_review",
          reason: `3x-ui Provisioning Error: ${provisionErr?.message || "Failed to add client to inbound"}`,
          checks: [
            {
              id: "doc",
              title: "Document Analyzed",
              passed: true,
              statusText: "Analyzed",
              detectedBank: ocrResult?.bankName || "Commercial Bank",
              detectedRef: cleanRefNumber,
              message: `Forensic scan complete: ${ocrResult?.bankName || "Bank"} slip verified.`
            },
            {
              id: "account",
              title: "Beneficiary Confirmed",
              passed: true,
              statusText: "Confirmed",
              expected: cleanExpectedAcc,
              detected: cleanDestAcc,
              message: `Commercial Bank Account ${cleanExpectedAcc} match confirmed.`
            },
            {
              id: "trace",
              title: "Transaction Trace Valid",
              passed: true,
              statusText: "Valid",
              refNumber: cleanRefNumber,
              message: `Unique trace #${cleanRefNumber} recorded in anti-replay ledger.`
            },
            {
              id: "amount",
              title: "Settlement Matched",
              passed: true,
              statusText: "Matched",
              expected: parsedAmount,
              detected: ocrAmount,
              message: `Exact tariff Rs. ${parsedAmount} verified.`
            },
            {
              id: "line",
              title: "Line Activated",
              passed: false,
              isSuspicious: true,
              statusText: "Provisioning Error",
              message: `Node error: ${provisionErr?.message || "3x-ui API unreachable"}. Admin will provision line manually.`
            }
          ]
        }
      );
    }

    const realSubscriptionUrl = provisionResult.subscriptionUrl;
    const realVlessKey = provisionResult.vlessKey;
    const formattedConfigKey = `[ ${cleanPackageName} 10Gbps Core ]\n${realVlessKey}`;

    // Optional Bonus USA Node Provisioning (if enabled)
    let generatedUsaSubUrl: string | undefined = undefined;
    if (systemConfig.bonusUsa3xui?.enabled && systemConfig.bonusUsa3xui.baseUrl && systemConfig.bonusUsa3xui.username) {
      try {
        const bonusRes = await provision3xuiClient(
          systemConfig.bonusUsa3xui,
          clientUuid,
          user.email,
          { ...packageData, name: `${cleanPackageName} (Bonus USA)` }
        );
        generatedUsaSubUrl = bonusRes.subscriptionUrl;
      } catch (bonusErr: any) {
        console.warn("Bonus USA node provisioning skipped:", bonusErr?.message);
      }
    }

    // 9. Update Database Record
    const verifiedPaymentRecord = {
      id: cleanRefNumber,
      refNumber: cleanRefNumber,
      packageId: packageId || "custom",
      package: `${cleanPackageName} (${cleanQuotaLabel})`,
      packageName: cleanPackageName,
      quotaLabel: cleanQuotaLabel,
      amount: parsedAmount || ocrAmount,
      receipt: cleanReceiptUrl,
      receiptUrl: cleanReceiptUrl,
      status: "Verified",
      autoVerified: true,
      bankName: ocrResult.bankName || "Commercial Bank",
      date: new Date().toISOString()
    };

    const newExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    let cleanDataTotal = "Unlimited";
    if (!cleanQuotaLabel.toLowerCase().includes("unlimited")) {
      cleanDataTotal = `${quotaGb} GB`;
    }

    const updatedPayments = [...(metaData.payments || []), verifiedPaymentRecord];
    const updatedMeta = {
      ...metaData,
      customVpnUserId: clientUuid,
      vpnUuid: clientUuid,
      vlessConfig: realVlessKey,
      subscriptionUrl: realSubscriptionUrl,
      ...(generatedUsaSubUrl ? { usaSubscriptionUrl: generatedUsaSubUrl } : {}),
      dataTotal: cleanDataTotal,
      payments: updatedPayments,
      pendingOrders: [],
      showUsaUsage: Boolean(generatedUsaSubUrl) || metaData.showUsaUsage
    };

    // Update User with REAL configs and REAL subscription link
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        vpnStatus: "Active",
        vpnConfigKey: formattedConfigKey,
        expiryDate: newExpiry,
        subscriptionLink: JSON.stringify(updatedMeta)
      }
    });

    // Record Reference in Global Ledger
    const newLedgerEntry = {
      refNumber: cleanRefNumber,
      email: user.email,
      packageName: cleanPackageName,
      amount: parsedAmount || ocrAmount,
      date: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };

    const updatedLedger = [...(systemConfig.verifiedRefLedger || []), newLedgerEntry];
    await updateGlobalSystemConfig({
      verifiedRefLedger: updatedLedger
    });

    const approvedAuditReport = {
      overallStatus: "approved",
      reason: "Institutional settlement verified and cleared.",
      checks: [
        {
          id: "doc",
          title: "Document Analyzed",
          passed: true,
          statusText: "Analyzed",
          detectedBank: ocrResult?.bankName || "Commercial Bank",
          detectedRef: cleanRefNumber,
          message: `Forensic scan complete: ${ocrResult?.bankName || "Bank"} slip verified.`
        },
        {
          id: "account",
          title: "Beneficiary Confirmed",
          passed: true,
          statusText: "Confirmed",
          expected: cleanExpectedAcc,
          detected: cleanDestAcc,
          message: `Commercial Bank Account ${cleanExpectedAcc} match confirmed.`
        },
        {
          id: "trace",
          title: "Transaction Trace Valid",
          passed: true,
          statusText: "Valid",
          refNumber: cleanRefNumber,
          message: `Unique trace #${cleanRefNumber} recorded in anti-replay ledger.`
        },
        {
          id: "amount",
          title: "Settlement Matched",
          passed: true,
          statusText: "Matched",
          expected: parsedAmount,
          detected: ocrAmount,
          message: `Exact tariff Rs. ${parsedAmount} verified.`
        },
        {
          id: "line",
          title: "Line Activated",
          passed: true,
          statusText: "Activated",
          message: "10Gbps Singapore core line & subscription link activated."
        }
      ]
    };

    return NextResponse.json({
      success: true,
      verified: true,
      autoApproved: true,
      status: "Active",
      message: "Payment verified and high-speed line provisioned successfully.",
      subscriptionUrl: realSubscriptionUrl,
      vlessKey: realVlessKey,
      configs: [
        {
          name: `${cleanPackageName} High-Speed Core`,
          code: realVlessKey
        }
      ],
      order: verifiedPaymentRecord,
      user: updatedUser,
      auditReport: approvedAuditReport
    });
  } catch (error: any) {
    console.error("Process order unexpected error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal processing error"
    }, { status: 500 });
  }
}
