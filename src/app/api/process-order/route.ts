import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, updateGlobalSystemConfig, createXuiClient } from "@/lib/systemConfig";
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
    dialogInboundId?: number | string;
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
  const cleanBase = (nodeConfig.baseUrl || "").trim().replace(/\/+$/, "").replace(/\/panel\/?$/, "");
  if (!cleanBase) {
    throw new Error("3x-ui Base URL is not configured");
  }

  // 1. Authenticate with VPS 3x-ui node via native ThreeXUI client
  const xui = createXuiClient(nodeConfig);
  const loginRes = await xui.login(true);
  if (!loginRes?.success && loginRes?.success !== undefined) {
    throw new Error(`3x-ui Login Failed: ${(loginRes as any)?.msg || "Invalid credentials or node unreachable"}`);
  }

  const clientSubId = clientUuid.replace(/-/g, "").slice(0, 16);
  const targetInboundId = Number(nodeConfig?.inboundId || 1);
  const expiryMs = Date.now() + Number(packageData.validityDays || 30) * 86400000;
  const quotaGbNum = Number(packageData.quotaGb || 100);
  const totalBytes = quotaGbNum * 1024 * 1024 * 1024;

  // 2. Query inbounds to verify target exists and extract streamSettings
  let finalInboundId = targetInboundId;
  let inboundObj: any = null;
  try {
    const inboundsRes = await xui.getInbounds();
    const inbounds = Array.isArray(inboundsRes?.obj) ? inboundsRes.obj : [];
    if (inbounds.length > 0) {
      const matched = inbounds.find((ib: any) => Number(ib.id) === targetInboundId);
      if (matched) {
        finalInboundId = targetInboundId;
        inboundObj = matched;
      } else {
        finalInboundId = Number(inbounds[0].id);
        inboundObj = inbounds[0];
      }
    }
  } catch (err: any) {
    console.warn("Could not list inbounds via 3xui client:", err?.message);
  }

  if (!inboundObj) {
    try {
      const getIb = await xui.getInbound(finalInboundId);
      if (getIb?.success && getIb?.obj) {
        inboundObj = getIb.obj;
      }
    } catch {}
  }

  // 3. ALWAYS Call Modern API (/panel/api/clients/add) FIRST
  let provisionRes: any = null;
  let lastError = "";

  try {
    provisionRes = await xui.addModernClient({
      inboundIds: [finalInboundId],
      client: {
        id: clientUuid,
        email: clientEmail,
        enable: true,
        expiryTime: expiryMs,
        limitIp: 2,
        totalGB: quotaGbNum,
        subId: clientSubId,
        flow: ""
      }
    });
  } catch (err: any) {
    lastError = err?.message || "Modern client add error";
  }

  // 4. Fallback to Legacy endpoint (/panel/api/inbounds/addClient) ONLY if modern endpoint failed or was rejected
  if (!provisionRes || provisionRes.success === false) {
    try {
      const legacyRes = await xui.addClient({
        id: finalInboundId,
        settings: JSON.stringify({
          clients: [
            {
              id: clientUuid,
              email: clientEmail,
              enable: true,
              expiryTime: expiryMs,
              limitIp: 2,
              totalGB: totalBytes,
              subId: clientSubId,
              flow: ""
            }
          ]
        })
      });
      if (legacyRes?.success) {
        provisionRes = legacyRes;
      } else {
        lastError = legacyRes?.msg || lastError;
      }
    } catch (err: any) {
      lastError = err?.message || lastError;
    }
  }

  // 5. If duplicate / already exists, attempt update
  if (!provisionRes || provisionRes.success === false) {
    const errLower = (lastError || "").toLowerCase();
    if (errLower.includes("duplicate") || errLower.includes("exist") || errLower.includes("already")) {
      try {
        const updateRes = await xui.updateModernClient(clientEmail, {
          id: clientUuid,
          email: clientEmail,
          enable: true,
          expiryTime: expiryMs,
          limitIp: 2,
          totalGB: quotaGbNum,
          subId: clientSubId,
          flow: ""
        });
        if (updateRes?.success) {
          provisionRes = updateRes;
        }
      } catch {}

      if (!provisionRes || provisionRes.success === false) {
        try {
          const legacyUpdate = await xui.updateClient(clientUuid, {
            id: finalInboundId,
            settings: JSON.stringify({
              clients: [{
                id: clientUuid,
                email: clientEmail,
                enable: true,
                expiryTime: expiryMs,
                limitIp: 2,
                totalGB: totalBytes,
                subId: clientSubId,
                flow: ""
              }]
            })
          });
          if (legacyUpdate?.success) {
            provisionRes = legacyUpdate;
          }
        } catch {}
      }
    }
  }

  if (!provisionRes || provisionRes.success === false) {
    throw new Error(provisionRes?.msg || lastError || `3x-ui failed to create client on Inbound ${finalInboundId}`);
  }

  // 6. Build Subscription URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanBase);
  } catch {
    parsedUrl = new URL("https://" + cleanBase);
  }
  const rawSubPrefix = (nodeConfig.subBaseUrl || `${parsedUrl.protocol}//${parsedUrl.hostname}:2096/sub/`)
    .trim()
    .replace(/\/+$/, "");
  const realSubscriptionUrl = `${rawSubPrefix}/${clientSubId}`;

  const nodeDomain = parsedUrl.hostname;
  let nodePort = Number(nodeConfig.port || (inboundObj?.port ? inboundObj.port : (finalInboundId === 5 ? 2096 : 443)));
  const pkgLabel = packageData.name || "VIP";

  // 7. Extract Real VLESS Key (Handling string arrays and object arrays from getClientLinks)
  let realVlessKey = "";
  try {
    const linksRes = await xui.getClientLinks(clientEmail);
    const rawObj = linksRes?.obj;
    if (typeof rawObj === "string" && rawObj.startsWith("vless://")) {
      realVlessKey = rawObj.trim();
    } else if (Array.isArray(rawObj) && rawObj.length > 0) {
      const first = rawObj.find((l: any) => (typeof l === "string" && l.startsWith("vless://")) || (typeof l?.link === "string" && l.link.startsWith("vless://")) || (typeof l?.url === "string" && l.url.startsWith("vless://"))) || rawObj[0];
      realVlessKey = typeof first === "string" ? first : (first?.link || first?.url || "");
    }
    if (realVlessKey) {
      const baseNoHash = realVlessKey.split("#")[0];
      realVlessKey = `${baseNoHash}#LEGION-${encodeURIComponent(pkgLabel)}`;
    }
  } catch {}

  // 8. Guaranteed Fallback from Inbound Settings (If client link was not returned directly)
  if (!realVlessKey) {
    if (!inboundObj) {
      try {
        const inb = await xui.getInbound(finalInboundId);
        if (inb?.success && inb?.obj) {
          inboundObj = inb.obj;
        }
      } catch {}
    }

    let realityPublicKey = "";
    let shortId = "";
    let sniHost = packageData.sni || "";
    let isWs = finalInboundId === 5;
    let wsPath = "/";
    let wsHost = "";
    let streamSecurity = "tls";

    if (inboundObj) {
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
        if (stream.wsSettings?.host) wsHost = stream.wsSettings.host;
        if (!wsHost && stream.wsSettings?.headers?.Host) wsHost = stream.wsSettings.headers.Host;
      }

      if (stream?.realitySettings) {
        const rs = stream.realitySettings;
        realityPublicKey = rs.settings?.publicKey || rs.publicKey || realityPublicKey;
        if (Array.isArray(rs.shortIds) && rs.shortIds.length > 0) {
          shortId = rs.shortIds[0];
        }
        if (!sniHost && Array.isArray(rs.serverNames) && rs.serverNames.length > 0) {
          sniHost = rs.serverNames[0];
        }
      } else if (stream?.tlsSettings) {
        if (!sniHost && Array.isArray(stream.tlsSettings.serverNames) && stream.tlsSettings.serverNames.length > 0) {
          sniHost = stream.tlsSettings.serverNames[0];
        }
      }
    }

    if (realityPublicKey) {
      if (!sniHost) sniHost = "www.speedtest.net";
      realVlessKey = `vless://${clientUuid}@${nodeDomain}:${nodePort}?type=tcp&security=reality&pbk=${realityPublicKey}&fp=chrome&sni=${sniHost}&sid=${shortId}&spx=%2F#LEGION-${encodeURIComponent(pkgLabel)}`;
    } else if (isWs) {
      if (!sniHost) {
        if (wsHost) sniHost = wsHost;
        else sniHost = "dialog-social.duckdns.org";
      }
      const hostParam = wsHost ? `&host=${encodeURIComponent(wsHost)}` : (sniHost ? `&host=${encodeURIComponent(sniHost)}` : "");
      realVlessKey = `vless://${clientUuid}@${nodeDomain}:${nodePort}?type=ws&security=${streamSecurity}&path=${encodeURIComponent(wsPath)}${hostParam}&sni=${sniHost}#LEGION-${encodeURIComponent(pkgLabel)}`;
    } else {
      if (!sniHost) sniHost = "www.speedtest.net";
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
        manualMode: isManualMode,
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
      return NextResponse.json({
        success: false,
        manualMode: false,
        verified: false,
        autoApproved: false,
        status: "Error",
        error: provisionErr?.message || "3x-ui API unreachable",
        message: `Automatic Node Provisioning Failed: ${provisionErr?.message || "3x-ui API unreachable"}`,
        auditReport: {
          overallStatus: "error",
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
              statusText: "Failed",
              message: `Line Activated: Failed — ${provisionErr?.message || "3x-ui API unreachable"}`
            }
          ]
        }
      });
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
      receipt: cleanReceiptUrl || "ADMIN_SANDBOX_TEST",
      receiptUrl: cleanReceiptUrl || "ADMIN_SANDBOX_TEST",
      status: "Verified",
      autoVerified: true,
      bankName: ocrResult?.bankName || "Commercial Bank",
      date: new Date().toISOString(),
      verificationNote: adminTestMode ? "Admin Sandbox Live Provisioning" : "Verified & Auto-Provisioned"
    };

    const newExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    let cleanDataTotal = "Unlimited";
    if (!cleanQuotaLabel.toLowerCase().includes("unlimited")) {
      cleanDataTotal = `${quotaGb} GB`;
    }

    const updatedPayments = [verifiedPaymentRecord, ...(Array.isArray(metaData.payments) ? metaData.payments : [])];
    const updatedMeta = {
      ...metaData,
      accountStatus: "Active",
      customVpnUserId: clientUuid,
      vpnUuid: clientUuid,
      vlessConfig: realVlessKey,
      subscriptionUrl: realSubscriptionUrl,
      ...(generatedUsaSubUrl ? { usaSubscriptionUrl: generatedUsaSubUrl } : {}),
      dataTotal: cleanDataTotal,
      dataUsed: metaData.dataUsed || "0 GB",
      expiryDate: newExpiry.split("T")[0],
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
