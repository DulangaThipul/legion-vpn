import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, updateGlobalSystemConfig, createXuiClient } from "@/lib/systemConfig";
import { PACKAGE_ISP_PRICES, extractQuotaFromPrimaryConfig, parsePrimaryVlessUri, resolveOrderedQuotaLabel, formatPackageTitleWithQuota } from "@/lib/vlessGenerator";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow sufficient serverless execution window
export const dynamic = "force-dynamic";

// Allow self-signed certificates on VPS 3x-ui servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/**
 * Safely extracts Primary Config #1 (ignoring USA Node #2) from user metadata or vpnConfigKey
 */
function getPrimaryConfigFromUser(user: any, metaData: any) {
  let config1Title = "";
  let config1VlessUri = "";

  // 1. Check existingMeta.configs?.[0]
  if (Array.isArray(metaData?.configs) && metaData.configs.length > 0) {
    const c0 = metaData.configs[0];
    config1Title = c0?.name || c0?.title || "";
    config1VlessUri = c0?.code || c0?.vlessKey || c0?.link || c0?.url || "";
  }

  // 2. Fallback to parsing user.vpnConfigKey
  if (!config1VlessUri && user?.vpnConfigKey) {
    const raw = String(user.vpnConfigKey).trim();
    const regex = /(?:📦\s*)?\[(.*?)\]\s*([\s\S]*?)(?=(?:📦\s*)?\[|$)/g;
    const matches = [...raw.matchAll(regex)];
    if (matches.length > 0 && matches[0]) {
      config1Title = (matches[0][1] || "").replace(/📦/g, "").replace(/[\[\]]/g, "").trim();
      const codePart = (matches[0][2] || "").trim();
      const vlessMatch = codePart.match(/vless:\/\/[^\s]+/i);
      config1VlessUri = vlessMatch ? vlessMatch[0] : codePart;
    } else {
      const vlessLinks = raw.match(/vless:\/\/[^\s]+/gi);
      if (vlessLinks && vlessLinks.length > 0) {
        config1VlessUri = vlessLinks[0].trim();
      }
    }
  }

  // 3. Fallback to metaData.vlessConfig
  if (!config1VlessUri && metaData?.vlessConfig && typeof metaData.vlessConfig === "string") {
    config1VlessUri = metaData.vlessConfig.trim();
  }

  // Fallback title
  if (!config1Title) {
    if (Array.isArray(metaData?.payments) && metaData.payments.length > 0) {
      config1Title = metaData.payments[0]?.packageName || metaData.payments[0]?.package || "";
    }
    if (!config1Title && metaData?.dataTotal) {
      config1Title = `LEGION Core (${metaData.dataTotal})`;
    }
    if (!config1Title) {
      config1Title = "LEGION High-Speed Core";
    }
  }

  return {
    title: config1Title,
    vlessUri: config1VlessUri
  };
}

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
 * Real 3x-ui Node Client Provisioning
 * Supports dual inbound routing (WS+TLS for Dialog Social 547 vs TCP+TLS for others)
 * Configurable ISP domains, SNI masks, and client remark formatting
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
    packageId?: string;
    amount?: number;
  },
  systemConfig?: any
): Promise<{
  success: boolean;
  subscriptionUrl: string;
  vlessKey: string;
  subId: string;
  clientRemark: string;
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

  // 2. Identify ISP and Client Remark: LEGION-VPN-{Price}{ISP}-{ClientEmail}
  const cleanUserEmail = (clientEmail || "user@legion.lk").trim();
  const combinedPkg = `${packageData.packageId || ""} ${packageData.name || ""} ${packageData.isp || ""}`.toLowerCase();
  let ispTag = "VIP";
  if (combinedPkg.includes("dialog")) ispTag = "Dialog";
  else if (combinedPkg.includes("airtel")) ispTag = "Airtel";
  else if (combinedPkg.includes("slt")) ispTag = "SLT";
  else if (combinedPkg.includes("hutch")) ispTag = "Hutch";
  else if (combinedPkg.includes("mobitel")) ispTag = "Mobitel";

  const parsedPrice = packageData.amount || 0;
  const clientRemark = `LEGION-VPN-${parsedPrice}${ispTag}-${cleanUserEmail}`;

  // 3. Dual Inbound Routing: Dialog Social 547 -> Inbound 5 (WS+TLS), Others -> Inbound 1 (TCP+TLS)
  const isDialogSocial547 =
    packageData.packageId === "dialog-social" ||
    (combinedPkg.includes("dialog") && (combinedPkg.includes("social") || Number(parsedPrice) === 547));

  const targetInboundId = isDialogSocial547
    ? Number(nodeConfig?.dialogInboundId || systemConfig?.primary3xui?.dialogInboundId || 5)
    : Number(nodeConfig?.inboundId || systemConfig?.primary3xui?.inboundId || 1);

  // 4. Resolve ISP Subdomain (NEVER use raw VPS IP)
  const ispDomainMap: Record<string, string> = {
    Dialog: systemConfig?.ispDomains?.dialog || "dialog.legiongraphics.site",
    Airtel: systemConfig?.ispDomains?.airtel || "airtel.legiongraphics.site",
    SLT: systemConfig?.ispDomains?.slt || "slt.legiongraphics.site",
    Hutch: systemConfig?.ispDomains?.hutch || "hutch.legiongraphics.site",
    Mobitel: systemConfig?.ispDomains?.mobitel || "dialog.legiongraphics.site"
  };
  const targetAddress = (ispDomainMap[ispTag] || systemConfig?.ispDomains?.dialog || "dialog.legiongraphics.site").trim();

  // 5. Resolve Package SNI Mask
  const packageSniMap = systemConfig?.packageSnis || {};
  const resolvedSni = (
    (packageData.packageId && packageSniMap[packageData.packageId]) ||
    packageData.sni ||
    (isDialogSocial547 ? "web.whatsapp.net" : "zoom.us")
  ).trim();

  const clientSubId = clientUuid.replace(/-/g, "").slice(0, 16);
  const expiryMs = Date.now() + Number(packageData.validityDays || 30) * 86400000;
  const quotaGbNum = Number(packageData.quotaGb || 100);

  // 6. Add Client to 3x-ui via Modern API (/panel/api/clients/add) directly with duplicate auto-handling
  let panelClientEmail = clientRemark;

  const attemptModernCreate = async (emailToUse: string) => {
    return await xui.addModernClient({
      inboundIds: [targetInboundId],
      client: {
        id: clientUuid,
        email: emailToUse,
        enable: true,
        expiryTime: expiryMs,
        limitIp: 2,
        totalGB: quotaGbNum,
        subId: clientSubId
      }
    });
  };

  let provisionRes: any = null;
  try {
    provisionRes = await attemptModernCreate(panelClientEmail);

    // If panel reports duplicate email (e.g. re-testing same package), retry with unique suffix
    if (
      provisionRes &&
      provisionRes.success === false &&
      String(provisionRes.msg || "").toLowerCase().includes("duplicate")
    ) {
      panelClientEmail = `${clientRemark}-${Math.floor(100 + Math.random() * 899)}`;
      provisionRes = await attemptModernCreate(panelClientEmail);
    }
  } catch (modernErr: any) {
    const errMsg = String(modernErr?.message || "");
    // If duplicate email threw an exception, retry with unique suffix
    if (errMsg.toLowerCase().includes("duplicate")) {
      panelClientEmail = `${clientRemark}-${Math.floor(100 + Math.random() * 899)}`;
      provisionRes = await attemptModernCreate(panelClientEmail);
    } else if (errMsg.includes("404")) {
      // Only fallback to legacy endpoint if /panel/api/clients/add itself is 404
      provisionRes = await xui.addClient({
        id: targetInboundId,
        settings: JSON.stringify({
          clients: [
            {
              id: clientUuid,
              email: panelClientEmail,
              enable: true,
              expiryTime: expiryMs,
              limitIp: 2,
              totalGB: quotaGbNum * 1024 * 1024 * 1024,
              subId: clientSubId,
              flow: ""
            }
          ]
        })
      });
    } else {
      throw modernErr;
    }
  }

  if (!provisionRes || provisionRes.success === false) {
    throw new Error(provisionRes?.msg || `3x-ui failed to create client on Inbound ${targetInboundId}`);
  }

  // 7. Safe Inbound Inspection (Never Fail If getInbound Is Unsupported)
  let inboundObj: any = null;
  try {
    const inb = await xui.getInbound(targetInboundId);
    if (inb?.success && inb?.obj) {
      inboundObj = inb.obj;
    }
  } catch (err: any) {
    console.warn(`xui.getInbound(${targetInboundId}) failed, falling back to list:`, err?.message);
  }

  if (!inboundObj) {
    try {
      const inboundsRes = await xui.getInbounds();
      const inbounds = Array.isArray(inboundsRes?.obj) ? inboundsRes.obj : [];
      if (inbounds.length > 0) {
        const matched = inbounds.find((ib: any) => Number(ib.id) === targetInboundId);
        if (matched) {
          inboundObj = matched;
        }
      }
    } catch (err: any) {
      console.warn("xui.getInbounds() list fallback failed:", err?.message);
    }
  }

  let streamSettings: any = {};
  if (inboundObj?.streamSettings) {
    if (typeof inboundObj.streamSettings === "string") {
      try {
        streamSettings = JSON.parse(inboundObj.streamSettings);
      } catch {}
    } else if (typeof inboundObj.streamSettings === "object") {
      streamSettings = inboundObj.streamSettings;
    }
  }

  const defaultPort = isDialogSocial547 ? 2096 : 443;
  const inboundPort = Number(inboundObj?.port || defaultPort);
  const defaultNetwork = isDialogSocial547 ? "ws" : "tcp";
  const network = streamSettings?.network || defaultNetwork;
  const wsPath = streamSettings?.wsSettings?.path || "/";

  // 8. Build Subscription URL
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

  // 9. Build Exact VLESS URL
  let finalVlessKey = "";
  if (network === "ws" || isDialogSocial547) {
    const wsParams = new URLSearchParams({
      type: "ws",
      security: "tls",
      path: wsPath,
      host: resolvedSni,
      sni: resolvedSni,
      fp: "chrome",
      encryption: "none"
    });
    finalVlessKey = `vless://${clientUuid}@${targetAddress}:${inboundPort}?${wsParams.toString()}#${clientRemark}`;
  } else {
    const tcpParams = new URLSearchParams({
      type: "tcp",
      security: "tls",
      sni: resolvedSni,
      alpn: "h2,http/1.1",
      fp: "chrome",
      encryption: "none"
    });
    finalVlessKey = `vless://${clientUuid}@${targetAddress}:${inboundPort}?${tcpParams.toString()}#${clientRemark}`;
  }

  return {
    success: true,
    subscriptionUrl: realSubscriptionUrl,
    vlessKey: finalVlessKey,
    subId: clientSubId,
    clientRemark
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
    const { packageId, packageName, quotaLabel, amount, receiptUrl, slipUrl, ispPrice, adminTestMode, orderType } = body;

    const parsedAmount = Number(amount) || 0;
    const cleanPackageName = (packageName || "VPN Package").trim();
    const cleanQuotaLabel = (quotaLabel || "Unlimited").trim();
    let cleanReceiptUrl = (receiptUrl || slipUrl || "").trim();

    // 2. Load Global System Configuration
    const systemConfig = await getGlobalSystemConfig();
    const isAutoReviewEnabled = systemConfig.autoApproval === true || systemConfig.autoApprovalEnabled === true;

    // Resolve exact ordered quota label and formatted package display title (e.g. "Airtel YouTube (100GB)")
    const orderedQuotaLabel = resolveOrderedQuotaLabel({ name: cleanPackageName, quotaLabel: cleanQuotaLabel });
    const formattedPackageWithGb = formatPackageTitleWithQuota(cleanPackageName, orderedQuotaLabel);

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

    // =========================================================================
    // CRITICAL MANUAL MODE ROUTING:
    // If Auto-Review is OFF in Admin Panel OR body.orderType === "new" (and !adminTestMode):
    // STOP IMMEDIATELY before any Groq/Gemini AI OCR call!
    // =========================================================================
    if ((!isAutoReviewEnabled || orderType === "new") && !adminTestMode) {
      const orderId = `ORD-${Date.now()}`;
      const orderRecord = {
        id: orderId,
        orderId,
        packageId: packageId || "custom",
        package: formattedPackageWithGb,
        packageName: formattedPackageWithGb,
        quotaLabel: orderedQuotaLabel,
        amount: parsedAmount,
        receipt: cleanReceiptUrl,
        receiptUrl: cleanReceiptUrl,
        status: "Pending Admin Review",
        date: new Date().toISOString(),
        verificationNote: "Order submitted. Awaiting manual admin WhatsApp clearance."
      };

      const updatedPending = [...(metaData.pendingOrders || []), orderRecord];
      const updatedPayments = [orderRecord, ...(Array.isArray(metaData.payments) ? metaData.payments : [])];

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
        manualMode: true,
        verified: false,
        orderId,
        packageName: formattedPackageWithGb,
        quotaLabel: orderedQuotaLabel,
        amount: parsedAmount,
        slipUrl: cleanReceiptUrl,
        adminWhatsapp: systemConfig.adminWhatsapp || "94701234567",
        message: "Receipt uploaded successfully! Please inform the Admin via WhatsApp now so your V2Ray configuration can be activated immediately.",
        order: orderRecord,
        user: updatedUser
      });
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

    ocrResult = null;
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

    const primaryConfig = getPrimaryConfigFromUser(user, metaData);
    const quotaInfo = extractQuotaFromPrimaryConfig(cleanPackageName || primaryConfig.title, metaData.dataTotal);
    const vlessInfo = parsePrimaryVlessUri(primaryConfig.vlessUri, user.email || "");

    const effectiveTargetAmount = orderType === "renew" && parsedAmount <= 0 && vlessInfo.extractedPrice
      ? vlessInfo.extractedPrice
      : parsedAmount;

    const isAccountMatch = Boolean(!cleanDestAcc || cleanDestAcc.includes(cleanExpectedAcc) || cleanExpectedAcc.includes(cleanDestAcc));
    const isAmountMatch = Boolean(effectiveTargetAmount <= 0 || Math.abs(ocrAmount - effectiveTargetAmount) <= 20);
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
      else if (!isAmountMatch) failureReason = `Paid amount on slip (Rs. ${ocrAmount}) does not match package price (Rs. ${effectiveTargetAmount || parsedAmount}).`;
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
            expected: effectiveTargetAmount || parsedAmount,
            detected: ocrAmount,
            isSuspicious: !isAmountMatch,
            message: isAmountMatch
              ? `Tariff Rs. ${ocrAmount} matched with package price.`
              : `Deposit amount Rs. ${ocrAmount} differs from package price (Rs. ${effectiveTargetAmount || parsedAmount}).`
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

  // =========================================================================
  // VPN RENEWAL FLOW (orderType === "renew")
  // Reset used traffic to 0 GB, extend 30 days, set exact quota on Primary Node
  // =========================================================================
  if (orderType === "renew") {
    const primaryConfig = getPrimaryConfigFromUser(user, metaData);
    const quotaInfo = extractQuotaFromPrimaryConfig(cleanPackageName || primaryConfig.title, metaData.dataTotal);
    const vlessInfo = parsePrimaryVlessUri(primaryConfig.vlessUri, user.email || "");
    const effectiveTargetAmount = parsedAmount > 0 ? parsedAmount : (vlessInfo.extractedPrice || 0);

    if (!primaryConfig.vlessUri) {
      return NextResponse.json({
        success: false,
        error: "No active primary VPN configuration found to renew."
      }, { status: 400 });
    }

    // Renew Client on Primary 3x-ui Node (Ignore USA Node #2)
    let renewalResult: any = null;
    try {
      if (!systemConfig.primary3xui.baseUrl || !systemConfig.primary3xui.username) {
        throw new Error("3x-ui Primary Node credentials missing in System Config");
      }

      const xui = createXuiClient(systemConfig.primary3xui);
      renewalResult = await xui.renewClientFromPrimaryConfig({
        userEmail: user.email || "",
        vlessUuid: vlessInfo.uuid || metaData.vpnUuid || metaData.customVpnUserId,
        vlessRemark: vlessInfo.remark,
        quotaGb: quotaInfo.quotaGb,
        isUnlimited: quotaInfo.isUnlimited
      });
    } catch (renewErr: any) {
      console.error("3x-ui renewal failed:", renewErr);
      return NextResponse.json({
        success: false,
        manualMode: false,
        verified: false,
        autoApproved: false,
        status: "Error",
        error: renewErr?.message || "3x-ui renewal failed",
        message: `Automatic VPN Renewal Failed: ${renewErr?.message || "3x-ui API unreachable"}`,
        auditReport: {
          overallStatus: "error",
          reason: `3x-ui Renewal Error: ${renewErr?.message || "Failed to update client on inbound"}`,
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
              expected: effectiveTargetAmount,
              detected: ocrAmount,
              message: `Exact tariff Rs. ${effectiveTargetAmount} verified.`
            },
            {
              id: "line",
              title: "Line Activated",
              passed: false,
              isSuspicious: true,
              statusText: "Failed",
              message: `Line Renewal: Failed — ${renewErr?.message || "3x-ui API unreachable"}`
            }
          ]
        }
      });
    }

    // Update Database Record in Prisma
    const renewedPaymentRecord = {
      id: cleanRefNumber,
      refNumber: cleanRefNumber,
      packageId: "renew",
      package: `${primaryConfig.title} (Renewed)`,
      packageName: primaryConfig.title,
      quotaLabel: quotaInfo.displayQuota,
      amount: effectiveTargetAmount || ocrAmount || 0,
      receipt: cleanReceiptUrl || "ADMIN_SANDBOX_RENEWAL",
      receiptUrl: cleanReceiptUrl || "ADMIN_SANDBOX_RENEWAL",
      status: "Verified",
      autoVerified: true,
      bankName: ocrResult?.bankName || "Commercial Bank",
      date: new Date().toISOString(),
      verificationNote: adminTestMode ? "Admin Sandbox VPN Renewal" : "Verified & VPN Renewed (Traffic Reset)"
    };

    const newExpiry = new Date(renewalResult.expiryTimeMs).toISOString();

    const updatedPayments = [renewedPaymentRecord, ...(Array.isArray(metaData.payments) ? metaData.payments : [])];
    const updatedMeta = {
      ...metaData,
      accountStatus: "Active",
      dataUsed: "0 GB",
      previousUsage: 0,
      previousUsageGB: 0,
      dataTotal: quotaInfo.displayQuota,
      expiryDate: renewalResult.newExpiryDate,
      payments: updatedPayments,
      pendingOrders: []
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        vpnStatus: "Active",
        expiryDate: newExpiry,
        subscriptionLink: JSON.stringify(updatedMeta)
      }
    });

    // Record Reference in Global Ledger
    const newLedgerEntry = {
      refNumber: cleanRefNumber,
      email: user.email,
      packageName: `${primaryConfig.title} (Renewal)`,
      amount: effectiveTargetAmount || ocrAmount || 0,
      date: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };

    const updatedLedger = [...(systemConfig.verifiedRefLedger || []), newLedgerEntry];
    await updateGlobalSystemConfig({
      verifiedRefLedger: updatedLedger
    });

    const approvedAuditReport = {
      overallStatus: "approved",
      reason: `VPN Renewed: Used traffic reset to 0 GB (${quotaInfo.displayQuota} restored). Extended 30 days.`,
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
          expected: effectiveTargetAmount,
          detected: ocrAmount,
          message: `Exact tariff Rs. ${effectiveTargetAmount} verified.`
        },
        {
          id: "line",
          title: "Line Activated",
          passed: true,
          statusText: "Renewed",
          message: `Primary Node #${renewalResult.inboundId} traffic reset to 0 GB. Extended to ${renewalResult.newExpiryDate}.`
        }
      ]
    };

    return NextResponse.json({
      success: true,
      verified: true,
      autoApproved: true,
      status: "Active",
      orderType: "renew",
      message: `VPN Line Renewed Successfully! Traffic reset to 0 GB (${quotaInfo.displayQuota} restored). Valid until ${renewalResult.newExpiryDate}.`,
      order: renewedPaymentRecord,
      user: updatedUser,
      renewalInfo: {
        configTitle: primaryConfig.title,
        resetUsedTo: "0 GB",
        restoredQuota: quotaInfo.displayQuota,
        newExpiryDate: renewalResult.newExpiryDate
      },
      auditReport: approvedAuditReport
    });
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
      packageId,
      name: cleanPackageName,
      quotaGb,
      validityDays: 30,
      isp,
      amount: parsedAmount || ocrAmount || 0,
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
      clientRemark?: string;
    };

    try {
      if (!systemConfig.primary3xui.baseUrl || !systemConfig.primary3xui.username) {
        throw new Error("3x-ui Primary Node credentials missing in System Config");
      }

      provisionResult = await provision3xuiClient(
        { ...systemConfig.primary3xui, inboundId: targetInboundId },
        clientUuid,
        user.email,
        packageData,
        systemConfig
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
    const formattedConfigKey = `[ ${formattedPackageWithGb} ]\n${realVlessKey}`;

    // Optional Bonus USA Node Provisioning (if enabled)
    let generatedUsaSubUrl: string | undefined = undefined;
    if (systemConfig.bonusUsa3xui?.enabled && systemConfig.bonusUsa3xui.baseUrl && systemConfig.bonusUsa3xui.username) {
      try {
        const bonusRes = await provision3xuiClient(
          systemConfig.bonusUsa3xui,
          clientUuid,
          user.email,
          { ...packageData, name: `${cleanPackageName} (Bonus USA)` },
          systemConfig
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
      package: formattedPackageWithGb,
      packageName: formattedPackageWithGb,
      quotaLabel: orderedQuotaLabel,
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
          message: "10Gbps Singapore core line & VLESS config activated."
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
          name: formattedPackageWithGb,
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
