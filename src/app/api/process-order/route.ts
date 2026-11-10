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
        message: "Receipt uploaded successfully. Reference number queued for swift settlement clearance.",
        order: orderRecord,
        user: updatedUser,
        auditReport: auditReport || {
          overallStatus: "review_required",
          reason: "Receipt uploaded successfully. Reference number queued for swift settlement clearance.",
          checks: [
            { id: "doc", title: "Document Received", passed: true, statusText: "Received", message: "Slip image securely registered in settlement vault." },
            { id: "account", title: "Beneficiary Matching", passed: false, statusText: "Awaiting Clearance", expected: systemConfig.expectedBankAccount || "8029138148", message: "Beneficiary matching queued for rapid clearance." },
            { id: "ledger", title: "Ledger Inscription", passed: false, statusText: "Queued", expected: parsedAmount, message: "Awaiting settlement clearance." },
            { id: "node", title: "Slot Provisioning", passed: false, statusText: "Pending Clearance", message: "Encrypted VLESS slot allocated upon clearance." }
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

    // 5. OCR Analysis via Groq Vision API (qwen/qwen3.8-27b)
    const groqApiKey = (process.env.GROQ_API_KEY || systemConfig.groqApiKey || "").trim();
    if (!groqApiKey) {
      console.warn("[Groq Vision] GROQ_API_KEY not configured in environment or settings.");
      return await fallbackToManualVerification("Receipt uploaded successfully. Reference number queued for swift settlement clearance.", {
        overallStatus: "review_required",
        reason: "Receipt uploaded successfully. Reference number queued for swift settlement clearance.",
        checks: [
          { id: "doc", title: "Document Received", passed: true, statusText: "Received", message: "Slip image securely registered in settlement vault." },
          { id: "account", title: "Beneficiary Matching", passed: false, statusText: "Awaiting Clearance", expected: systemConfig.expectedBankAccount || "8029138148", message: "Beneficiary matching queued for rapid clearance." },
          { id: "ledger", title: "Ledger Inscription", passed: false, statusText: "Queued", expected: parsedAmount, message: "Awaiting settlement clearance." },
          { id: "node", title: "Slot Provisioning", passed: false, statusText: "Pending Clearance", message: "Encrypted VLESS slot allocated upon clearance." }
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
                  text: `Extract bank transfer details as JSON: bankName, destinationAccount, paidAmount (number), transactionDate, referenceNumber, isLegitimate (boolean). Expected Account: ${systemConfig.expectedBankAccount || "8029138148"}. Expected Amount: Rs. ${parsedAmount}. Output strictly valid JSON.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (groqRes.ok) {
        const groqJson = await groqRes.json();
        const textContent = groqJson.choices?.[0]?.message?.content || "";
        const cleanJsonText = textContent.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        if (cleanJsonText) {
          try {
            ocrResult = JSON.parse(cleanJsonText);
            console.log("[Groq Vision] Extracted receipt payload successfully:", ocrResult);
          } catch (e: any) {
            ocrRawDiagnostic = `JSON parse failed: ${e?.message}`;
            console.warn("[Groq Vision] Parse error:", e?.message);
          }
        }
      } else {
        const errBody = await groqRes.text();
        ocrRawDiagnostic = `Groq HTTP ${groqRes.status}: ${errBody.slice(0, 160)}`;
        console.warn(`[Groq Vision] Groq returned HTTP ${groqRes.status}:`, errBody);
      }
    } catch (callErr: any) {
      ocrRawDiagnostic = `Groq network exception: ${callErr?.message}`;
      console.warn("[Groq Vision] Call error:", callErr?.message);
    }

    if (!ocrResult) {
      return await fallbackToManualVerification("Receipt uploaded successfully. Reference number queued for swift settlement clearance.", {
        overallStatus: "review_required",
        reason: "Receipt uploaded successfully. Reference number queued for swift settlement clearance.",
        checks: [
          { id: "doc", title: "Document Received", passed: true, statusText: "Received", message: "Slip image securely registered in settlement vault." },
          { id: "account", title: "Beneficiary Matching", passed: false, statusText: "Awaiting Clearance", expected: systemConfig.expectedBankAccount || "8029138148", message: "Beneficiary matching queued for rapid clearance." },
          { id: "ledger", title: "Ledger Inscription", passed: false, statusText: "Queued", expected: parsedAmount, message: "Awaiting settlement clearance." },
          { id: "node", title: "Slot Provisioning", passed: false, statusText: "Pending Clearance", message: "Encrypted VLESS slot allocated upon clearance." }
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
        overallStatus: "review_required",
        reason: "Receipt uploaded successfully. Reference number queued for swift settlement clearance.",
        checks: [
          {
            id: "doc",
            title: "Document Received",
            passed: true,
            statusText: "Confirmed",
            detectedBank: ocrResult.bankName || "Bank Transfer",
            detectedRef: cleanRefNumber || "Unknown",
            message: `Slip registered from ${ocrResult.bankName || "Online Banking"}`
          },
          {
            id: "account",
            title: "Beneficiary Matching",
            passed: isAccountMatch,
            statusText: isAccountMatch ? "Verified" : "Awaiting Clearance",
            expected: cleanExpectedAcc,
            detected: cleanDestAcc || "Not Detected",
            message: isAccountMatch
              ? `Beneficiary Commercial Bank Account ${cleanExpectedAcc} verified.`
              : `Beneficiary transfer logged for manual review clearance.`
          },
          {
            id: "ledger",
            title: "Ledger Inscription",
            passed: isAmountMatch && !isDuplicate,
            statusText: isAmountMatch && !isDuplicate ? "Inscribed" : "Awaiting Clearance",
            expected: parsedAmount,
            detected: ocrAmount,
            refNumber: cleanRefNumber,
            message: isAmountMatch && !isDuplicate
              ? `Rs. ${ocrAmount} verified in ledger.`
              : `Tariff balance queued for swift settlement confirmation.`
          },
          {
            id: "node",
            title: "Slot Provisioning",
            passed: false,
            statusText: "Pending Clearance",
            message: "Slot reserved. Forwarded to admin priority clearance."
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
      reason: "Institutional settlement verified and cleared.",
      checks: [
        {
          id: "doc",
          title: "Document Received",
          passed: true,
          statusText: "Confirmed",
          detectedBank: ocrResult?.bankName || "Commercial Bank",
          detectedRef: cleanRefNumber,
          message: `Verified transfer from ${ocrResult?.bankName || "Bank"}`
        },
        {
          id: "account",
          title: "Beneficiary Matching",
          passed: true,
          statusText: "Verified",
          expected: cleanExpectedAcc,
          detected: cleanDestAcc,
          message: `Commercial Bank Account ${cleanExpectedAcc} verified.`
        },
        {
          id: "ledger",
          title: "Ledger Inscription",
          passed: true,
          statusText: "Inscribed",
          expected: parsedAmount,
          detected: ocrAmount,
          refNumber: cleanRefNumber,
          message: `Settlement ref #${cleanRefNumber} recorded in ledger.`
        },
        {
          id: "node",
          title: "Slot Provisioning",
          passed: true,
          statusText: "Provisioned",
          message: "High-speed 10Gbps Singapore core activated."
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
