import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGlobalSystemConfig, updateGlobalSystemConfig } from "@/lib/systemConfig";
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
  const inboundId = nodeConfig.inboundId || 1;

  try {
    const loginParams = new URLSearchParams();
    loginParams.append("username", nodeConfig.username.trim());
    loginParams.append("password", nodeConfig.password.trim());

    const loginRes = await fetch(`${cleanBase}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: loginParams.toString(),
      signal: AbortSignal.timeout(5000)
    });

    const cookieHeader = loginRes.headers.get("set-cookie") || "";
    if (!cookieHeader) return;

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

    // 1. Try addClient: /panel/api/ path first, then /xui/API/ path fallback
    let added = false;
    for (const addPath of ["/panel/api/inbounds/addClient", "/xui/API/inbounds/addClient"]) {
      try {
        const res = await fetch(`${cleanBase}${addPath}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookieHeader },
          body: JSON.stringify(clientPayload),
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            added = true;
            break;
          }
        }
      } catch {}
    }

    // 2. If addClient was rejected (e.g. client UUID or email already exists), update client
    if (!added) {
      for (const updatePath of [`/panel/api/inbounds/updateClient/${clientUuid}`, `/xui/API/inbounds/updateClient/${clientUuid}`]) {
        try {
          const res = await fetch(`${cleanBase}${updatePath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookieHeader },
            body: JSON.stringify(clientPayload),
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) break;
          }
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

    const fallbackToManualVerification = async (reason: string) => {
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
        message: "Receipt received! Our team is verifying your payment manually. Config will activate shortly.",
        order: orderRecord,
        user: updatedUser
      });
    };

    // 3. Check Master Auto-Approval Switch
    if (!systemConfig.autoApprovalEnabled) {
      return await fallbackToManualVerification("Auto-approval disabled by admin. Queued for manual verification.");
    }

    if (!cleanReceiptUrl) {
      return await fallbackToManualVerification("No payment slip image attached. Queued for review.");
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

    // 5. OCR Analysis via Gemini 1.5 Flash Vision
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return await fallbackToManualVerification("Gemini API key not configured. Queued for manual admin approval.");
    }

    let ocrResult: {
      bankName?: string;
      destinationAccount?: string;
      paidAmount?: number;
      transactionDate?: string;
      referenceNumber?: string;
      isLegitimate?: boolean;
    } | null = null;

    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

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

      const geminiRes = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (geminiRes.ok) {
        const geminiJson = await geminiRes.json();
        const textContent = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          ocrResult = JSON.parse(textContent);
        }
      }
    } catch (ocrErr: any) {
      console.warn("Gemini OCR error:", ocrErr?.message);
    }

    if (!ocrResult) {
      return await fallbackToManualVerification("OCR scan could not decipher receipt details clearly.");
    }

    // 6. Strict Multi-Layer Validation
    const cleanDestAcc = (ocrResult.destinationAccount || "").replace(/\D/g, "");
    const cleanExpectedAcc = (systemConfig.expectedBankAccount || "8029138148").replace(/\D/g, "");
    const cleanRefNumber = (ocrResult.referenceNumber || "").trim();
    const ocrAmount = Number(ocrResult.paidAmount) || 0;

    // A. Check Destination Account
    if (!cleanDestAcc || !cleanDestAcc.includes(cleanExpectedAcc)) {
      return await fallbackToManualVerification(`Destination account (${cleanDestAcc || "unclear"}) does not match expected (${cleanExpectedAcc}).`);
    }

    // B. Check Amount (allow small tolerance if bank deduction or fee)
    if (parsedAmount > 0 && Math.abs(ocrAmount - parsedAmount) > 20) {
      return await fallbackToManualVerification(`Paid amount on slip (Rs. ${ocrAmount}) does not match package price (Rs. ${parsedAmount}).`);
    }

    // C. Check Unique Reference Number to prevent replay/duplicate use
    if (!cleanRefNumber || cleanRefNumber.length < 4) {
      return await fallbackToManualVerification("Transaction reference number could not be read clearly.");
    }

    const isDuplicate = (systemConfig.verifiedRefLedger || []).some(
      entry => entry.refNumber.toLowerCase() === cleanRefNumber.toLowerCase()
    );

    if (isDuplicate) {
      return await fallbackToManualVerification(`Duplicate slip: Reference number #${cleanRefNumber} has already been used.`);
    }

    // 7. Auto-Approval: Generate Client UUID & VLESS Configs
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

    return NextResponse.json({
      success: true,
      autoApproved: true,
      status: "Active",
      configs: configSlots,
      message: `Payment verified automatically! Reference #${cleanRefNumber} confirmed. Your VPN is now Active.`,
      order: verifiedPaymentRecord,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Process order unexpected error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal processing error"
    }, { status: 500 });
  }
}
