// ========================================================================
// LEGION VPN - STRICT VLESS LINK GENERATOR ENGINE
// ========================================================================

export interface VlessConfigParams {
  uuid: string;
  ispDomain: string;
  packageSni: string;
  ispName: string;
  ispPrice: string;
  clientEmail: string;
  port?: number | string;
  isBonusUsa?: boolean;
}

export const DEFAULT_ISP_DOMAINS: Record<string, string> = {
  Airtel: "airtel.legiongraphics.site",
  Dialog: "dialog.legiongraphics.site",
  SLT: "slt.legiongraphics.site",
  Hutch: "hutch.legiongraphics.site",
  "Bonus USA": "bonus-usa.legiongraphics.site"
};

export const DEFAULT_PACKAGE_SNIS: Record<string, string> = {
  "dialog-zoom": "aka.ms",
  "dialog-social": "m.facebook.com",
  "dialog-tiktok-warn": "v.tiktok.com",
  "airtel-tiktok": "v.tiktok.com",
  "airtel-yt": "m.youtube.com",
  "airtel-zoom-old": "zoom.us",
  "hutch-zoom": "zoom.us",
  "slt-fiber-zoom": "zoom.us",
  "slt-fiber-ent": "netflix.com",
  "slt-router-zoom": "zoom.us"
};

export const PACKAGE_ISP_PRICES: Record<string, { isp: string; priceDigits: string; shortName: string }> = {
  "dialog-zoom": { isp: "Dialog", priceDigits: "724", shortName: "Dialog Zoom" },
  "dialog-social": { isp: "Dialog", priceDigits: "348", shortName: "Dialog Social" },
  "dialog-tiktok-warn": { isp: "Dialog", priceDigits: "297", shortName: "Dialog TikTok" },
  "airtel-tiktok": { isp: "Airtel", priceDigits: "297", shortName: "Airtel TikTok" },
  "airtel-yt": { isp: "Airtel", priceDigits: "260", shortName: "Airtel YouTube" },
  "airtel-zoom-old": { isp: "Airtel", priceDigits: "215", shortName: "Airtel Zoom" },
  "hutch-zoom": { isp: "Hutch", priceDigits: "224", shortName: "Hutch Zoom" },
  "slt-fiber-zoom": { isp: "SLT", priceDigits: "195", shortName: "SLT Fiber Zoom" },
  "slt-fiber-ent": { isp: "SLT", priceDigits: "1990", shortName: "SLT Fiber Ent" },
  "slt-router-zoom": { isp: "SLT", priceDigits: "235", shortName: "SLT Router Zoom" }
};

/**
 * Extracts primary price digits from string (e.g. "Rs. 724 (Unlimited)" -> "724")
 */
export function extractPriceDigits(priceStr?: string): string {
  if (!priceStr) return "VPN";
  const match = priceStr.match(/(\d+)/);
  return match ? match[1] : "VPN";
}

/**
 * Builds a strict VLESS URI according to specification:
 * vless://<UUID>@<ispDomain>:443/?type=tcp&encryption=none&flow=&security=tls&sni=<packageSNI>&alpn=h2%2Chttp%2F1.1&allowInsecure=1&fp=chrome#LEGION-VPN-<cleanPrice><ISP>-<encodedClientEmail>
 */
export function buildVlessLink(params: VlessConfigParams): string {
  const {
    uuid,
    ispDomain,
    packageSni,
    ispName,
    ispPrice,
    clientEmail,
    port = 443,
    isBonusUsa = false
  } = params;

  const cleanUuid = (uuid || "").trim();
  const cleanDomain = (ispDomain || "legiongraphics.site").trim();
  const cleanSni = (packageSni || "zoom.us").trim();
  const encodedEmail = encodeURIComponent((clientEmail || "client").trim());

  let remarks = "";
  if (isBonusUsa) {
    remarks = `LEGION-VPN%20%28USA%20ZOOM%29-${encodedEmail}`;
  } else {
    const cleanPrice = extractPriceDigits(ispPrice);
    const cleanIsp = (ispName || "Server").trim();
    remarks = `LEGION-VPN-${cleanPrice}${cleanIsp}-${encodedEmail}`;
  }

  // Mandatory query string params in exact requested order
  const query = `type=tcp&encryption=none&flow=&security=tls&sni=${cleanSni}&alpn=h2%2Chttp%2F1.1&allowInsecure=1&fp=chrome`;

  return `vless://${cleanUuid}@${cleanDomain}:${port}/?${query}#${remarks}`;
}

/**
 * Formats assigned config slot header e.g. "[ Dialog Zoom (200GB) ]"
 */
export function formatConfigSlotTitle(packageName: string, quotaLabel: string, isBonus = false): string {
  let cleanPkg = (packageName || "VPN Package")
    .replace(/^📦\s*/, "")
    .replace(/[\[\]]/g, "")
    .trim();

  // Strip trailing "Unlimited" or "(20 GB)" / "(30 GB)"
  cleanPkg = cleanPkg.replace(/\s*(Unlimited|\(\d+\s*GB\))\s*$/i, "").trim();

  // Extract clean quota
  let cleanQuota = "Unlimited";
  const lowerQuota = (quotaLabel || "").toLowerCase();
  if (!lowerQuota.includes("unlimited")) {
    const gbMatch = (quotaLabel || "").match(/(\d+)\s*GB/i);
    if (gbMatch) {
      cleanQuota = `${gbMatch[1]}GB`;
    } else {
      cleanQuota = (quotaLabel || "Unlimited")
        .replace(/\s*\+\s*USA\s*Bonus\s*(Config)?/i, "")
        .replace(/Config\s*\(Budget\)/i, "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, "")
        .trim();
    }
  }

  if (isBonus) {
    return `${cleanPkg} Bonus USA (${cleanQuota})`;
  }
  return `${cleanPkg} (${cleanQuota})`;
}

/**
 * Generates both primary and optional Bonus USA config blocks for a package order.
 */
export function generateOrderConfigs(options: {
  uuid: string;
  clientEmail: string;
  packageId: string;
  packageName: string;
  quotaLabel: string;
  isp?: string;
  ispPrice?: string;
  domains?: Record<string, string>;
  snis?: Record<string, string>;
}): { title: string; code: string }[] {
  const {
    uuid,
    clientEmail,
    packageId,
    packageName,
    quotaLabel,
    isp,
    ispPrice,
    domains = DEFAULT_ISP_DOMAINS,
    snis = DEFAULT_PACKAGE_SNIS
  } = options;

  const pkgMeta = PACKAGE_ISP_PRICES[packageId];
  const targetIsp = pkgMeta?.isp || isp || "Dialog";
  const targetPriceDigits = pkgMeta?.priceDigits || extractPriceDigits(ispPrice);
  const ispDomain = domains[targetIsp] || domains.Dialog || "dialog.legiongraphics.site";
  const packageSni = snis[packageId] || "zoom.us";

  const primaryCode = buildVlessLink({
    uuid,
    ispDomain,
    packageSni,
    ispName: targetIsp,
    ispPrice: targetPriceDigits,
    clientEmail,
    isBonusUsa: false
  });

  const slots = [
    {
      title: formatConfigSlotTitle(packageName, quotaLabel, false),
      code: primaryCode
    }
  ];

  // If user selected quota with USA Bonus, append the 2nd slot
  const isUsaBonus = quotaLabel.toLowerCase().includes("usa bonus");
  if (isUsaBonus) {
    const usaDomain = domains["Bonus USA"] || "bonus-usa.legiongraphics.site";
    const usaCode = buildVlessLink({
      uuid,
      ispDomain: usaDomain,
      packageSni,
      ispName: "USA",
      ispPrice: "USA",
      clientEmail,
      isBonusUsa: true
    });

    slots.push({
      title: formatConfigSlotTitle(packageName, quotaLabel, true),
      code: usaCode
    });
  }

  return slots;
}
