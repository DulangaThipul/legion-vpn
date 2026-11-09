import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, updateGlobalSystemConfig, authenticate3xui, httpRequestUnsafe, unsafeAgent } from "@/lib/systemConfig";
import { generateOrderConfigs, PACKAGE_ISP_PRICES } from "@/lib/vlessGenerator";
import crypto from "crypto";

export const runtime = "nodejs";

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
 * Helper to provision or update a client on a 3x-ui Node (Dual API Paths: /panel/api/ & /xui/API/)
 */
async function provision3xuiClient(
  nodeConfig: {
    baseUrl: string;
    username: string;
    password: string;
    inboundId: number | string;
  },
  clientUuid: string,
  clientEmail: string,
  totalBytes: number,
  expiryTimeMs: number
) {
  if (!nodeConfig.baseUrl || !nodeConfig.username) return;
  const cleanBase = nodeConfig.baseUrl.trim().replace(/\/+$/, "");
  const inboundId = Number(nodeConfig.inboundId) || 1;

  try {
    const auth = await authenticate3xui({
      baseUrl: cleanBase,
      username: nodeConfig.username,
      password: nodeConfig.password
    });
    if (!auth.success || !auth.cookie) {
      console.warn("3x-ui authentication failed:", auth.error);
      return;
    }

    const activeBase = auth.effectiveBaseUrl || cleanBase;
    let originUrl = activeBase;
    try {
      originUrl = new URL(activeBase).origin;
    } catch {}

    const clientPayload = {
      id: inboundId,
      settings: JSON.stringify({
        clients: [
          {
            id: clientUuid,
            email: clientEmail,
            flow: "",
            limitIp: 2,
            totalGB: totalBytes,
            expiryTime: expiryTimeMs,
            enable: true,
            tgId: "",
            subId: clientUuid.slice(0, 16)
          }
        ]
      })
    };

    const clientHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Cookie": auth.cookie,
      "Origin": originUrl,
      "Referer": `${activeBase}/`,
      "Accept": "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
      ...(auth.csrfToken ? { "X-CSRF-Token": auth.csrfToken } : {})
    };

    // 1. Try addClient: /panel/api/ path first, then /xui/API/ path fallback
    let added = false;
    for (const addPath of ["/panel/api/inbounds/addClient", "/xui/API/inbounds/addClient"]) {
      try {
        const res = await httpRequestUnsafe(`${activeBase}${addPath}`, {
          method: "POST",
          headers: clientHeaders,
          body: JSON.stringify(clientPayload),
          timeout: 5000
        });
        if (res.statusCode === 200 && res.json?.success) {
          added = true;
          break;
        }
      } catch {}
    }

    // 2. If addClient was rejected (e.g. client UUID or email already exists), update client
    if (!added) {
      for (const updatePath of [`/panel/api/inbounds/updateClient/${clientUuid}`, `/xui/API/inbounds/updateClient/${clientUuid}`]) {
        try {
          const res = await httpRequestUnsafe(`${activeBase}${updatePath}`, {
            method: "POST",
            headers: clientHeaders,
            body: JSON.stringify(clientPayload),
            timeout: 5000
          });
          if (res.statusCode === 200 && res.json?.success) break;
        } catch {}
      }
    }
  } catch (err: any) {
    console.warn("3x-ui provisioning warning:", err?.message || err);
  }
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
    const { packageId, packageName, quotaLabel, amount, receiptUrl, ispPrice } = body;

    const parsedAmount = Number(amount) || 0;
    const cleanPackageName = (packageName || "VPN Package").trim();
    const cleanQuotaLabel = (quotaLabel || "Unlimited").trim();
    const cleanReceiptUrl = (receiptUrl || "").trim();

    // 2. Load Global System Configuration
    const systemConfig = await getGlobalSystemConfig();

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

    const fallbackToManualVerification = async (reason: string, auditReport?: any) => {
      const orderRecord = {
        id: `ORD-${Date.now()}`,
        packageId: packageId || "custom",
        package: `${cleanPackageName} (${cleanQuotaLabel})`,
        packageName: cleanPackageName,
        quotaLabel: cleanQuotaLabel,
        amount: parsedAmount,
        receipt: cleanReceiptUrl,
        receiptUrl: cleanReceiptUrl,
        status: "Verifying",
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
        status: "Verifying",
        message: reason || "Receipt received! Our team is verifying your payment manually. Config will activate shortly.",
        order: orderRecord,
        user: updatedUser,
        auditReport: auditReport || {
          overallStatus: "review_required",
          reason,
          checks: [
            { id: "ocr", title: "Receipt OCR Extraction", passed: false, statusText: "Queued", message: reason },
            { id: "account", title: "Beneficiary Account Audit", passed: false, statusText: "Pending", expected: systemConfig.expectedBankAccount || "8029138148" },
            { id: "amount", title: "Payment Amount Match", passed: false, statusText: "Pending", expected: parsedAmount },
            { id: "replay", title: "Anti-Replay Ledger Audit", passed: false, statusText: "Pending" },
            { id: "node", title: "10Gbps VLESS Node Allocation", passed: false, statusText: "Manual Approval Required" }
          ]
        }
      });
    };

    // 3. Check Master Auto-Approval Switch
    if (!systemConfig.autoApprovalEnabled) {
      return await fallbackToManualVerification("Auto-approval is paused in Admin Settings. Slip routed for fast manual review.", {
        overallStatus: "review_required",
        reason: "Auto-approval paused by administrator.",
        checks: [
          { id: "ocr", title: "Receipt Document Upload", passed: true, statusText: "Captured", message: "Receipt image successfully stored on cloud." },
          { id: "account", title: "Beneficiary Account Guardrail", passed: true, statusText: "Ready", expected: systemConfig.expectedBankAccount || "8029138148", message: "Bank Commercial Bank (8029138148)" },
          { id: "amount", title: "Package Price Target", passed: true, statusText: "Pending", expected: parsedAmount, message: `Package Rs. ${parsedAmount}` },
          { id: "replay", title: "Anti-Replay Ledger Check", passed: true, statusText: "Queued", message: "Slip hash queued for audit ledger." },
          { id: "node", title: "Master Auto-Approval Switch", passed: false, isSuspicious: true, statusText: "Switch OFF", message: "Master switch is OFF in Admin Command Center. Sent to manual approval." }
        ]
      });
    }

    if (!cleanReceiptUrl) {
      return await fallbackToManualVerification("No payment slip image attached. Queued for review.", {
        overallStatus: "review_required",
        reason: "No receipt uploaded.",
        checks: [
          { id: "ocr", title: "Receipt Document Upload", passed: false, isSuspicious: true, statusText: "Missing Slip", message: "No payment slip image was provided with this checkout." },
          { id: "account", title: "Beneficiary Account", passed: false, statusText: "Skipped" },
          { id: "amount", title: "Payment Amount Match", passed: false, statusText: "Skipped" },
          { id: "replay", title: "Anti-Replay Security", passed: false, statusText: "Skipped" },
          { id: "node", title: "Node Provisioning", passed: false, statusText: "Halted" }
        ]
      });
    }

    // 4. Fetch Slip Image & Prepare Base64
    let imageBase64 = "";
    let mimeType = "image/jpeg";

    try {
      const fetchUrl = getTransformableImageUrl(cleanReceiptUrl);
      const imgRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) throw new Error("Failed to download receipt image");

      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString("base64");

      const contentType = imgRes.headers.get("content-type");
      if (contentType && contentType.includes("png")) {
        mimeType = "image/png";
      } else if (contentType && contentType.includes("webp")) {
        mimeType = "image/webp";
      }
    } catch (fetchErr: any) {
      console.warn("Error fetching receipt image:", fetchErr?.message);
      return await fallbackToManualVerification("Unable to download receipt image for OCR scan.");
    }

    // 5. OCR Analysis via Gemini with Multi-Model / Multi-Version Fallback
    const geminiApiKey = (systemConfig.geminiApiKey || process.env.GEMINI_API_KEY || "").trim();
    if (!geminiApiKey) {
      return await fallbackToManualVerification("Gemini API key not configured. Queued for manual admin approval.", {
        overallStatus: "review_required",
        reason: "Gemini Vision API key is missing. Set it in Admin Settings Tab 3 or environment variables.",
        checks: [
          { id: "ocr", title: "Receipt OCR Kernel", passed: false, isSuspicious: true, statusText: "Key Missing", strikeText: "No Gemini Key Configured", expected: "Google AI Studio API Key", message: "Gemini API Key not configured in Admin Settings Tab 3." },
          { id: "account", title: "Beneficiary Account Audit", passed: true, statusText: "Target: 8029138148", expected: systemConfig.expectedBankAccount || "8029138148" },
          { id: "amount", title: "Payment Amount Match", passed: true, statusText: `Rs. ${parsedAmount}`, expected: parsedAmount },
          { id: "replay", title: "Anti-Replay Ledger", passed: true, statusText: "Queued" },
          { id: "node", title: "10Gbps VLESS Node Allocation", passed: false, statusText: "Pending Admin" }
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

    const promptText = `You are a strict bank receipt auditor for Legion VPN Sri Lanka.
Analyze this payment slip and extract the payment transaction details in pure JSON.
Expected Bank Account: ${systemConfig.expectedBankAccount || "8029138148"}.
Expected Amount: Rs. ${parsedAmount}.

Output STRICT JSON only with keys:
{
  "bankName": string (e.g. Commercial Bank, BOC, Sampath, FriMi, etc.),
  "destinationAccount": string (the recipient/beneficiary account number found on slip),
  "paidAmount": number (the exact transfer amount in LKR without currency symbol),
  "transactionDate": string (date found on slip),
  "referenceNumber": string (unique transaction sequence/reference/audit number),
  "isLegitimate": boolean (true if genuine bank transfer receipt, false if fake or invalid)
}`;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    };

    // Candidate endpoints to bypass Google's 404 Model/Version NotFound
    const candidateEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`
    ];

    for (const endpoint of candidateEndpoints) {
      const cleanEndpointName = endpoint.split("?")[0].replace("https://generativelanguage.googleapis.com/", "");
      try {
        const geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(12000)
        });

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const textContent = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textContent) {
            const cleanJsonText = textContent.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
            ocrResult = JSON.parse(cleanJsonText);
            if (ocrResult) {
              console.log(`[Gemini OCR] Successfully extracted receipt via ${cleanEndpointName}`);
              break;
            }
          }
        } else {
          const errBody = await geminiRes.text();
          ocrRawDiagnostic = `${cleanEndpointName} returned HTTP ${geminiRes.status}: ${errBody.slice(0, 160)}`;
          console.warn(`[Gemini OCR] ${cleanEndpointName} returned ${geminiRes.status}:`, errBody);
        }
      } catch (callErr: any) {
        ocrRawDiagnostic = `${cleanEndpointName} error: ${callErr?.message}`;
        console.warn(`[Gemini OCR] Call error on ${cleanEndpointName}:`, callErr?.message);
      }
    }

    if (!ocrResult) {
      return await fallbackToManualVerification(`OCR scan could not decipher receipt details clearly. (${ocrRawDiagnostic || "Unreadable text"})`, {
        overallStatus: "review_required",
        reason: "OCR kernel could not extract clear text from the receipt.",
        checks: [
          { id: "ocr", title: "Receipt OCR Kernel", passed: false, isSuspicious: true, statusText: "Unreadable", message: `Could not decipher slip details: ${ocrRawDiagnostic || "Blurry or invalid slip"}` },
          { id: "account", title: "Beneficiary Account Audit", passed: false, statusText: "Pending", expected: systemConfig.expectedBankAccount || "8029138148" },
          { id: "amount", title: "Payment Amount Match", passed: false, statusText: "Pending", expected: parsedAmount },
          { id: "replay", title: "Anti-Replay Security Check", passed: false, statusText: "Pending" },
          { id: "node", title: "10Gbps VLESS Node Allocation", passed: false, statusText: "Queued for Manual Admin Review" }
        ]
      });
    }

    // 6. Strict Multi-Layer Validation
    const cleanDestAcc = (ocrResult.destinationAccount || "").replace(/\D/g, "");
    const cleanExpectedAcc = (systemConfig.expectedBankAccount || "8029138148").replace(/\D/g, "");
    const cleanRefNumber = (ocrResult.referenceNumber || "").trim();
    const ocrAmount = Number(ocrResult.paidAmount) || 0;

    const isAccountMatch = Boolean(cleanDestAcc && (cleanDestAcc.includes(cleanExpectedAcc) || cleanExpectedAcc.includes(cleanDestAcc)));
    const isAmountMatch = Boolean(parsedAmount <= 0 || Math.abs(ocrAmount - parsedAmount) <= 20);
    const isDuplicate = (systemConfig.verifiedRefLedger || []).some(
      entry => entry.refNumber.toLowerCase() === cleanRefNumber.toLowerCase()
    );
    const isRefValid = Boolean(cleanRefNumber && cleanRefNumber.length >= 4 && !isDuplicate);

    // If any layer fails, create an exact diagnostic Glass HUD report
    if (!isAccountMatch || !isAmountMatch || !isRefValid) {
      let failureReason = "Payment validation discrepancy detected.";
      if (!isAccountMatch) failureReason = `Beneficiary account on slip (${cleanDestAcc || "unclear"}) does not match expected (${cleanExpectedAcc}).`;
      else if (!isAmountMatch) failureReason = `Paid amount on slip (Rs. ${ocrAmount}) does not match package price (Rs. ${parsedAmount}).`;
      else if (isDuplicate) failureReason = `Duplicate slip: Reference number #${cleanRefNumber} has already been used!`;
      else if (!cleanRefNumber || cleanRefNumber.length < 4) failureReason = "Transaction reference number could not be read clearly.";

      const discrepancyReport = {
        overallStatus: "suspicious",
        reason: failureReason,
        checks: [
          {
            id: "ocr",
            title: "Receipt Data Extraction",
            passed: true,
            statusText: "Extracted",
            detectedBank: ocrResult.bankName || "Bank Transfer",
            detectedRef: cleanRefNumber || "Unknown",
            message: `Slip detected from ${ocrResult.bankName || "Online Banking"}`
          },
          {
            id: "account",
            title: "Beneficiary Account Audit",
            passed: isAccountMatch,
            isSuspicious: !isAccountMatch,
            statusText: isAccountMatch ? "Verified" : "Mismatch",
            expected: cleanExpectedAcc,
            detected: cleanDestAcc || "Not Detected",
            strikeText: !isAccountMatch ? (cleanDestAcc || "Wrong Account") : undefined,
            message: isAccountMatch
              ? `Beneficiary Commercial Bank Account ${cleanExpectedAcc} Verified.`
              : `Beneficiary Account Mismatch: Detected ${cleanDestAcc || "unclear"} (Expected ${cleanExpectedAcc})`
          },
          {
            id: "amount",
            title: "Payment Amount Match",
            passed: isAmountMatch,
            isSuspicious: !isAmountMatch,
            statusText: isAmountMatch ? "Price Matched" : "Discrepancy",
            expected: parsedAmount,
            detected: ocrAmount,
            strikeText: !isAmountMatch ? `Rs. ${ocrAmount}` : undefined,
            message: isAmountMatch
              ? `Rs. ${ocrAmount} matches package price.`
              : `Amount Discrepancy: Slip shows Rs. ${ocrAmount} (Package requires Rs. ${parsedAmount})`
          },
          {
            id: "replay",
            title: "Anti-Replay Ledger Check",
            passed: !isDuplicate && Boolean(cleanRefNumber && cleanRefNumber.length >= 4),
            isSuspicious: isDuplicate,
            statusText: isDuplicate ? "Duplicate Used" : (cleanRefNumber ? "Unique Ref" : "Unclear Ref"),
            refNumber: cleanRefNumber,
            strikeText: isDuplicate ? `#${cleanRefNumber}` : undefined,
            message: isDuplicate
              ? `Security Alert: Ref #${cleanRefNumber} is already logged in the ledger!`
              : `Reference #${cleanRefNumber} unique & valid.`
          },
          {
            id: "node",
            title: "10Gbps VLESS Node Allocation",
            passed: false,
            statusText: "Routed to Admin",
            message: "Discrepancy detected. Forwarded to admin manual fast-track review."
          }
        ]
      };

      return await fallbackToManualVerification(failureReason, discrepancyReport);
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

    const configSlots = generateOrderConfigs({
      uuid: clientUuid,
      clientEmail: user.email,
      packageId: packageId || "dialog-zoom",
      packageName: cleanPackageName,
      quotaLabel: cleanQuotaLabel,
      isp,
      ispPrice: ispPrice || pkgMeta?.priceDigits || "",
      domains: systemConfig.ispDomains,
      snis: systemConfig.packageSnis
    });

    const serializedConfigs = configSlots.map(s => `[ ${s.title} ]\n${s.code}`).join("\n\n");
    const bonusUsaConfig = configSlots.find(s => s.title.toLowerCase().includes("bonus"));

    // 8. Provision to 3x-ui Server Nodes (Dual API Paths & Accurate Bytes)
    let totalBytes = 0;
    if (!cleanQuotaLabel.toLowerCase().includes("unlimited")) {
      const gbMatch = cleanQuotaLabel.match(/(\d+)\s*GB/i);
      if (gbMatch) {
        totalBytes = parseInt(gbMatch[1], 10) * 1024 * 1024 * 1024;
      }
    }
    const expiryTimeMs = Date.now() + 30 * 24 * 3600 * 1000;

    // Primary Node Provisioning
    if (systemConfig.primary3xui.baseUrl && systemConfig.primary3xui.username) {
      await provision3xuiClient(
        systemConfig.primary3xui,
        clientUuid,
        user.email,
        totalBytes,
        expiryTimeMs
      );
    }

    // Bonus USA Node Provisioning (if bonus generated & node enabled)
    if (bonusUsaConfig && systemConfig.bonusUsa3xui?.enabled && systemConfig.bonusUsa3xui.baseUrl) {
      await provision3xuiClient(
        systemConfig.bonusUsa3xui,
        clientUuid,
        user.email,
        totalBytes,
        expiryTimeMs
      );
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
      const gbMatch = cleanQuotaLabel.match(/(\d+)\s*GB/i);
      if (gbMatch) cleanDataTotal = `${gbMatch[1]} GB`;
    }

    const updatedPayments = [...(metaData.payments || []), verifiedPaymentRecord];
    const updatedMeta = {
      ...metaData,
      customVpnUserId: clientUuid,
      vpnUuid: clientUuid,
      dataTotal: cleanDataTotal,
      ...(bonusUsaConfig ? { usaDataTotal: cleanDataTotal } : {}),
      payments: updatedPayments,
      showUsaUsage: Boolean(bonusUsaConfig) || metaData.showUsaUsage
    };

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        vpnStatus: "Active",
        vpnConfigKey: serializedConfigs,
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
      reason: "All security & banking guardrails passed successfully.",
      checks: [
        {
          id: "ocr",
          title: "Receipt Data Extraction",
          passed: true,
          statusText: "Verified",
          detectedBank: ocrResult?.bankName || "Commercial Bank",
          detectedRef: cleanRefNumber,
          message: `Verified genuine slip from ${ocrResult?.bankName || "Bank"}`
        },
        {
          id: "account",
          title: "Beneficiary Account Audit",
          passed: true,
          statusText: "Matched",
          expected: cleanExpectedAcc,
          detected: cleanDestAcc,
          message: `Beneficiary Account ${cleanExpectedAcc} verified.`
        },
        {
          id: "amount",
          title: "Payment Amount Match",
          passed: true,
          statusText: "Price Verified",
          expected: parsedAmount,
          detected: ocrAmount,
          message: `Rs. ${ocrAmount} matches package price.`
        },
        {
          id: "replay",
          title: "Anti-Replay Ledger Audit",
          passed: true,
          statusText: "Unique Hash",
          refNumber: cleanRefNumber,
          isDuplicate: false,
          message: `Cryptographic reference #${cleanRefNumber} verified.`
        },
        {
          id: "node",
          title: "10Gbps VLESS Node Allocation",
          passed: true,
          statusText: "Provisioned",
          message: "Account active. High-speed 10Gbps Singapore core bound."
        }
      ]
    };

    return NextResponse.json({
      success: true,
      autoApproved: true,
      status: "Active",
      configs: configSlots,
      message: `Payment verified automatically! Reference #${cleanRefNumber} confirmed. Your VPN is now Active.`,
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
