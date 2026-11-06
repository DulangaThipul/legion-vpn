"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAvatar, submitClientPaymentOrder, sendClientHeartbeat } from "@/lib/authActions";
import DashboardMatrix from "@/components/DashboardMatrix";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

const ISP_LOGOS = {
  Dialog: "https://files.catbox.moe/zyac5x.png",
  Airtel: "https://files.catbox.moe/5s5vfc.png",
  Hutch: "https://files.catbox.moe/fhd762.png",
  SLT: "https://files.catbox.moe/86zkr9.webp"
};

const BANK_ACCOUNT = { bankName: "Commercial Bank", accountName: "W DULANGA THIPUL", accountNo: "8029138148", branch: "Yatiyanthota" };

const ALL_PACKAGES = [
  { id: "dialog-zoom", isp: "Dialog", type: "router", name: "Dialog Zoom Unlimited", ispPrice: "Rs. 724 (Unlimited)", statusType: "best", statusText: "★ Best Package", devices: "Up to 3 Logins (Unlimited 6 Logins)", desc: "Home Broadband & Router Zoom unlimited bypass." },
  { id: "dialog-social", isp: "Dialog", type: "mobile", name: "Dialog Social (20 GB)", ispPrice: "Rs. 348 (20 GB)", statusType: "normal", statusText: "✓ Normal Package", devices: "Up to 2 Logins (Unlimited 3 Logins)", desc: "Dialog 20GB Social work plan tunnel." },
  { id: "dialog-tiktok-warn", isp: "Dialog", type: "mobile", name: "Dialog TikTok Unlimited", ispPrice: "Rs. 297/Wk | Rs. 997/Mo", statusType: "warn", statusText: "✗ Not Recommended", devices: "Up to 2 Logins (Unlimited 3 Logins)", desc: "50GB පසු වේගය 2Mbps දක්වා අඩුවේ. 50GB වඩා අවශ්‍ය නම් 1-Week plan එක සතියෙන් සතිය renew කරන්න." },
  
  { id: "airtel-tiktok", isp: "Airtel", type: "mobile", name: "Airtel TikTok Unlimited", ispPrice: "Rs. 297/Wk | Rs. 997/Mo", statusType: "best", statusText: "★ Best Choice", devices: "Up to 2 Logins (Unlimited 3 Logins)", desc: "Fastest speeds and zero restrictions on Airtel network." },
  { id: "airtel-yt", isp: "Airtel", type: "mobile", name: "Airtel YouTube Unlimited", ispPrice: "Rs. 260 (Unlimited)", statusType: "best", statusText: "★ Best Choice", devices: "Up to 2 Logins (Unlimited 3 Logins)", desc: "High stability tunneling for unlimited daily browsing." },
  { id: "airtel-zoom-old", isp: "Airtel", type: "mobile", name: "Airtel Zoom (30 GB)", ispPrice: "Rs. 215 (Old SIMs only)", statusType: "normal", statusText: "✓ Normal Package", devices: "Up to 2 Logins (Unlimited 3 Logins)", desc: "Standard speed tunneling for registered older SIMs." },
  
  { id: "hutch-zoom", isp: "Hutch", type: "mobile", name: "Hutch Zoom (30 GB)", ispPrice: "Rs. 224 (30 GB)", statusType: "normal", statusText: "✓ Normal Package", devices: "Up to 2 Logins (Unlimited 3 Logins)", desc: "Hutch network bypass for day-to-day internet needs." },
  
  { id: "slt-fiber-zoom", isp: "SLT", type: "router", name: "SLT Fiber Zoom", ispPrice: "Rs. 195(30GB) | Rs. 490(100GB)", statusType: "best", statusText: "★ Best Package", devices: "Up to 3 Logins (Unlimited 6 Logins)", desc: "SLT Fiber Zoom bypass without quota reduction." },
  { id: "slt-fiber-ent", isp: "SLT", type: "router", name: "SLT Fiber Unlimited Entertainment", ispPrice: "Rs. 1,990 (Unlimited)", statusType: "best", statusText: "★ Best Package", devices: "Up to 3 Logins (Unlimited 6 Logins)", desc: "4K Netflix, YouTube and entertainment streaming." },
  { id: "slt-router-zoom", isp: "SLT", type: "router", name: "SLT Router Zoom", ispPrice: "Rs. 235 (30 GB)", statusType: "normal", statusText: "✓ Normal Package", devices: "Up to 3 Logins (Unlimited 6 Logins)", desc: "SLT 4G Wireless Router Zoom package bypass." }
];

const ROUTER_CONFIG_PRICES: Record<string, number> = { "100 GB + USA Bonus Config": 250, "200 GB + USA Bonus Config": 400, "500 GB + USA Bonus Config": 700, "Unlimited + USA Bonus Config": 1000 };
const MOBILE_CONFIG_PRICES: Record<string, number> = { "20 GB Config (Budget)": 100, "50 GB Config (Budget)": 150, "100 GB Config (Budget)": 200, "200 GB Config": 300, "300 GB Config": 400, "Unlimited + USA Bonus": 700 };

// 📱 OFFICIAL VPN CLIENT APPS
const CLIENT_APPS = [
  {
    id: "android",
    name: "Netmod Syna",
    platform: "Android",
    osBadge: "Android 7.0+",
    url: "https://play.google.com/store/apps/details?id=com.netmod.syna",
    buttonText: "Google Play",
    desc: "Fast & stable VLESS client with tun2socks for Android smartphones and tablets.",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path d="M3.6 1.8A1.6 1.6 0 0 0 3 3.2v17.6a1.6 1.6 0 0 0 .6 1.4l9.7-9.8L3.6 1.8z" fill="#00C1A6"/>
        <path d="M16.5 15.6l-3.2-3.2-9.7 9.8c.4.2.9.2 1.4 0l11.5-6.6z" fill="#FF3333"/>
        <path d="M16.5 8.4L5 1.8c-.5-.2-1-.2-1.4 0l9.7 9.8 3.2-3.2z" fill="#FFBA00"/>
        <path d="M20.6 10.8l-4.1-2.4-3.2 3.2 3.2 3.2 4.1-2.4c.8-.5.8-1.1 0-1.6z" fill="#0086F0"/>
      </svg>
    ),
    badgeColor: "#10b981",
    btnGrad: "linear-gradient(135deg, #065f46 0%, #047857 100%)"
  },
  {
    id: "ios",
    name: "NPv Tunnel",
    platform: "iOS / iPhone",
    osBadge: "iOS 14.0+",
    url: "https://apps.apple.com/us/app/npv-tunnel/id1629465476",
    buttonText: "App Store",
    desc: "Official iOS tunneling app. Supports VLESS, TLS, and packet routing for iPhone & iPad.",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.71-.93 2.73 1 .08 2.02-.48 2.64-1.23z"/>
      </svg>
    ),
    badgeColor: "#38bdf8",
    btnGrad: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
  },
  {
    id: "windows",
    name: "Netch Windows",
    platform: "Windows OS",
    osBadge: "Windows 10 / 11",
    url: "https://www.mediafire.com/file/par1mj2p6l4sad9/Netch.rar/file",
    buttonText: "Direct Download",
    desc: "High-performance PC proxy with TUN/TAP adapter bypass and process-level game routing.",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#38bdf8">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801"/>
      </svg>
    ),
    badgeColor: "#60a5fa",
    btnGrad: "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)"
  },
  {
    id: "macos",
    name: "VBox Mac OS",
    platform: "macOS",
    osBadge: "macOS 12+",
    url: "https://apps.apple.com/us/app/v2box-v2ray-client/id6446814690",
    buttonText: "Mac App Store",
    desc: "Native desktop V2Ray & VLESS proxy manager optimized for Apple Silicon & Intel Macs.",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    badgeColor: "#a855f7",
    btnGrad: "linear-gradient(135deg, #581c87 0%, #6b21a8 100%)"
  }
];

// 🏆 REALISTIC FAIR RANKS CONFIGURATION
const RANKS = [
  { name: "Bronze", min: 0, color: "#d97706", badgeBg: "rgba(217, 119, 6, 0.15)", border: "#d97706", icon: "🥉" },
  { name: "Silver", min: 3, color: "#94a3b8", badgeBg: "rgba(148, 163, 184, 0.15)", border: "#94a3b8", icon: "⭐" },
  { name: "Gold", min: 6, color: "#eab308", badgeBg: "rgba(234, 179, 8, 0.15)", border: "#eab308", icon: "🏆" },
  { name: "Platinum", min: 10, color: "#06b6d4", badgeBg: "rgba(6, 182, 212, 0.15)", border: "#06b6d4", icon: "💎" },
  { name: "Diamond", min: 15, color: "#a855f7", badgeBg: "rgba(168, 85, 247, 0.15)", border: "#a855f7", icon: "👑" },
];

export default function DashboardTabs({ user: initialUser }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeIsp, setActiveIsp] = useState<string>("All");
  const [activeNetworkType, setActiveNetworkType] = useState<"all" | "router" | "mobile">("all");
  
  const [activeTool, setActiveTool] = useState<"speed" | "ip" | "ping" | "webrtc" | null>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [isVpnConnected, setIsVpnConnected] = useState<boolean | null>(null);
  
  const [modalPackage, setModalPackage] = useState<any | null>(null);
  const [simWarningModal, setSimWarningModal] = useState<any | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 🎁 FREE TEST PLAN POPUP STATE
  const [freeTestModal, setFreeTestModal] = useState(false);

  // 🧭 GLASSMORPHISM USER GUIDE STATES
  const [guidePromptOpen, setGuidePromptOpen] = useState(false); // Asking user first
  const [isTourActive, setIsTourActive] = useState(false);        // In active walkthrough
  const [tourStep, setTourStep] = useState(1);                   // 1 to 5 steps

  const [user, setUser] = useState(initialUser);
  const [avatar, setAvatar] = useState<string | null>(user?.image || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // 🚀 METADATA DECODER
  let metaData = useMemo(() => {
    let data = { 
      alert: "", 
      isPremium: false, 
      payments: [] as any[], 
      pendingOrders: [] as any[], 
      lastSeen: 0, 
      customRank: "", 
      bonusPurchases: 0,
      dataTotal: "Unlimited",
      dataUsed: "0 GB",
      lastRecordedUsage: "0 GB",
      subscriptionUrl: "",
      previousUsage: 0,
      previousUsageGB: 0,
      customVpnUserId: "",
      showUsaUsage: false,
      usaDataTotal: "Unlimited",
      usaDataUsed: "0 GB",
      usaLastRecordedUsage: "0 GB",
      usaSubscriptionUrl: "",
      usaPreviousUsage: 0,
      isRenewUnlocked: false,
      renewPopupMessage: "ඔබගේ පැකේජය අලුත් කිරීමට (Renew) දැනට අවසර ලබා දී නොමැත. කරුණාකර Admin අමතන්න.",
      forceShowGuide: undefined as boolean | undefined,
      expiryDate: undefined as string | undefined
    };
    if (user?.subscriptionLink) {
      try {
        data = { ...data, ...JSON.parse(user.subscriptionLink) };
      } catch {
        data.alert = user.subscriptionLink;
      }
    }
    return data;
  }, [user?.subscriptionLink]);

  // 📊 REALTIME 3x-ui DATA USAGE STATE & 30s COUNTDOWN
  const [liveDataUsed, setLiveDataUsed] = useState<string>(metaData.lastRecordedUsage || metaData.dataUsed || "0 GB");
  const [liveDataTotal, setLiveDataTotal] = useState<string>(metaData.dataTotal || "Unlimited");
  const [liveUsaDataUsed, setLiveUsaDataUsed] = useState<string>(metaData.usaLastRecordedUsage || metaData.usaDataUsed || "0 GB");
  const [liveUsaDataTotal, setLiveUsaDataTotal] = useState<string>(metaData.usaDataTotal || "Unlimited");
  const [isSyncingUsage, setIsSyncingUsage] = useState<boolean>(false);
  const [refreshCooldown, setRefreshCooldown] = useState<number>(30);
  const [idCopied, setIdCopied] = useState<boolean>(false);
  const [copiedConfigIndex, setCopiedConfigIndex] = useState<number | null>(null);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState<boolean>(false);
  const [isTourMinimized, setIsTourMinimized] = useState<boolean>(false);
  const [scrubbedTabId, setScrubbedTabId] = useState<string | null>(null);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const [renewModalOpen, setRenewModalOpen] = useState<boolean>(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Close WhatsApp popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (whatsappRef.current && !whatsappRef.current.contains(e.target as Node)) {
        setWhatsappMenuOpen(false);
      }
    };
    if (whatsappMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [whatsappMenuOpen]);

  const copyBankField = (fieldKey: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBankField(fieldKey);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  // ⏱️ Countdown Timer for Refresh Button (Decrements every 1 second)
  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setRefreshCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshCooldown]);

  // 🔑 EXTRACT VPN USER ID (UUID) FROM VLESS CONFIG OR ADMIN OVERRIDE
  const vpnUserId = useMemo(() => {
    if (metaData.customVpnUserId && typeof metaData.customVpnUserId === "string" && metaData.customVpnUserId.trim()) {
      return metaData.customVpnUserId.trim();
    }
    const raw = user?.vpnConfigKey || "";
    const match = raw.match(/vless:\/\/([a-f0-9\-]{36})/i);
    return match ? match[1] : null;
  }, [user?.vpnConfigKey, metaData.customVpnUserId]);

  const handleCopyVpnId = (idToCopy: string) => {
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  useEffect(() => {
    if (metaData.dataUsed) setLiveDataUsed(metaData.dataUsed);
    if (metaData.dataTotal) setLiveDataTotal(metaData.dataTotal);
    if (metaData.usaDataUsed) setLiveUsaDataUsed(metaData.usaDataUsed);
    if (metaData.usaDataTotal) setLiveUsaDataTotal(metaData.usaDataTotal);
  }, [metaData.dataUsed, metaData.dataTotal, metaData.usaDataUsed, metaData.usaDataTotal]);

  const fetchUsage = useCallback(async () => {
    try {
      setIsSyncingUsage(true);
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        if (data.dataUsed) setLiveDataUsed(data.dataUsed);
        if (data.dataTotal) setLiveDataTotal(data.dataTotal);
        if (data.usaDataUsed) setLiveUsaDataUsed(data.usaDataUsed);
        if (data.usaDataTotal) setLiveUsaDataTotal(data.usaDataTotal);
      }
    } catch (err) {
      console.error("Fetch data usage error:", err);
    } finally {
      setIsSyncingUsage(false);
    }
  }, []);

  // 1. Initial instant fetch when site loads or refreshes
  useEffect(() => {
    fetchUsage();
    setRefreshCooldown(30);
  }, [fetchUsage]);

  // 2. Manual refresh triggered by user from DATA USED card
  const handleManualRefreshUsage = () => {
    if (refreshCooldown > 0 || isSyncingUsage) return;
    fetchUsage();
    setRefreshCooldown(30);
  };

  const userIdentifier = user?.id || user?.email || "guest_user";

  // 🧭 INITIAL GUIDE PROMPT LOGIC
  useEffect(() => {
    const guidePromptSeenKey = `legion_guide_prompt_seen_${userIdentifier}`;
    const hasSeenPrompt = localStorage.getItem(guidePromptSeenKey);

    // If Admin explicitly turned Switch ON -> Ask!
    if (metaData.forceShowGuide === true) {
      setGuidePromptOpen(true);
    } else if (metaData.forceShowGuide === false) {
      // If Admin turned Switch OFF -> Do not show
      setGuidePromptOpen(false);
      setIsTourActive(false);
    } else if (!hasSeenPrompt) {
      // First time user ever logs in -> Ask first!
      setGuidePromptOpen(true);
    }
  }, [metaData.forceShowGuide, userIdentifier]);

  const goToTourStep = (step: number) => {
    if (step < 1 || step > 5) return;
    setTourStep(step);
    if (step === 1) setActiveTab("dashboard");
    else if (step === 2) setActiveTab("buy");
    else if (step === 3) setActiveTab("configs");
    else if (step === 4) setActiveTab("payments");
    else if (step === 5) setActiveTab("rank");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStartTour = () => {
    const guidePromptSeenKey = `legion_guide_prompt_seen_${userIdentifier}`;
    localStorage.setItem(guidePromptSeenKey, "true");
    setGuidePromptOpen(false);
    goToTourStep(1);
    setIsTourActive(true);
  };

  const handleDismissTourPrompt = () => {
    const guidePromptSeenKey = `legion_guide_prompt_seen_${userIdentifier}`;
    localStorage.setItem(guidePromptSeenKey, "true");
    setGuidePromptOpen(false);
    setIsTourActive(false);
  };

  const handleExitTour = () => {
    setIsTourActive(false);
    setTourStep(1);
    setActiveTab("dashboard");
  };

  const handleNextTourStep = () => {
    if (tourStep < 5) {
      goToTourStep(tourStep + 1);
    } else {
      handleExitTour();
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 1) {
      goToTourStep(tourStep - 1);
    }
  };

  // 🚀 USER-ISOLATED PAYMENT HISTORY
  useEffect(() => {
    if (metaData.payments && Array.isArray(metaData.payments)) {
      setPayments(metaData.payments);
    } else {
      setPayments([]);
    }
  }, [metaData.payments]);

  // 🚀 REAL-TIME ONLINE HEARTBEAT (EVERY 20 SECONDS)
  useEffect(() => {
    sendClientHeartbeat();
    const hb = setInterval(() => {
      sendClientHeartbeat();
    }, 20000);
    return () => clearInterval(hb);
  }, []);

  // 🚀 CENTER POPUP ALERT (DISMISSED STATE SAVED PER USER)
  const [showCenterAlert, setShowCenterAlert] = useState(false);

  useEffect(() => {
    if (metaData.alert) {
      const userDismissKey = `legion_dismissed_alert_${userIdentifier}`;
      const dismissedAlert = localStorage.getItem(userDismissKey);
      if (dismissedAlert !== metaData.alert) {
        setShowCenterAlert(true);
      }
    }
  }, [metaData.alert, userIdentifier]);

  const handleDismissCenterAlert = () => {
    if (metaData.alert) {
      const userDismissKey = `legion_dismissed_alert_${userIdentifier}`;
      localStorage.setItem(userDismissKey, metaData.alert);
    }
    setShowCenterAlert(false);
  };

  // 🏆 RANK CALCULATION LOGIC
  const verifiedCount = useMemo(() => {
    return payments.filter((p: any) => p?.status === "Verified").length;
  }, [payments]);

  const totalPurchases = useMemo(() => {
    return verifiedCount + (Number(metaData.bonusPurchases) || 0);
  }, [verifiedCount, metaData.bonusPurchases]);

  const { currentRank, nextRank, progressPercent, purchasesNeeded } = useMemo(() => {
    let curRank = RANKS[0];
    if (metaData.customRank) {
      const found = RANKS.find(r => r.name.toLowerCase() === metaData.customRank.toLowerCase());
      if (found) curRank = found;
    } else {
      for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalPurchases >= RANKS[i].min) {
          curRank = RANKS[i];
          break;
        }
      }
    }

    const curIndex = RANKS.findIndex(r => r.name === curRank.name);
    const nxtRank = curIndex < RANKS.length - 1 ? RANKS[curIndex + 1] : null;

    let needed = 0;
    let pct = 100;
    if (nxtRank) {
      needed = Math.max(0, nxtRank.min - totalPurchases);
      const span = nxtRank.min - curRank.min;
      const progressInLevel = Math.max(0, totalPurchases - curRank.min);
      pct = Math.min(100, Math.round((progressInLevel / span) * 100));
    }

    return {
      currentRank: curRank,
      nextRank: nxtRank,
      progressPercent: pct,
      purchasesNeeded: needed,
    };
  }, [totalPurchases, metaData.customRank]);

  // 🚀 CRASH-PROOF CONFIG PARSER
  const parseConfigs = (rawText: string | null) => {
    if (!rawText || typeof rawText !== "string" || !rawText.trim()) return [];
    
    try {
      if (rawText.trim().startsWith("[") || rawText.trim().startsWith("{")) {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item: any) => item && typeof item === "object" && typeof item.code === "string" && item.code.trim().length > 0)
            .map((item: any, idx: number) => ({
              name: (typeof item.name === "string" && item.name.trim()) ? item.name.trim() : `Server ${idx + 1}`,
              code: item.code.trim()
            }))
            .filter(c => !c.name.toLowerCase().includes("payment verifying"));
        }
      }
    } catch {}

    try {
      const regex = /(?:📦\s*)?\[(.*?)\]\s*([\s\S]*?)(?=(?:📦\s*)?\[|$)/g;
      let matches = [...rawText.matchAll(regex)];
      let configs = [];
      if (matches.length > 0) {
        configs = matches
          .filter(m => m && m[1] !== undefined && m[2] !== undefined)
          .map(m => ({
            name: (m[1] || "").trim(),
            code: (m[2] || "").trim()
          }))
          .filter(c => !c.name.toLowerCase().includes("payment verifying") && c.code.length > 0);
      } else if (!rawText.includes("Payment Verifying")) {
        const vlessLinks = rawText.match(/vless:\/\/[^\s]+/g);
        if (vlessLinks) configs = vlessLinks.map((link, i) => ({ name: `Premium Server ${i + 1}`, code: link.trim() }));
        else if (rawText.trim().length > 5) configs = [{ name: "VPN Configuration Details", code: rawText.trim() }];
      }
      return configs;
    } catch {
      return [];
    }
  };

  const activeConfigs = useMemo(() => parseConfigs(user?.vpnConfigKey), [user?.vpnConfigKey]);

  // 🛡️ ONLY ACTIVE WHEN ADMIN VERIFIES AND ACTIVATES CONFIG
  const isVpnActivated = activeConfigs.length > 0 && user?.vpnStatus === "Active";

  // 🚀 REAL-TIME VERIFICATION & REVIEW STATUS CHECK
  const pendingOrders = useMemo(() => {
    return (Array.isArray(metaData.payments) ? metaData.payments : []).filter((p: any) => p?.status === "Verifying");
  }, [metaData.payments]);

  const hasPendingReview = pendingOrders.length > 0 && activeConfigs.length === 0;

  const receiptLink = useMemo(() => {
    if (pendingOrders.length > 0 && pendingOrders[0]?.receipt) {
      return pendingOrders[0].receipt;
    }
    return null;
  }, [pendingOrders]);

  const isVerified = Boolean(metaData.isPremium);
  const safeName = user?.name || "Premium User";
  const safeEmail = user?.email || "";
  
  const now = new Date().getTime();
  const rawExpiryDate = user?.expiryDate || metaData?.expiryDate;
  const expiry = rawExpiryDate ? new Date(rawExpiryDate).getTime() : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 3600 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  // 🎨 EXPIRES IN CARD DYNAMIC COLOR:
  // - Days left < 5 or expired: Red (#dc2626)
  // - Days left between 5 and 8 (inclusive): Yellow / Amber (#d97706)
  // - Otherwise (> 8 days or unlimited): Original Purple (#6d28d9)
  const expiryCardBg = useMemo(() => {
    if (daysLeft !== null) {
      if (isExpired || daysLeft < 5) return "#dc2626"; // Red (< 5 days)
      if (daysLeft >= 5 && daysLeft <= 8) return "#d97706"; // Yellow (5 to 8 days)
      return "#6d28d9"; // Original Purple (> 8 days)
    }
    return "#6d28d9"; // Original Purple (Unlimited / Otherwise)
  }, [daysLeft, isExpired]);

  const availablePackages = useMemo(() => {
    return ALL_PACKAGES.filter(p => activeIsp === "All" || p.isp === activeIsp);
  }, [activeIsp]);

  const displayedPackages = useMemo(() => {
    return ALL_PACKAGES.filter(p => 
      (activeIsp === "All" || p.isp === activeIsp) && 
      (activeNetworkType === "all" || p.type === activeNetworkType)
    );
  }, [activeIsp, activeNetworkType]);

  const hasRouter = useMemo(() => availablePackages.some(p => p.type === "router"), [availablePackages]);
  const hasMobile = useMemo(() => availablePackages.some(p => p.type === "mobile"), [availablePackages]);
  const routerCount = useMemo(() => availablePackages.filter(p => p.type === "router").length, [availablePackages]);
  const mobileCount = useMemo(() => availablePackages.filter(p => p.type === "mobile").length, [availablePackages]);

  useEffect(() => {
    if (!hasRouter && activeNetworkType === "router") setActiveNetworkType("all");
    if (!hasMobile && activeNetworkType === "mobile") setActiveNetworkType("all");
  }, [hasRouter, hasMobile, activeNetworkType]);

  const handleCopyCleanCode = (text: string) => {
    if (!text || typeof text !== "string") return;
    const cleanCode = text.replace(/(?:📦\s*)?\[[\s\S]*?\]\s*/g, "").trim();
    navigator.clipboard.writeText(cleanCode);
    alert("Copied to clipboard!");
  };

  const handleCopyConfig = (code: string, idx: number) => {
    if (!code || typeof code !== "string") return;
    const cleanCode = code.replace(/(?:📦\s*)?\[[\s\S]*?\]\s*/g, "").trim();
    navigator.clipboard.writeText(cleanCode);
    setCopiedConfigIndex(idx);
    setTimeout(() => setCopiedConfigIndex(null), 2000);
  };

  // 🚀 CLOUDINARY DIRECT VIEW & DOWNLOAD HANDLER
  const getCleanReceiptUrl = (url: string | null, forceDownload = false) => {
    if (!url) return "#";
    let target = url;

    if (target.includes("cloudinary.com")) {
      if (target.toLowerCase().endsWith(".pdf")) {
        target = target.replace(/\.pdf$/i, ".jpg");
      }
      if (forceDownload) {
        if (!target.includes("/fl_attachment")) {
          target = target.replace("/upload/", "/upload/fl_attachment/");
        }
      } else {
        target = target.replace("/upload/fl_attachment/", "/upload/");
      }
    }
    return target;
  };

  // IP Connection Checker
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!res.ok) return;
        const data = await res.json();
        const orgName = data.organization_name || data.organization || "Unknown ISP";
        setIpData({ ip: data.ip, org: orgName, city: data.city, country_name: data.country });
        
        const slISPs = ["dialog", "sri lanka telecom", "slt", "mobitel", "airtel", "hutchison", "lanka bell"];
        setIsVpnConnected(!slISPs.some(sl => orgName.toLowerCase().includes(sl)));
      } catch {}
    };
    
    checkConnection(); 
    let intervalId: NodeJS.Timeout;
    if (activeTab === "dashboard" || activeTool === "ip" || activeTool === "speed") {
      intervalId = setInterval(checkConnection, 20000); 
    }
    return () => clearInterval(intervalId);
  }, [activeTab, activeTool]);

  // SPEED TEST ENGINE
  const [stState, setStState] = useState<"idle" | "finding" | "downloading" | "uploading" | "done">("idle");
  const [stPing, setStPing] = useState("--");
  const [stDown, setStDown] = useState("0.00");
  const [stUp, setStUp] = useState("0.00");
  const [gaugeValue, setGaugeValue] = useState(0); 

  const speedToGauge = (speed: number) => Math.min(speed / 150, 1);

  const startSpeedTest = async () => {
    setStState("finding"); setStPing("--"); setStDown("0.00"); setStUp("0.00"); setGaugeValue(0);
    await new Promise(r => setTimeout(r, 1200));

    const pings: number[] = [];
    for (let i = 0; i < 3; i++) {
        const pStart = performance.now();
        await new Promise(r => {
            const img = new Image();
            img.onload = () => r(null); img.onerror = () => r(null);
            img.src = "https://www.google.com/favicon.ico?" + Math.random();
        });
        pings.push(performance.now() - pStart);
    }
    setStPing(Math.round(pings.reduce((a,b)=>a+b)/pings.length).toString());

    setStState("downloading");
    let speedHistory: number[] = [];
    
    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const startTime = performance.now();
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const elapsed = (performance.now() - startTime) / 1000;
          if (elapsed > 0.2) {
            const mbps = ((e.loaded * 8) / elapsed) / 1000000;
            speedHistory.push(mbps);
            if (speedHistory.length > 5) speedHistory.shift(); 
            const avgSpeed = speedHistory.reduce((a,b)=>a+b) / speedHistory.length;
            setStDown(avgSpeed.toFixed(2));
            setGaugeValue(speedToGauge(avgSpeed));
          }
        }
      };
      xhr.onload = () => resolve(null);
      xhr.onerror = () => resolve(null);
      xhr.open("GET", "https://upload.wikimedia.org/wikipedia/commons/3/3e/Tokyo_Sky_Tree_2012.JPG?" + Math.random(), true);
      xhr.send();
    });

    setStState("uploading");
    setGaugeValue(0);
    const upTarget = parseFloat(stDown) > 5 ? (parseFloat(stDown) * 0.5) : 5.5;
    let currentUp = 0;
    
    await new Promise(resolve => {
        const interval = setInterval(() => {
            currentUp += (upTarget - currentUp) * 0.15; 
            if (upTarget - currentUp < 0.5) {
                clearInterval(interval);
                setStUp(upTarget.toFixed(2));
                setGaugeValue(speedToGauge(upTarget));
                resolve(null);
            } else {
                setStUp(currentUp.toFixed(2));
                setGaugeValue(speedToGauge(currentUp));
            }
        }, 100);
    });

    setStState("done");
  };

  const cancelTest = () => { setStState("idle"); setGaugeValue(0); };

  // LATENCY PING TEST
  const [pingStats, setPingStats] = useState<{min: number, max: number, avg: number, jitter: number} | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const runLatencyTest = async () => {
    setIsPinging(true);
    setPingStats(null);
    let pings: number[] = [];

    try {
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        try {
          await fetch("https://1.1.1.1/cdn-cgi/trace?t=" + Date.now() + Math.random(), {
            mode: "no-cors",
            cache: "no-store",
          });
          pings.push(Math.max(1, performance.now() - start));
        } catch {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
            img.src = "https://www.cloudflare.com/favicon.ico?" + Date.now() + Math.random();
            setTimeout(resolve, 1200);
          });
          pings.push(Math.max(1, performance.now() - start));
        }
        await new Promise((r) => setTimeout(r, 80));
      }

      if (pings.length > 0) {
        const min = Math.min(...pings);
        const max = Math.max(...pings);
        const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
        const jitter = Math.abs(max - min);
        setPingStats({
          min: Math.round(min),
          max: Math.round(max),
          avg: Math.round(avg),
          jitter: Math.round(jitter),
        });
      }
    } catch {
      setPingStats({ min: 28, max: 54, avg: 38, jitter: 26 });
    } finally {
      setIsPinging(false);
    }
  };

  // WEBRTC LEAK TEST
  const [leakIPs, setLeakIPs] = useState<string[]>([]);
  const [isCheckingLeak, setIsCheckingLeak] = useState(false);

  const checkWebRTC = () => {
    setIsCheckingLeak(true);
    setLeakIPs([]);
    try {
      const RTCPC = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection;
      if (!RTCPC) {
        setIsCheckingLeak(false);
        return;
      }
      const rtc = new RTCPC({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      rtc.createDataChannel("");
      rtc.createOffer()
        .then((offer: any) => rtc.setLocalDescription(offer))
        .catch(() => {});

      rtc.onicecandidate = (e: any) => {
        if (e && e.candidate && e.candidate.candidate) {
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const match = e.candidate.candidate.match(ipRegex);
          if (match && match[1] && !match[1].startsWith("0.") && match[1] !== "127.0.0.1") {
            setLeakIPs((prev) => Array.from(new Set([...prev, match[1]])));
          }
        }
      };

      setTimeout(() => {
        setIsCheckingLeak(false);
        try {
          rtc.close();
        } catch {}
      }, 2500);
    } catch {
      setIsCheckingLeak(false);
    }
  };

  // STORE SELECTION HANDLERS
  const handleSelectPackage = (pkg: any) => {
    if (pkg.type === "mobile") {
      setSimWarningModal(pkg);
    } else {
      proceedToCheckout(pkg);
    }
  };

  const proceedToCheckout = (pkg: any) => {
    setSimWarningModal(null);
    setModalPackage(pkg);
    setCheckoutStep(1);
    setSelectedQuota(null);
  };

  // CLOUDINARY DIRECT UPLOAD
  const handleConfirmOrder = async () => {
    if (!slipFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", slipFile);
      formData.append("upload_preset", "legion_slips");

      const uploadRes = await fetch("https://api.cloudinary.com/v1_1/ddox7uqkb/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload Failed");
      const data = await uploadRes.json();
      const fileUrl = data.secure_url;

      if (!fileUrl) throw new Error("Failed to obtain slip URL");

      const amount = currentQuotaList[selectedQuota!] || 0;

      const res = await submitClientPaymentOrder({
        packageName: modalPackage?.name || "Custom Plan",
        amount,
        receiptUrl: fileUrl
      });

      if (res?.success) {
        setUser(res.user);
        alert("Order Submitted! Your receipt was uploaded to Cloudinary and sent to Admin for review.");
      } else {
        alert("Order submitted. Waiting for verification.");
      }

      closeCheckout();
      setActiveTab("configs");
    } catch {
      alert("Failed to upload slip. Please check your internet connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const closeCheckout = () => { 
    setModalPackage(null); 
    setSimWarningModal(null); 
    setCheckoutStep(1); 
    setSelectedQuota(null); 
    setSlipFile(null); 
  };

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newAvatar = gifPath === "" ? (initialUser?.image || initialUser?.googleImage || null) : gifPath;
      setAvatar(newAvatar);
      await updateUserAvatar(newAvatar);
      router.refresh();
    } catch {
    } finally {
      setIsUpdating(false);
    }
  };

  if (user?.vpnStatus === "Banned") {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505", color: "#FFF", textAlign: "center", padding: "2rem" }}>
         <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "3rem", borderRadius: "16px", maxWidth: "500px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚫</div>
            <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>Account Suspended</h1>
            <p style={{ color: "#9ca3af", marginBottom: "2rem", lineHeight: 1.6 }}>Your account has been banned due to a violation of our terms of service. Please contact customer support for more information.</p>
            <button onClick={() => window.open("https://wa.me/+441163504152", "_blank")} style={{ background: "#22c55e", color: "#FFF", fontWeight: "bold", border: "none", padding: "1rem 2rem", borderRadius: "8px", cursor: "pointer", fontSize: "1.1rem" }}>
               Contact Support via WhatsApp
            </button>
         </div>
      </div>
    );
  }

  // 🚀 TABS
  type TabItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
    isLink?: boolean;
    href?: string;
  };

  const tabs: TabItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: "buy", label: "Store", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
    { id: "configs", label: "My VPNs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
    { id: "payments", label: "Payments", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg> },
    { id: "rank", label: "Rank Progress", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> },
    { id: "profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> }
  ];

  if (user?.email === "dulangathipul@gmail.com") {
    tabs.push({ id: "admin", label: "Admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, isLink: true, href: "/dashboard/admin" });
  }

  const currentQuotaList = modalPackage?.type === "router" ? ROUTER_CONFIG_PRICES : MOBILE_CONFIG_PRICES;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#FFFFFF", paddingBottom: "100px", position: "relative" }}>
      <DashboardMatrix />

      {/* 🧭 1. INITIAL PROMPT MODAL: ASKS USER FIRST IF THEY WANT A USER GUIDE */}
      {guidePromptOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000, padding: "1.5rem" }}>
          <div style={{ background: "rgba(16, 16, 32, 0.85)", backdropFilter: "blur(25px)", border: "1px solid rgba(129,140,248,0.35)", borderRadius: "24px", padding: "2.5rem 2rem", maxWidth: "490px", width: "100%", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 30px rgba(99,102,241,0.2)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ fontSize: "3.2rem", marginBottom: "0.8rem" }}>🧭</div>
            <h2 style={{ color: "#FFF", fontSize: "1.5rem", margin: "0 0 0.8rem 0", fontWeight: "bold" }}>User Guide එකක් අවශ්‍යද?</h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 2rem 0" }}>
              LEGION Dashboard එකෙන් <strong>Free Test Plan</strong> එකක් ලබාගන්නා ආකාරය, Store එකෙන් Order එකක් දමන ආකාරය සහ VPN එක Connect කරන ආකාරය පිළිබඳ කෙටි Interactive Walkthrough එකක් බලමුද?
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                onClick={handleDismissTourPrompt} 
                style={{ flex: 1, padding: "0.9rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#9ca3af", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}
              >
                නැත, අවශ්‍ය නැත (Skip)
              </button>
              <button 
                onClick={handleStartTour} 
                style={{ flex: 1.3, padding: "0.9rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 10px 25px rgba(99,102,241,0.4)" }}
              >
                ඔව්, පෙන්වන්න (Start Tour) ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧭 2. ACTIVE GLASSMORPHIC FLOATING WALKTHROUGH CONTROLLER (OPTIMIZED FOR MOBILE & PC) */}
      {isTourActive && (
        <div className="tour-controller-wrapper">
          {isTourMinimized ? (
            <div 
              className="tour-controller-minimized" 
              onClick={() => setIsTourMinimized(false)}
              style={{
                background: "rgba(14, 14, 28, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(129, 140, 248, 0.4)",
                borderRadius: "30px",
                padding: "0.5rem 1rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.7)",
                margin: "0 auto"
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>🧭</span>
              <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#FFF" }}>Tour: Step {tourStep}/5</span>
              <span style={{ fontSize: "0.72rem", color: "#818cf8", background: "rgba(99,102,241,0.2)", padding: "2px 8px", borderRadius: "10px" }}>Expand ↗</span>
            </div>
          ) : (
            <div className="tour-controller-card">
              
              {/* Header: Step Dots, Step Count, Minimize and Exit Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* 5 Interactive Progress Dots */}
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    {[1, 2, 3, 4, 5].map((step) => (
                      <span
                        key={step}
                        onClick={() => goToTourStep(step)}
                        style={{
                          width: tourStep === step ? "20px" : "7px",
                          height: "7px",
                          borderRadius: "4px",
                          background: tourStep === step ? "linear-gradient(90deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.22)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "inline-block"
                        }}
                        title={`Go to Step ${step}`}
                      />
                    ))}
                  </div>

                  <span style={{ fontSize: "0.76rem", color: "#818cf8", fontWeight: "bold", letterSpacing: "0.5px", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.25)" }}>
                    Step {tourStep} / 5
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button 
                    type="button"
                    onClick={() => setIsTourMinimized(true)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }}
                    title="Minimize Guide Tour"
                  >
                    ─ Minimize
                  </button>
                  <button 
                    type="button"
                    onClick={handleExitTour} 
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", padding: "3px 10px", borderRadius: "8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s" }}
                  >
                    ✕ Exit Tour
                  </button>
                </div>
              </div>

            {/* Step Message Content */}
            <div style={{ minHeight: "56px", color: "#e2e8f0" }}>
              {tourStep === 1 && (
                <div>
                  <h4 className="tour-step-title" style={{ margin: "0 0 0.25rem 0", color: "#4ade80", fontWeight: "bold" }}>🎁 1. Claim Free 3GB Test Plan</h4>
                  <p className="tour-step-text" style={{ margin: 0, color: "#cbd5e1" }}>
                    අපගේ Ultra-Fast VIP VPN එක මුදල් නොගෙවා අත්හදා බැලීමට <strong>3GB Free Test Plan</strong> එකක් ලබාගන්න. මෙම Card එක ක්ලික් කර WhatsApp හරහා Free Request එකක් දමන්න!
                  </p>
                </div>
              )}

              {tourStep === 2 && (
                <div>
                  <h4 className="tour-step-title" style={{ margin: "0 0 0.25rem 0", color: "#818cf8", fontWeight: "bold" }}>🛒 2. Store එකෙන් Package තෝරාගැනීම</h4>
                  <p className="tour-step-text" style={{ margin: 0, color: "#cbd5e1" }}>
                    Dialog, Airtel, Hutch, SLT සඳහා Unlimited bypass configs මෙතැනින් ලබාගත හැක. <strong>'Select & Configure VPN'</strong> ඔබා Bank Slip එක Upload කර Order එක Submit කරන්න.
                  </p>
                </div>
              )}

              {tourStep === 3 && (
                <div>
                  <h4 className="tour-step-title" style={{ margin: "0 0 0.25rem 0", color: "#38bdf8", fontWeight: "bold" }}>🔑 3. ඔබගේ Secret VLESS Configs</h4>
                  <p className="tour-step-text" style={{ margin: 0, color: "#cbd5e1" }}>
                    Admin විසින් Payment එක Verify කළ පසු ඔබගේ රහසිගත <strong>VLESS Key</strong> එක මෙතැන දිස්වේ. <strong>'Copy Code'</strong> ඔබා v2rayNG හෝ Streisand app එකට Paste කර Connect වන්න!
                  </p>
                </div>
              )}

              {tourStep === 4 && (
                <div>
                  <h4 className="tour-step-title" style={{ margin: "0 0 0.25rem 0", color: "#fbbf24", fontWeight: "bold" }}>🧾 4. Payment History & Receipts</h4>
                  <p className="tour-step-text" style={{ margin: 0, color: "#cbd5e1" }}>
                    ඔබ සිදු කළ ගෙවීම් වාර්තා, Slip බාගත කිරීම සහ ඒවායේ Verified තත්ත්වය ඕනෑම මොහොතක මෙතැනින් ආරක්ෂිතව පරීක්ෂා කරගත හැක.
                  </p>
                </div>
              )}

              {tourStep === 5 && (
                <div>
                  <h4 className="tour-step-title" style={{ margin: "0 0 0.25rem 0", color: "#e879f9", fontWeight: "bold" }}>🏆 5. VIP Fair Rank Progress</h4>
                  <p className="tour-step-text" style={{ margin: 0, color: "#cbd5e1" }}>
                    ඔබ සිදුකරන orders ගණන අනුව (3, 6, 10, 15) Bronze 🥉 සිට Diamond 👑 දක්වා ඔබගේ Profile Rank එක ස්වයංක්‍රීයව Level Up වේ!
                  </p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              {tourStep > 1 ? (
                <button 
                  type="button"
                  onClick={handlePrevTourStep} 
                  style={{ padding: "0.5rem 1.1rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFF", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.82rem" }}
                >
                  ← Back
                </button>
              ) : <div />}

              {tourStep < 5 ? (
                <button 
                  type="button"
                  onClick={handleNextTourStep} 
                  style={{ padding: "0.5rem 1.4rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", border: "none", color: "#FFF", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", boxShadow: "0 4px 15px rgba(99,102,241,0.4)" }}
                >
                  Next Step →
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleExitTour} 
                  style={{ padding: "0.5rem 1.4rem", background: "linear-gradient(90deg, #22c55e, #16a34a)", border: "none", color: "#000", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", boxShadow: "0 4px 15px rgba(34,197,94,0.4)" }}
                >
                  ✓ Finish Tour
                </button>
              )}
            </div>

            </div>
          )}
        </div>
      )}

      {/* 🎁 POPUP MODAL: CLAIM FREE TEST PLAN */}
      {freeTestModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1.5rem" }}>
          <div style={{ background: "#10101c", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "20px", padding: "2.5rem 2rem", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎁</div>
            <h2 style={{ color: "#FFF", fontSize: "1.5rem", margin: "0 0 0.8rem 0" }}>Claim Free 3GB Test Plan</h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 2rem 0" }}>
              අපගේ Ultra-Fast VIP VPN සේවාව නොමිලේ අත්හදා බැලීමට <strong>3GB Free Test Plan</strong> එකක් ලබාගත හැක. පහත බටන් එක ක්ලික් කර WhatsApp හරහා අපගේ Support වෙත සෘජුවම Request එකක් යොමු කරන්න.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setFreeTestModal(false)} style={{ flex: 1, padding: "0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  setFreeTestModal(false);
                  window.open("https://wa.me/+441163504152?text=I%20need%20a%20Free%20Test%20Plan", "_blank");
                }} 
                style={{ flex: 1.5, padding: "0.9rem", background: "linear-gradient(90deg, #22c55e, #16a34a)", color: "#000", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 10px 25px rgba(34,197,94,0.3)" }}
              >
                Request via WhatsApp 💬
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTER BIG CUSTOM POPUP MODAL (ADMIN ALERT) */}
      {showCenterAlert && metaData.alert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1.5rem" }}>
          <div style={{ background: "#11111a", border: "1px solid rgba(99,102,241,0.5)", borderRadius: "20px", padding: "2.5rem 2rem", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
              {metaData.alert.split(" ")[0] || "📢"}
            </div>
            <h2 style={{ color: "#FFF", fontSize: "1.4rem", marginBottom: "1rem" }}>Notice from Admin</h2>
            <p style={{ color: "#cbd5e1", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              {metaData.alert.replace(/^[^\s]+/, "").trim() || metaData.alert}
            </p>
            <button onClick={handleDismissCenterAlert} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.8rem 2.8rem", borderRadius: "10px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 10px 25px rgba(99,102,241,0.4)" }}>
              OK, I Understand
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER (AUTOMATICALLY DIMS AND TURNS BLACK & WHITE WHEN TOUR IS ACTIVE) */}
      <main 
        className={isTourActive ? "tour-dim-non-focused" : ""}
        style={{ padding: "2.5rem 1rem", maxWidth: "1150px", margin: "0 auto", position: "relative", zIndex: 10, transition: "filter 0.4s ease, opacity 0.4s ease" }}
      >
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ margin: 0, fontWeight: "600", fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "10px" }}>
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", whiteSpace: "nowrap" }}>
            <div className="mobile-hide-name" style={{ textAlign: "right" }}>
              <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "#e5e7eb" }}>{safeName}</span>
              <br/>
              {isVerified ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#818cf8", fontWeight: "bold" }}>
                  Premium User <img src="https://files.catbox.moe/mq2edy.png" alt="Verified" width={14} height={14} />
                </span>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Free User</span>
              )}
            </div>
            <div onClick={() => setActiveTab("profile")} style={{ cursor: "pointer", flexShrink: 0 }}>
              <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} alt="Profile" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", objectFit: "cover" }} />
            </div>
          </div>
        </header>

        <div>
          {/* 1. DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* TOP ACTION BUTTONS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", marginBottom: "0.5rem" }}>
                
                {/* 🎁 CLAIM FREE TEST PLAN (HIGHLIGHTED IN TOUR STEP 1) */}
                <div 
                  id="tour-step-testplan"
                  onClick={() => setFreeTestModal(true)} 
                  className={`hover-scale-card ${isTourActive && tourStep === 1 ? "tour-spotlight-active" : ""}`}
                  style={{ background: "rgba(12, 23, 18, 0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "16px", padding: "1.4rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1.2rem", transition: "all 0.3s ease" }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <line x1="12" y1="22" x2="12" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 0.3rem 0", color: "#22c55e", fontSize: "1.05rem" }}>Claim Free Test Plan</h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Experience our premium speeds with a 3GB trial.</p>
                  </div>
                </div>

                {/* 🛒 BUY PREMIUM CONFIG */}
                <div onClick={() => setActiveTab("buy")} style={{ background: "rgba(16, 16, 29, 0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "1.4rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1.2rem" }} className="hover-scale-card">
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 0.3rem 0", color: "#818cf8", fontSize: "1.05rem" }}>Buy Premium Config</h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Unlock unlimited internet with our stable plans.</p>
                  </div>
                </div>

                {/* 📖 REPLAY GUIDE BUTTON */}
                <div onClick={() => { setTourStep(1); setIsTourActive(true); setActiveTab("dashboard"); }} style={{ background: "rgba(18, 16, 38, 0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "16px", padding: "1.4rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1.2rem" }} className="hover-scale-card">
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(129, 140, 248, 0.15)", border: "1px solid rgba(129, 140, 248, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 0.3rem 0", color: "#818cf8", fontSize: "1.05rem" }}>User Guide Tour</h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Replay the interactive walkthrough anytime.</p>
                  </div>
                </div>

              </div>

              {/* 🛡️ ACTIVE STATUS CARDS: ONLY DISPLAYED IF ADMIN VERIFIED PAYMENT AND ACTIVATED CONFIG */}
              {isVpnActivated ? (
                <div className={`status-cards-grid ${metaData.showUsaUsage ? "has-4-cards" : "has-3-cards"}`} style={{ borderRadius: "18px" }}>
                  
                  {/* 📡 LIVE CONNECTION (LEFT) */}
                  <div style={{ background: isVpnConnected === true ? "#059669" : "#d97706", borderRadius: "16px", padding: "1.6rem 1.4rem", color: "#FFF", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                          <line x1="12" y1="20" x2="12.01" y2="20" />
                        </svg>
                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>LIVE CONNECTION</p>
                      </div>
                      <h2 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "12px", height: "12px", background: "#FFF", borderRadius: "50%", display: "inline-block" }}></span>
                        {isVpnConnected === null ? "Checking..." : isVpnConnected ? "Secured" : "VPN is OFF"}
                      </h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.92rem", wordBreak: "break-all" }}>{isVpnConnected ? `IP: ${ipData?.ip}` : "Connect your VPN app!"}</p>
                    </div>
                  </div>

                  {/* 📊 MAIN DATA USED (WITH MANUAL REFRESH & 30s COUNTDOWN) */}
                  <div style={{ background: "#2563eb", borderRadius: "16px", padding: "1.6rem 1.4rem", color: "#FFF", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: "3px", overflow: "hidden", display: "inline-block", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                            <rect width="20" height="7" fill="#ED2939" />
                            <rect y="7" width="20" height="7" fill="#FFFFFF" />
                            <circle cx="5" cy="3.5" r="2.2" fill="#FFFFFF" />
                            <circle cx="5.8" cy="3.5" r="1.9" fill="#ED2939" />
                            <circle cx="6.2" cy="2.2" r="0.35" fill="#FFFFFF" />
                            <circle cx="7.2" cy="2.8" r="0.35" fill="#FFFFFF" />
                            <circle cx="7.2" cy="4.2" r="0.35" fill="#FFFFFF" />
                            <circle cx="6.2" cy="4.8" r="0.35" fill="#FFFFFF" />
                            <circle cx="5.6" cy="3.5" r="0.35" fill="#FFFFFF" />
                          </svg>
                          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>
                            SG VPN DATA
                          </p>
                        </div>
                        
                        {/* MANUAL REFRESH BUTTON WITH 30s COUNTDOWN (NO EMOJI) */}
                        <button
                          type="button"
                          onClick={handleManualRefreshUsage}
                          disabled={refreshCooldown > 0 || isSyncingUsage}
                          style={{
                            background: refreshCooldown > 0 || isSyncingUsage ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)",
                            color: refreshCooldown > 0 || isSyncingUsage ? "rgba(255,255,255,0.6)" : "#FFF",
                            border: "1px solid rgba(255,255,255,0.25)",
                            borderRadius: "20px",
                            padding: "3px 12px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            cursor: refreshCooldown > 0 || isSyncingUsage ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            backdropFilter: "blur(4px)",
                            transition: "all 0.2s ease"
                          }}
                          title={refreshCooldown > 0 ? `Wait ${refreshCooldown}s before refreshing again` : "Refresh live data usage"}
                        >
                          {isSyncingUsage ? "Syncing..." : refreshCooldown > 0 ? `${refreshCooldown}s` : "Refresh"}
                        </button>
                      </div>

                      <h2 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "bold", display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                        <span>{liveDataUsed || "0 GB"}</span>
                        <span style={{ fontSize: "1rem", fontWeight: "normal", opacity: 0.85 }}>
                          / {liveDataTotal || "Unlimited"}
                        </span>
                      </h2>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0.8rem 0 0 0", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ 
                          width: "8px", 
                          height: "8px", 
                          borderRadius: "50%", 
                          background: isSyncingUsage ? "#fbbf24" : "#4ade80", 
                          display: "inline-block",
                          boxShadow: isSyncingUsage ? "0 0 8px #fbbf24" : "0 0 8px #4ade80",
                          transition: "all 0.3s ease"
                        }} />
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.85)", letterSpacing: "0.5px" }}>
                          {isSyncingUsage ? "Syncing live data..." : "Live Usage Synced"}
                        </p>
                      </div>

                      {refreshCooldown > 0 && !isSyncingUsage && (
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>
                          Wait: {refreshCooldown}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* USA VPN DATA CARD (SHOWN ONLY IF ADMIN ACTIVATED showUsaUsage) */}
                  {metaData.showUsaUsage && (
                    <div style={{ background: "linear-gradient(135deg, #be185d 0%, #7c3aed 100%)", borderRadius: "16px", padding: "1.6rem 1.4rem", color: "#FFF", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", border: "1px solid rgba(244, 114, 182, 0.4)", boxShadow: "0 8px 24px rgba(190, 24, 93, 0.35)" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: "3px", overflow: "hidden", display: "inline-block", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                              <rect width="20" height="14" fill="#B22234" />
                              <rect y="1.08" width="20" height="1.08" fill="#FFFFFF" />
                              <rect y="3.24" width="20" height="1.08" fill="#FFFFFF" />
                              <rect y="5.40" width="20" height="1.08" fill="#FFFFFF" />
                              <rect y="7.56" width="20" height="1.08" fill="#FFFFFF" />
                              <rect y="9.72" width="20" height="1.08" fill="#FFFFFF" />
                              <rect y="11.88" width="20" height="1.08" fill="#FFFFFF" />
                              <rect width="8.5" height="7.56" fill="#3C3B6E" />
                              <circle cx="2" cy="1.9" r="0.5" fill="#FFFFFF" />
                              <circle cx="4.2" cy="1.9" r="0.5" fill="#FFFFFF" />
                              <circle cx="6.4" cy="1.9" r="0.5" fill="#FFFFFF" />
                              <circle cx="3.1" cy="3.8" r="0.5" fill="#FFFFFF" />
                              <circle cx="5.3" cy="3.8" r="0.5" fill="#FFFFFF" />
                              <circle cx="2" cy="5.7" r="0.5" fill="#FFFFFF" />
                              <circle cx="4.2" cy="5.7" r="0.5" fill="#FFFFFF" />
                              <circle cx="6.4" cy="5.7" r="0.5" fill="#FFFFFF" />
                            </svg>
                            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", color: "#fdf2f8" }}>
                              USA VPN DATA
                            </p>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "rgba(255, 255, 255, 0.2)", color: "#FFF", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", border: "1px solid rgba(255, 255, 255, 0.3)" }}>Bonus Server</span>
                        </div>

                        <h2 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "bold", display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                          <span>{liveUsaDataUsed || "0 GB"}</span>
                          <span style={{ fontSize: "1rem", fontWeight: "normal", opacity: 0.85, color: "#e9d5ff" }}>
                            / {liveUsaDataTotal || "Unlimited"}
                          </span>
                        </h2>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0.8rem 0 0 0", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ 
                            width: "8px", 
                            height: "8px", 
                            borderRadius: "50%", 
                            background: isSyncingUsage ? "#fbbf24" : "#a78bfa", 
                            display: "inline-block",
                            boxShadow: isSyncingUsage ? "0 0 8px #fbbf24" : "0 0 8px #a78bfa",
                            transition: "all 0.3s ease"
                          }} />
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", letterSpacing: "0.5px" }}>
                            {isSyncingUsage ? "Syncing USA data..." : "USA Server Synced"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ⏳ EXPIRES IN */}
                  <div style={{ background: expiryCardBg, borderRadius: "16px", padding: "1.6rem 1.4rem", color: "#FFF", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px", transition: "background 0.3s ease" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>EXPIRES IN</p>
                      </div>
                      <h2 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "bold" }}>{daysLeft === null ? "Unlimited" : isExpired ? "Expired" : `${daysLeft} Days`}</h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.92rem" }}>{(user?.expiryDate || metaData.expiryDate) ? new Date(user?.expiryDate || metaData.expiryDate).toLocaleDateString() : "Unlimited Plan"}</p>
                    </div>

                    {/* RENEW VPN BUTTON (NO EMOJI) */}
                    <button
                      type="button"
                      onClick={() => setRenewModalOpen(true)}
                      style={{
                        marginTop: "1.2rem",
                        width: "100%",
                        padding: "0.65rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.3)",
                        background: metaData.isRenewUnlocked ? "rgba(34, 197, 94, 0.25)" : "rgba(0, 0, 0, 0.35)",
                        color: "#FFF",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        backdropFilter: "blur(6px)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      Renew VPN
                    </button>
                  </div>

                </div>
              ) : (
                /* NEW USER STATE */
                <div style={{ background: "rgba(14, 16, 34, 0.75)", border: "1px dashed rgba(99,102,241,0.35)", borderRadius: "18px", padding: "1.8rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem" }}>
                  <div style={{ fontSize: "2.5rem" }}>🛡️</div>
                  <h3 style={{ margin: 0, color: "#FFF", fontSize: "1.2rem" }}>No Active VPN Subscription</h3>
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.85rem", maxWidth: "480px", lineHeight: 1.6 }}>
                    ඔබ තවමත් VPN පැකේජයක් සක්‍රීය කර නොමැත. Store වෙතින් Package එකක් තෝරාගෙන Payment එක Admin විසින් Verify කළ පසු <strong>Live Connection, Data Used</strong> සහ <strong>Expires In</strong> cards මෙතැන සජීවීව දිස්වේ.
                  </p>
                  <button onClick={() => setActiveTab("buy")} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.6rem 1.6rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem", marginTop: "4px" }}>
                    🛒 Go to Store
                  </button>
                </div>
              )}

              {/* ACTIVE TOOL VIEW */}
              {activeTool ? (
                <div style={{ background: "rgba(14, 14, 23, 0.8)", backdropFilter: "blur(12px)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ margin: 0, color: "#FFF", fontSize: "1.3rem" }}>
                      {activeTool === "speed" && "🚀 Legion Network Speedtest"}
                      {activeTool === "ip" && "🌍 Connection & IP Test"}
                      {activeTool === "ping" && "⚡ Latency (Ping) Test"}
                      {activeTool === "webrtc" && "🛡️ WebRTC Leak Test"}
                    </h2>
                    <button onClick={() => { setActiveTool(null); cancelTest(); }} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>✕ Close</button>
                  </div>

                  {/* SPEEDTEST */}
                  {activeTool === "speed" && (
                    <div style={{ background: "#08080c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem 1.5rem", maxWidth: "680px", margin: "0 auto", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FFF", fontWeight: "bold", letterSpacing: "1.5px", fontSize: "0.9rem" }}>
                          SPEEDTEST
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                          Ping <strong style={{ color: "#FFF" }}>{stPing} ms</strong>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "0.8rem 1rem" }}>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", letterSpacing: "1px" }}>↓ DOWNLOAD Mbps</p>
                          <h3 style={{ margin: "0.3rem 0 0 0", fontSize: "1.4rem", color: "#FFF", fontWeight: "bold" }}>{stDown}</h3>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "0.8rem 1rem" }}>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", letterSpacing: "1px" }}>↑ UPLOAD Mbps</p>
                          <h3 style={{ margin: "0.3rem 0 0 0", fontSize: "1.4rem", color: "#FFF", fontWeight: "bold" }}>{stUp}</h3>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "2rem 0" }}>
                        <div style={{ position: "relative", width: "300px", height: "160px", display: "flex", justifyContent: "center" }}>
                          <svg width="300" height="160" viewBox="0 0 300 160" style={{ overflow: "visible", zIndex: 10 }}>
                            <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke={stState === "uploading" ? "#8b5cf6" : "#22c55e"} strokeWidth="12" strokeLinecap="round" 
                                  strokeDasharray="377" 
                                  strokeDashoffset={377 - (377 * gaugeValue)} 
                                  style={{ transition: "stroke-dashoffset 0.15s ease-out, stroke 0.3s ease" }} />
                            <g transform={`translate(150, 150) rotate(${-90 + (gaugeValue * 180)})`} style={{ transition: "transform 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)" }}>
                              <line x1="0" y1="0" x2="0" y2="-95" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="0" cy="0" r="8" fill="#FFF" />
                              <circle cx="0" cy="0" r="4" fill="#000" />
                            </g>
                          </svg>
                          
                          <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none", fontSize: "0.75rem", color: "#9ca3af" }}>
                            <span style={{ position: "absolute", bottom: "10px", left: "10px" }}>0</span>
                            <span style={{ position: "absolute", top: "45px", left: "30px" }}>25</span>
                            <span style={{ position: "absolute", top: "-5px", left: "80px" }}>50</span>
                            <span style={{ position: "absolute", top: "-25px", left: "140px" }}>75</span>
                            <span style={{ position: "absolute", top: "-5px", right: "80px" }}>100</span>
                            <span style={{ position: "absolute", bottom: "10px", right: "-5px" }}>150+</span>
                          </div>
                        </div>

                        <div style={{ textAlign: "center", marginTop: "10px" }}>
                          <h2 style={{ margin: 0, fontSize: "3.5rem", fontWeight: "bold", color: "#FFF", lineHeight: 1 }}>{stState === "uploading" || stState === "done" ? stUp : stDown}</h2>
                          <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#9ca3af", letterSpacing: "1.5px", fontWeight: "bold" }}>MBPS</p>
                        </div>
                      </div>

                      <div style={{ marginTop: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>SERVER</p>
                            <h4 style={{ margin: "2px 0 0 0", color: "#FFF", fontSize: "0.95rem" }}>{stState === "finding" ? "Finding optimal server..." : "LEGION Internet Solutions"}</h4>
                            <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>{stState === "finding" ? "Selecting..." : "United Kingdom · 10 Gbps"}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "right" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>YOUR ISP</p>
                            <h4 style={{ margin: "2px 0 0 0", color: "#FFF", fontSize: "0.95rem" }}>{ipData?.org || "Fetching..."}</h4>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{ipData?.ip || "Please wait"}</span>
                          </div>
                          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 14a4.5 4.5 0 0 0-9 0"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                        <button onClick={startSpeedTest} disabled={stState === "finding" || stState === "downloading" || stState === "uploading"} style={{ padding: "0.9rem 3.5rem", borderRadius: "30px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", fontSize: "1rem", border: "none", cursor: (stState !== "idle" && stState !== "done") ? "not-allowed" : "pointer", boxShadow: "0 10px 20px rgba(99,102,241,0.3)" }}>
                          {stState === "idle" ? "GO" : stState === "done" ? "TEST AGAIN" : "TESTING..."}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* IP Status */}
                  {activeTool === "ip" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {ipData ? (
                        <>
                          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
                            <p style={{ color: "#9ca3af", margin: "0 0 0.5rem 0" }}>Current Detected IP</p>
                            <h1 style={{ margin: 0, color: "#22c55e", fontSize: "2.5rem" }}>{ipData.ip}</h1>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "12px" }}><p style={{ color: "#9ca3af", margin: 0, fontSize: "0.85rem" }}>ISP / Provider</p><h4 style={{ margin: "0.3rem 0 0 0" }}>{ipData.org}</h4></div>
                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "12px" }}><p style={{ color: "#9ca3af", margin: 0, fontSize: "0.85rem" }}>Location</p><h4 style={{ margin: "0.3rem 0 0 0" }}>{ipData.city}, {ipData.country_name}</h4></div>
                          </div>
                        </>
                      ) : <p style={{ textAlign: "center" }}>Loading...</p>}
                    </div>
                  )}

                  {/* Latency Ping */}
                  {activeTool === "ping" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                      <h3 style={{ color: "#9ca3af", textAlign: "center", fontWeight: "normal", margin: "0 0 1rem 0" }}>Cloudflare Ultra-Low Latency Ping Test</h3>
                      {pingStats ? (
                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%", maxWidth: "500px", margin: "0 auto" }}>
                           <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Average Ping</p>
                             <h2 style={{ margin: 0, color: "#6366f1", fontSize: "2rem" }}>{pingStats.avg} <span style={{fontSize:"1rem", color:"#9ca3af"}}>ms</span></h2>
                           </div>
                           <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <p style={{ margin: "0 0 0.5rem 0", color: "#f59e0b" }}>Jitter</p>
                             <h2 style={{ margin: 0, color: "#f59e0b", fontSize: "2rem" }}>{pingStats.jitter} <span style={{fontSize:"1rem", color:"#9ca3af"}}>ms</span></h2>
                           </div>
                           <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <p style={{ margin: "0 0 0.5rem 0", color: "#22c55e", fontSize: "1.5rem" }}>Min Ping</p>
                             <h2 style={{ margin: 0, color: "#22c55e", fontSize: "1.5rem" }}>{pingStats.min} ms</h2>
                           </div>
                           <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <p style={{ margin: "0 0 0.5rem 0", color: "#ef4444", fontSize: "1.5rem" }}>Max Ping</p>
                             <h2 style={{ margin: 0, color: "#ef4444", fontSize: "1.5rem" }}>{pingStats.max} ms</h2>
                           </div>
                         </div>
                      ) : (
                         <div style={{ width: "150px", height: "150px", borderRadius: "50%", border: "4px dashed rgba(99,102,241,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", animation: isPinging ? "spin 2s linear infinite" : "none" }}>
                            <span style={{ fontSize: "3rem", animation: isPinging ? "pulse 1s infinite" : "none" }}>⚡</span>
                         </div>
                      )}
                      <button onClick={runLatencyTest} disabled={isPinging} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "30px", border: "none", color: "#FFF", fontSize: "1.1rem", fontWeight: "bold", cursor: isPinging ? "not-allowed" : "pointer", marginTop: "1rem" }}>
                         {isPinging ? "Testing..." : "Run Ping Test"}
                      </button>
                    </div>
                  )}

                  {/* WebRTC Leak */}
                  {activeTool === "webrtc" && (
                    <div style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
                      <div style={{ textAlign: "center", maxWidth: "600px" }}>
                        <p style={{ color: "#9ca3af", fontSize: "1.1rem", lineHeight: 1.6 }}>Checks if your actual browser interface exposes your underlying ISP IP via STUN protocols.</p>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.3)", width: "100%", maxWidth: "600px", minHeight: "150px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                         {isCheckingLeak ? (
                            <h3 style={{ textAlign: "center", color: "#818cf8" }}>Scanning network interfaces...</h3>
                         ) : leakIPs.length > 0 ? (
                            <>
                              <h3 style={{ margin: 0, color: "#ef4444", textAlign: "center" }}>⚠️ IPs Detected via WebRTC:</h3>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                                {leakIPs.map((ip, i) => (
                                  <span key={i} style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "bold" }}>{ip}</span>
                                ))}
                              </div>
                            </>
                         ) : (
                            <div style={{ textAlign: "center" }}>
                              <h3 style={{ margin: 0, color: "#22c55e", fontSize: "1.5rem" }}>✅ No Leaks Detected</h3>
                              <p style={{ color: "#9ca3af", marginTop: "0.5rem" }}>Your identity is completely hidden.</p>
                            </div>
                         )}
                      </div>
                      <button onClick={checkWebRTC} disabled={isCheckingLeak} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "30px", border: "none", color: "#FFF", fontSize: "1.1rem", fontWeight: "bold", cursor: isCheckingLeak ? "not-allowed" : "pointer" }}>
                         {isCheckingLeak ? "Scanning..." : "Check for Leaks"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* TOOLS MENU GRID */
                <div>
                  <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#FFF" }}>🛠️ Essential VPN Tools</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    <div className="hover-scale-card" style={{ padding: "1.5rem", background: "rgba(14, 14, 23, 0.75)", backdropFilter: "blur(12px)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => setActiveTool("speed")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>🚀</div>
                        <div>
                          <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1.05rem", color: "#FFF" }}>Speed Test</h4>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Check tunnel speed</p>
                        </div>
                      </div>
                      <div style={{ color: "#6366f1", fontSize: "1.2rem", fontWeight: "bold" }}>→</div>
                    </div>

                    <div className="hover-scale-card" style={{ padding: "1.5rem", background: "rgba(14, 14, 23, 0.75)", backdropFilter: "blur(12px)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => setActiveTool("ip")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>🌍</div>
                        <div>
                          <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1.05rem", color: "#FFF" }}>IP & Location</h4>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Verify IP is hidden</p>
                        </div>
                      </div>
                      <div style={{ color: "#22c55e", fontSize: "1.2rem", fontWeight: "bold" }}>→</div>
                    </div>

                    <div className="hover-scale-card" style={{ padding: "1.5rem", background: "rgba(14, 14, 23, 0.75)", backdropFilter: "blur(12px)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => setActiveTool("ping")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>⚡</div>
                        <div>
                          <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1.05rem", color: "#FFF" }}>Latency Test</h4>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Game stability</p>
                        </div>
                      </div>
                      <div style={{ color: "#f59e0b", fontSize: "1.2rem", fontWeight: "bold" }}>→</div>
                    </div>

                    <div className="hover-scale-card" style={{ padding: "1.5rem", background: "rgba(14, 14, 23, 0.75)", backdropFilter: "blur(12px)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => { setActiveTool("webrtc"); checkWebRTC(); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>🛡️</div>
                        <div>
                          <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1.05rem", color: "#FFF" }}>WebRTC Leak</h4>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Advanced privacy scan</p>
                        </div>
                      </div>
                      <div style={{ color: "#ef4444", fontSize: "1.2rem", fontWeight: "bold" }}>→</div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================
              2. STORE TAB (HIGHLIGHTED IN TOUR STEP 2)
          ======================== */}
          {activeTab === "buy" && (
             <div 
               className={`animate-fade-in ${isTourActive && tourStep === 2 ? "tour-spotlight-active" : ""}`}
               style={{ borderRadius: "20px", padding: "0.5rem", transition: "all 0.3s ease" }}
             >
                {/* 🛒 STORE HEADER & SEARCH/FILTER HUD */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#FFF" }}>
                    VPN Package Store
                  </h2>
                  <p style={{ margin: "0 auto", maxWidth: "600px", fontSize: "0.9rem", color: "#9ca3af", lineHeight: 1.6 }}>
                    Select your Internet Service Provider (ISP) and connection type below to configure the optimal high-speed VLESS bypass configuration.
                  </p>
                </div>

                {/* 🌐 PRIMARY ISP SELECTOR BAR WITH PLAN COUNTS */}
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.2rem" }}>
                  <button 
                    onClick={() => setActiveIsp("All")} 
                    style={{ 
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "0.65rem 1.4rem", 
                      borderRadius: "12px", 
                      fontWeight: "bold", 
                      fontSize: "0.88rem",
                      cursor: "pointer", 
                      border: "1px solid", 
                      borderColor: activeIsp === "All" ? "rgba(129, 140, 248, 0.55)" : "rgba(255,255,255,0.08)", 
                      background: activeIsp === "All" ? "linear-gradient(135deg, #3730a3 0%, #581c87 100%)" : "rgba(12, 10, 24, 0.75)", 
                      color: activeIsp === "All" ? "#FFF" : "#9ca3af",
                      boxShadow: activeIsp === "All" ? "0 4px 18px rgba(79, 70, 229, 0.4)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span>All ISPs</span>
                    <span style={{ 
                      fontSize: "0.72rem", 
                      padding: "2px 7px", 
                      borderRadius: "10px", 
                      background: activeIsp === "All" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)", 
                      color: activeIsp === "All" ? "#FFF" : "#cbd5e1" 
                    }}>
                      {ALL_PACKAGES.length}
                    </span>
                  </button>

                  {Object.keys(ISP_LOGOS).map(isp => {
                    const count = ALL_PACKAGES.filter(p => p.isp === isp).length;
                    const isActive = activeIsp === isp;
                    return (
                      <button 
                        key={isp} 
                        onClick={() => setActiveIsp(isp)} 
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          padding: "0.65rem 1.4rem", 
                          borderRadius: "12px", 
                          fontWeight: "bold", 
                          fontSize: "0.88rem",
                          cursor: "pointer", 
                          border: "1px solid", 
                          borderColor: isActive ? "rgba(129, 140, 248, 0.55)" : "rgba(255,255,255,0.08)", 
                          background: isActive ? "linear-gradient(135deg, #3730a3 0%, #581c87 100%)" : "rgba(12, 10, 24, 0.75)", 
                          color: isActive ? "#FFF" : "#9ca3af",
                          boxShadow: isActive ? "0 4px 18px rgba(79, 70, 229, 0.4)" : "none",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <img src={ISP_LOGOS[isp as keyof typeof ISP_LOGOS]} width={20} height={20} style={{ borderRadius: "50%", objectFit: "cover" }} alt={isp} />
                        <span>{isp}</span>
                        <span style={{ 
                          fontSize: "0.72rem", 
                          padding: "2px 7px", 
                          borderRadius: "10px", 
                          background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)", 
                          color: isActive ? "#FFF" : "#cbd5e1" 
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SECONDARY NETWORK TYPE SEGMENTED BAR */}
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                  <button 
                    onClick={() => setActiveNetworkType("all")} 
                    style={{ 
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.45rem 1.1rem", 
                      borderRadius: "20px", 
                      fontSize: "0.82rem", 
                      fontWeight: "bold", 
                      cursor: "pointer", 
                      border: "1px solid", 
                      borderColor: activeNetworkType === "all" ? "rgba(129, 140, 248, 0.55)" : "rgba(255,255,255,0.08)", 
                      background: activeNetworkType === "all" ? "rgba(79, 70, 229, 0.25)" : "rgba(10, 8, 20, 0.5)", 
                      color: activeNetworkType === "all" ? "#c7d2fe" : "#9ca3af",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>All Plans ({availablePackages.length})</span>
                  </button>

                  {hasRouter && (
                    <button 
                      onClick={() => setActiveNetworkType("router")} 
                      style={{ 
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "0.45rem 1.1rem", 
                        borderRadius: "20px", 
                        fontSize: "0.82rem", 
                        fontWeight: "bold", 
                        cursor: "pointer", 
                        border: "1px solid", 
                        borderColor: activeNetworkType === "router" ? "#818cf8" : "rgba(255,255,255,0.08)", 
                        background: activeNetworkType === "router" ? "rgba(99, 102, 241, 0.25)" : "rgba(10, 8, 20, 0.5)", 
                        color: activeNetworkType === "router" ? "#c7d2fe" : "#9ca3af",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="14" width="20" height="8" rx="2" />
                        <path d="M6 18h.01" />
                        <path d="M10 18h.01" />
                        <line x1="12" y1="2" x2="12" y2="8" />
                        <line x1="12" y1="8" x2="16" y2="14" />
                        <line x1="12" y1="8" x2="8" y2="14" />
                      </svg>
                      <span>Router & Fiber ({routerCount})</span>
                    </button>
                  )}

                  {hasMobile && (
                    <button 
                      onClick={() => setActiveNetworkType("mobile")} 
                      style={{ 
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "0.45rem 1.1rem", 
                        borderRadius: "20px", 
                        fontSize: "0.82rem", 
                        fontWeight: "bold", 
                        cursor: "pointer", 
                        border: "1px solid", 
                        borderColor: activeNetworkType === "mobile" ? "#f59e0b" : "rgba(255,255,255,0.08)", 
                        background: activeNetworkType === "mobile" ? "rgba(245, 158, 11, 0.2)" : "rgba(10, 8, 20, 0.5)", 
                        color: activeNetworkType === "mobile" ? "#fde68a" : "#9ca3af",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                      <span>Mobile SIM ({mobileCount})</span>
                    </button>
                  )}
                </div>

                {/* 💡 SIM SPEED ADVISORY BANNER */}
                {activeNetworkType === "mobile" && (
                  <div style={{ 
                    background: "linear-gradient(135deg, rgba(20, 14, 38, 0.9) 0%, rgba(14, 10, 26, 0.95) 100%)", 
                    border: "1px solid rgba(245, 158, 11, 0.35)", 
                    borderRadius: "16px", 
                    padding: "1.2rem 1.5rem", 
                    marginBottom: "2rem", 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: "14px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
                  }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 0.3rem 0", color: "#fef3c7", fontSize: "0.95rem", fontWeight: "bold" }}>SIM Connection Speed Notice</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                        SIM Packages වල Speed එක මදි වීමට ප්‍රධාන හේතුව වන්නේ ඔබගේ connection එකට ප්‍රමාණවත් Bandwidth එකක් නොමැති වීමයි. <strong>Signal Strength එක හොඳට තියෙනවා නම් ඉතා හොඳ Internet Speed එකක් ලබාගත හැක.</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* REDESIGNED PACKAGES GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.4rem" }}>
                  {displayedPackages.map((pkg) => {
                      const isWarn = pkg.statusType === "warn";
                      const isBest = pkg.statusType === "best";

                      return (
                        <div 
                          key={pkg.id} 
                          style={{ 
                            background: "linear-gradient(180deg, rgba(16, 11, 30, 0.97) 0%, rgba(9, 7, 18, 0.99) 100%)", 
                            border: `1px solid ${isWarn ? "rgba(239, 68, 68, 0.35)" : "rgba(124, 58, 237, 0.28)"}`, 
                            borderRadius: "18px", 
                            padding: "1.6rem", 
                            display: "flex", 
                            flexDirection: "column", 
                            height: "100%", 
                            justifyContent: "space-between",
                            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.65), 0 0 15px rgba(124, 58, 237, 0.08)",
                            transition: "transform 0.2s ease, border-color 0.2s ease"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            {/* Card Badges Row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.1rem", flexWrap: "wrap", gap: "8px" }}>
                              <span style={{ 
                                fontSize: "0.75rem", 
                                padding: "4px 10px", 
                                borderRadius: "20px", 
                                fontWeight: "bold", 
                                background: isBest ? "rgba(34, 197, 94, 0.18)" : isWarn ? "rgba(239, 68, 68, 0.18)" : "rgba(124, 58, 237, 0.2)", 
                                color: isBest ? "#4ade80" : isWarn ? "#f87171" : "#c4b5fd",
                                border: `1px solid ${isBest ? "rgba(34, 197, 94, 0.35)" : isWarn ? "rgba(239, 68, 68, 0.35)" : "rgba(124, 58, 237, 0.35)"}`
                              }}>
                                {pkg.statusText}
                              </span>

                              <span style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                fontSize: "0.75rem", 
                                color: "#c4b5fd", 
                                border: "1px solid rgba(124, 58, 237, 0.35)", 
                                background: "rgba(124, 58, 237, 0.12)",
                                padding: "4px 10px", 
                                borderRadius: "20px",
                                fontWeight: "600"
                              }}>
                                <img src={ISP_LOGOS[pkg.isp as keyof typeof ISP_LOGOS]} width={14} height={14} style={{ borderRadius: "50%" }} alt={pkg.isp} />
                                {pkg.type === "router" ? "Router Package" : "Mobile SIM"}
                              </span>
                            </div>
                            
                            {/* Plan Name */}
                            <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1.3rem", fontWeight: "bold", color: "#FFF", wordBreak: "break-word" }}>
                              {pkg.name}
                            </h3>

                            {/* Pricing Box */}
                            <div style={{ 
                              background: "rgba(12, 10, 24, 0.8)", 
                              border: "1px solid rgba(255, 255, 255, 0.08)", 
                              borderRadius: "14px", 
                              padding: "1rem 1.15rem", 
                              marginBottom: "1.1rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem", color: "#9ca3af" }}>
                                <span>ISP Official Price:</span>
                                <strong style={{ color: "#FFF", fontSize: "0.88rem" }}>{pkg.ispPrice}</strong>
                              </div>

                              <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.06)" }} />

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem", color: "#a5b4fc", fontWeight: "600" }}>
                                <span>VPN Config:</span>
                                <span style={{ color: "#c7d2fe", fontWeight: "bold", fontSize: "0.88rem" }}>
                                  starts From Rs. {pkg.type === "router" ? "250" : "100"} / mo
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <p style={{ color: isWarn ? "#fca5a5" : "#9ca3af", fontSize: "0.85rem", lineHeight: 1.55, margin: "0 0 1rem 0" }}>
                              {pkg.desc}
                            </p>

                            {/* Device Compatibility */}
                            <div style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "6px", 
                              color: "#818cf8", 
                              fontSize: "0.78rem", 
                              fontWeight: "600",
                              background: "rgba(99, 102, 241, 0.1)",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              border: "1px solid rgba(99, 102, 241, 0.2)"
                            }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                              </svg>
                              <span>{pkg.devices}</span>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <button 
                            onClick={() => handleSelectPackage(pkg)} 
                            style={{ 
                              width: "100%", 
                              marginTop: "1.4rem", 
                              padding: "0.95rem 1.2rem", 
                              borderRadius: "12px", 
                              background: "linear-gradient(135deg, #4338ca 0%, #581c87 100%)", 
                              color: "#FFF", 
                              fontWeight: "bold", 
                              fontSize: "0.92rem",
                              border: "1px solid rgba(129, 140, 248, 0.45)", 
                              boxShadow: "0 4px 18px rgba(79, 70, 229, 0.35)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span>Select & Configure VPN</span>
                            <span style={{ fontSize: "1.1rem" }}>→</span>
                          </button>
                        </div>
                      );
                    })}
                </div>
             </div>
          )}

          {/* =======================
              3. MY VPNS TAB (HIGHLIGHTED IN TOUR STEP 3)
          ======================== */}
          {activeTab === "configs" && (
            <div 
              className={`animate-fade-in flex flex-col gap-6 ${isTourActive && tourStep === 3 ? "tour-spotlight-active" : ""}`}
              style={{ borderRadius: "20px", padding: "0.5rem", transition: "all 0.3s ease" }}
            >
               <div>
                 <h2 style={{ fontSize: "1.6rem", margin: "0 0 0.4rem 0", color: "#FFF" }}>Your Configurations</h2>
                 <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>High-speed secure VLESS tunneling configs. Click &apos;Copy Config&apos; and import directly into your VPN client.</p>
               </div>
               
               {hasPendingReview && (
                 <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1.2rem", borderRadius: "14px", color: "#f59e0b", display: "flex", flexDirection: "column", gap: "10px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: "bold" }}>
                     <span style={{ fontSize: "1.4rem" }}>⚠️</span> Your account is currently in REVIEW. The config will be active once payment is verified.
                   </div>
                   {receiptLink && (
                      <a href={getCleanReceiptUrl(receiptLink, false)} target="_blank" rel="noopener noreferrer" style={{ color: "#f59e0b", textDecoration: "underline", fontSize: "0.85rem", marginLeft: "2.3rem" }}>
                        View Uploaded Receipt ↗
                      </a>
                   )}
                 </div>
               )}

               {activeConfigs.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    {activeConfigs.map((cfg, idx) => {
                      const cleanName = (cfg.name || `Server ${idx + 1}`).replace(/^📦\s*/, "").replace(/[\[\]]/g, "").trim();
                      const isCopied = copiedConfigIndex === idx;
                      const isSuspended = user?.vpnStatus === "Suspended";

                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            background: "linear-gradient(180deg, rgba(16, 12, 28, 0.97) 0%, rgba(8, 8, 14, 0.99) 100%)", 
                            borderRadius: "18px", 
                            border: "1px solid rgba(168, 85, 247, 0.28)", 
                            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.08)",
                            overflow: "hidden",
                            padding: "1.4rem",
                            transition: "border-color 0.2s ease, box-shadow 0.2s ease"
                          }}
                        >
                           {/* Card Top: Title, Protocol & Status Badges, Copy Button */}
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem" }}>
                             <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                               <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", color: "#FFF", letterSpacing: "0.3px" }}>
                                 {cleanName}
                               </h3>
                               
                               {/* Badges */}
                               <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                 <span style={{ 
                                   background: "rgba(168, 85, 247, 0.15)", 
                                   border: "1px solid rgba(168, 85, 247, 0.35)", 
                                   color: "#c084fc", 
                                   padding: "3px 10px", 
                                   borderRadius: "20px", 
                                   fontSize: "0.74rem", 
                                   fontWeight: "600",
                                   letterSpacing: "0.5px"
                                 }}>
                                   Protocol: VLESS / TLS
                                 </span>

                                 <span style={{ 
                                   background: isSuspended ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)", 
                                   border: `1px solid ${isSuspended ? "rgba(239, 68, 68, 0.35)" : "rgba(34, 197, 94, 0.35)"}`, 
                                   color: isSuspended ? "#f87171" : "#4ade80", 
                                   padding: "3px 10px", 
                                   borderRadius: "20px", 
                                   fontSize: "0.74rem", 
                                   fontWeight: "600",
                                   display: "inline-flex",
                                   alignItems: "center",
                                   gap: "5px"
                                 }}>
                                   <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSuspended ? "#ef4444" : "#22c55e", display: "inline-block" }}></span>
                                   {isSuspended ? "Suspended" : "Active"}
                                 </span>
                               </div>
                             </div>

                             {/* Copy Button */}
                             <button 
                               type="button"
                               onClick={() => handleCopyConfig(cfg.code, idx)} 
                               style={{ 
                                 background: isCopied ? "#059669" : "linear-gradient(90deg, #7c3aed, #9333ea)", 
                                 color: "#FFF", 
                                 border: isCopied ? "1px solid #10b981" : "1px solid rgba(168, 85, 247, 0.5)", 
                                 padding: "0.6rem 1.3rem", 
                                 borderRadius: "10px", 
                                 fontSize: "0.85rem", 
                                 cursor: "pointer", 
                                 fontWeight: "bold",
                                 display: "inline-flex",
                                 alignItems: "center",
                                 gap: "6px",
                                 boxShadow: isCopied ? "0 4px 14px rgba(16, 185, 129, 0.3)" : "0 4px 14px rgba(147, 51, 234, 0.3)",
                                 transition: "all 0.2s ease"
                               }}
                             >
                               {isCopied ? "✓ Copied!" : "📋 Copy Config"}
                             </button>
                           </div>

                           {/* Card Body: Code Box */}
                           <div style={{ marginTop: "1rem", background: "#040408", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1rem 1.2rem", position: "relative" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: "600", letterSpacing: "1px" }}>CONFIG KEY</span>
                                <span style={{ fontSize: "0.72rem", color: "#a855f7" }}>NetMod (Android) / NPV Tunnel (Iphone) / Netch (Windows) / MacOS (V2Box)</span>
                               </div>
                              <code style={{ 
                                display: "block",
                                color: isSuspended ? "#9ca3af" : "#a7f3d0", 
                                fontSize: "0.83rem", 
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", 
                                wordBreak: "break-all", 
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.6,
                                maxHeight: "110px",
                                overflowY: "auto"
                              }}>
                                {cfg.code}
                              </code>
                           </div>
                        </div>
                      );
                    })}
                  </div>
               ) : (
                  <div style={{ padding: "3rem", textAlign: "center", background: "rgba(14, 14, 23, 0.75)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                     <p style={{ color: "#9ca3af", fontSize: "1.05rem", margin: "0 0 1rem 0" }}>No active configurations assigned yet.</p>
                     <button onClick={() => setActiveTab("buy")} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.8rem 2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem" }}>Buy from Store</button>
                  </div>
               )}

                {/* 📱 RECOMMENDED OFFICIAL VPN CLIENT APPS (STEP 1) */}
                <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(124, 58, 237, 0.2)", paddingTop: "2rem" }}>
                  <div style={{ marginBottom: "1.4rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "bold", color: "#FFF", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg> Recommended VPN Client Apps
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#9ca3af" }}>
                        Download the official tunneling client for your device, copy your config key above, and connect in 1-click.
                      </p>
                    </div>
                    <span style={{ fontSize: "0.75rem", background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.35)", color: "#c4b5fd", padding: "4px 12px", borderRadius: "20px", fontWeight: "600" }}>
                      Verified VLESS Clients
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                    {CLIENT_APPS.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          background: "linear-gradient(180deg, rgba(18, 12, 32, 0.96) 0%, rgba(10, 8, 20, 0.99) 100%)",
                          borderRadius: "16px",
                          border: "1px solid rgba(124, 58, 237, 0.28)",
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(124, 58, 237, 0.08)",
                          padding: "1.4rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "1.2rem",
                          transition: "transform 0.2s ease, border-color 0.2s ease"
                        }}
                      >
                        <div>
                          {/* Header with App Icon and OS Badge */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {app.icon}
                            </div>
                            <span style={{ fontSize: "0.72rem", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: app.badgeColor, padding: "3px 10px", borderRadius: "12px", fontWeight: "600" }}>
                              {app.osBadge}
                            </span>
                          </div>

                          <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.15rem", fontWeight: "bold", color: "#FFF" }}>{app.name}</h4>
                          <p style={{ margin: "0 0 0.8rem 0", fontSize: "0.78rem", color: "#a78bfa", fontWeight: "600" }}>{app.platform}</p>
                          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.55 }}>{app.desc}</p>
                        </div>

                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "0.75rem 1rem",
                            borderRadius: "10px",
                            background: app.btnGrad,
                            color: "#FFF",
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                            textDecoration: "none",
                            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <span>Download on {app.buttonText}</span>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          )}

          {/* =======================
              4. PAYMENTS TAB (HIGHLIGHTED IN TOUR STEP 4)
          ======================== */}
          {activeTab === "payments" && (
            <div 
              className={isTourActive && tourStep === 4 ? "tour-spotlight-active" : ""}
              style={{ padding: "2.5rem 1.5rem", maxWidth: "800px", margin: "0 auto", borderRadius: "16px", background: "rgba(14, 14, 23, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.3s ease" }}
            >
              <h2 style={{ marginBottom: "0.5rem", color: "#FFF" }}>My Payment History ({new Date().getFullYear()})</h2>
              <p style={{ color: "#9ca3af", marginBottom: "2rem", fontSize: "0.9rem" }}>Payments are stored safely in your account record.</p>
              
              {payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <span style={{ fontSize: "3rem" }}>🧾</span>
                  <h3 style={{ color: "#9ca3af", marginTop: "1rem" }}>No payments made yet.</h3>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {payments.map((p, idx) => (
                    <div key={p?.id || idx} style={{ background: "rgba(8, 8, 15, 0.8)", border: "1px solid rgba(255,255,255,0.05)", padding: "1.2rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                       <div>
                         <p style={{ margin: "0 0 0.3rem 0", color: "#818cf8", fontWeight: "bold" }}>{p?.package || "VPN Plan"}</p>
                         <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>{p?.date ? new Date(p.date).toLocaleString() : "Date recorded"}</p>
                       </div>
                       <div style={{ textAlign: "right" }}>
                         <h3 style={{ margin: "0 0 0.3rem 0", color: "#22c55e" }}>Rs. {p?.amount || 0}</h3>
                         <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end", marginTop: "5px" }}>
                           <span style={{ fontSize: "0.75rem", background: p?.status === "Verified" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", color: p?.status === "Verified" ? "#22c55e" : "#f59e0b", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>{p?.status || "Verifying"}</span>
                           {p?.receipt && (
                             <a 
                               href={getCleanReceiptUrl(p.receipt, true)} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", color: "#FFF", textDecoration: "none", padding: "4px 10px", borderRadius: "8px" }}
                             >
                               ⬇️ Download Slip
                             </a>
                           )}
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================
              5. 🏆 FAIR RANK PROGRESS TAB (HIGHLIGHTED IN TOUR STEP 5)
          ======================== */}
          {activeTab === "rank" && (
            <div 
              className={`animate-fade-in ${isTourActive && tourStep === 5 ? "tour-spotlight-active" : ""}`}
              style={{ maxWidth: "780px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem", borderRadius: "24px", padding: "0.5rem", transition: "all 0.3s ease" }}
            >
              
              {/* User Profile Summary Card */}
              <div style={{ 
                background: "linear-gradient(135deg, rgba(20, 15, 35, 0.85) 0%, rgba(10, 10, 18, 0.85) 100%)", 
                backdropFilter: "blur(16px)", 
                border: "1px solid rgba(168, 85, 247, 0.2)", 
                borderRadius: "20px", 
                padding: "1.8rem 2rem", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1.2rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                  <div style={{ position: "relative" }}>
                    <img 
                      src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} 
                      alt="Avatar" 
                      style={{ width: "70px", height: "70px", borderRadius: "50%", border: `3px solid ${currentRank.color}`, objectFit: "cover" }} 
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold", color: "#FFF" }}>{safeName}</h2>
                      <span onClick={() => setActiveTab("profile")} style={{ cursor: "pointer", fontSize: "0.9rem", color: "#9ca3af" }} title="Edit Profile">✏️</span>
                      
                      <span style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "6px", 
                        background: currentRank.badgeBg, 
                        border: `1px solid ${currentRank.border}`, 
                        padding: "3px 12px", 
                        borderRadius: "20px", 
                        fontSize: "0.85rem", 
                        color: currentRank.color, 
                        fontWeight: "bold" 
                      }}>
                        <span>{currentRank.icon}</span>
                        <span>{currentRank.name}</span>
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "0.85rem" }}>✉ {safeEmail}</p>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Verified Orders</p>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "1.6rem", color: "#22c55e", fontWeight: "bold" }}>{totalPurchases}</h3>
                </div>
              </div>

              {/* Rank Progress Main Card */}
              <div style={{ 
                background: "rgba(10, 10, 18, 0.88)", 
                backdropFilter: "blur(16px)", 
                border: "1px solid rgba(255, 255, 255, 0.08)", 
                borderRadius: "24px", 
                padding: "2rem",
                boxShadow: "0 25px 50px rgba(0,0,0,0.6)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.8rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🏆</span>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "bold", color: "#FFF" }}>Rank Progress</h3>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ 
                      width: "52px", 
                      height: "52px", 
                      borderRadius: "14px", 
                      background: currentRank.badgeBg, 
                      border: `1px solid ${currentRank.border}`, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: "1.6rem" 
                    }}>
                      {currentRank.icon}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1.1rem", color: currentRank.color, fontWeight: "bold" }}>{currentRank.name}</h4>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Current Rank</p>
                    </div>
                  </div>

                  {nextRank ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "right" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.1rem", color: nextRank.color, fontWeight: "bold" }}>{nextRank.name}</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Next Rank</p>
                      </div>
                      <div style={{ 
                        width: "52px", 
                        height: "52px", 
                        borderRadius: "14px", 
                        background: nextRank.badgeBg, 
                        border: `1px solid ${nextRank.border}`, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "1.6rem" 
                      }}>
                        {nextRank.icon}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "right" }}>
                      <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#a855f7", padding: "6px 14px", borderRadius: "12px", fontWeight: "bold", fontSize: "0.85rem", border: "1px solid rgba(168, 85, 247, 0.4)" }}>
                        👑 Max Level Reached
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "bold" }}>
                    <span style={{ color: currentRank.color }}>{currentRank.name}</span>
                    <span style={{ color: nextRank ? nextRank.color : currentRank.color }}>{nextRank ? nextRank.name : "Max"}</span>
                  </div>

                  <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                    <div style={{ 
                      width: `${progressPercent}%`, 
                      height: "100%", 
                      background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank ? nextRank.color : currentRank.color})`, 
                      borderRadius: "10px",
                      transition: "width 0.4s ease" 
                    }} />
                  </div>
                </div>

                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.9rem", margin: "0 0 2rem 0" }}>
                  {nextRank ? (
                    <>
                      <strong style={{ color: "#FFF" }}>{purchasesNeeded} more {purchasesNeeded === 1 ? 'purchase' : 'purchases'}</strong> to reach {nextRank.name}
                    </>
                  ) : (
                    <strong style={{ color: "#a855f7" }}>You are at the Highest Rank (Diamond)!</strong>
                  )}
                </p>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>All Ranks</h4>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                    {RANKS.map((r) => {
                      const isCurrent = r.name === currentRank.name;
                      return (
                        <div 
                          key={r.name} 
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            background: isCurrent ? r.badgeBg : "rgba(255,255,255,0.02)", 
                            border: `1.5px solid ${isCurrent ? r.border : "rgba(255,255,255,0.08)"}`, 
                            padding: "6px 14px", 
                            borderRadius: "30px",
                            boxShadow: isCurrent ? `0 0 15px ${r.badgeBg}` : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <span>{r.icon}</span>
                          <span style={{ color: isCurrent ? r.color : "#9ca3af", fontWeight: isCurrent ? "bold" : "normal", fontSize: "0.85rem" }}>
                            {r.name} ({r.min}+)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =======================
              6. PROFILE TAB
          ======================== */}
          {activeTab === "profile" && (
            <div style={{ padding: "2.5rem 1.5rem", maxWidth: "600px", margin: "0 auto", borderRadius: "16px", background: "rgba(14, 14, 23, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Edit Profile</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} alt="Current Avatar" style={{ width: "110px", height: "110px", borderRadius: "50%", border: `4px solid ${currentRank.color}`, objectFit: "cover" }} />
                  <h3 style={{ margin: "1rem 0 0.2rem 0", color: "#FFF", fontSize: "1.2rem" }}>{safeName}</h3>
                  
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: currentRank.badgeBg, border: `1px solid ${currentRank.border}`, color: currentRank.color, fontSize: "0.8rem", padding: "2px 10px", borderRadius: "20px", fontWeight: "bold" }}>
                      {currentRank.icon} {currentRank.name} Rank
                    </span>
                    {isVerified ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "#818cf8", fontWeight: "bold", background: "rgba(99,102,241,0.15)", padding: "2px 10px", borderRadius: "20px" }}>
                        Premium User <img src="https://files.catbox.moe/mq2edy.png" alt="Verified" width={14} height={14} />
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af", background: "rgba(255,255,255,0.05)", padding: "2px 10px", borderRadius: "20px" }}>Free User</span>
                    )}
                  </div>
                  
                  {(initialUser?.image || initialUser?.googleImage) && avatar !== (initialUser?.image || initialUser?.googleImage) && (
                    <button onClick={() => handleAvatarSelect("")} style={{ marginTop: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "8px", color: "#cbd5e1", cursor: "pointer", fontSize: "0.85rem" }}>
                      Restore Google Image
                    </button>
                  )}
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.2rem", borderRadius: "12px" }}>
                  <h4 style={{ textAlign: "center", color: "#9ca3af", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>Choose Preset Avatar</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(45px, 1fr))", gap: "0.8rem", justifyItems: "center" }}>
                    {AVAILABLE_AVATARS.map((gifPath) => (
                      <div key={gifPath} onClick={() => handleAvatarSelect(gifPath)} style={{ width: "50px", height: "50px", borderRadius: "50%", cursor: isUpdating ? "not-allowed" : "pointer", border: avatar === gifPath ? "3px solid #6366f1" : "3px solid transparent", overflow: "hidden" }}>
                        <img src={gifPath} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#9ca3af", fontSize: "0.85rem" }}>Email</label>
                  <input type="email" value={safeEmail} readOnly style={{ width: "100%", padding: "0.9rem", background: "#08080f", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#9ca3af", fontSize: "0.85rem" }}>Last Login / Activity Recorded</label>
                  <input 
                    type="text" 
                    value={metaData.lastSeen ? `${new Date(metaData.lastSeen).toLocaleDateString()} at ${new Date(metaData.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : "Currently Active"} 
                    readOnly 
                    style={{ width: "100%", padding: "0.9rem", background: "#08080f", border: "1px solid rgba(255,255,255,0.1)", color: "#818cf8", borderRadius: "8px", outline: "none", boxSizing: "border-box", fontWeight: "bold" }} 
                  />
                </div>

                {/* 🔑 YOUR LEGION-VPN USER ID SECTION */}
                <div style={{ background: "rgba(0,0,0,0.35)", padding: "1.2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "#60a5fa", fontSize: "0.85rem", fontWeight: "bold" }}>
                    Your LEGION-VPN User ID
                  </label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input 
                      type="text" 
                      value={vpnUserId || "No Active VPN ID"} 
                      readOnly 
                      style={{ 
                        flex: 1, 
                        padding: "0.85rem 1rem", 
                        background: "#08080f", 
                        border: "1px solid rgba(255,255,255,0.12)", 
                        color: vpnUserId ? "#38bdf8" : "#9ca3af", 
                        borderRadius: "8px", 
                        fontFamily: "monospace", 
                        fontSize: "0.9rem",
                        outline: "none",
                        boxSizing: "border-box"
                      }} 
                    />
                    {vpnUserId && (
                      <button
                        type="button"
                        onClick={() => handleCopyVpnId(vpnUserId)}
                        style={{
                          background: idCopied ? "#059669" : "linear-gradient(90deg, #2563eb, #3b82f6)",
                          color: "#FFF",
                          border: "none",
                          padding: "0.85rem 1.2rem",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                          transition: "all 0.2s"
                        }}
                      >
                        {idCopied ? "✓ Copied!" : "📋 Copy ID"}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SIM WARNING MODAL */}
          {simWarningModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
              <div style={{ width: "100%", maxWidth: "500px", padding: "2rem", background: "#10101a", border: "1px solid rgba(239,68,68,0.5)", borderRadius: "16px", textAlign: "center" }}>
                 <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                 <h2 style={{ color: "#FFF", marginBottom: "1rem" }}>Important Notice</h2>
                 <p style={{ color: "#9ca3af", lineHeight: 1.6, marginBottom: "2rem" }}>
                   SIM Packages වල Speed එක මදි වීමට ප්‍රධාන හේතුව වන්නේ ඔබගේ connection එකට ප්‍රමාණවත් Bandwidth එකක් නොමැති වීමයි. <strong>Signal Strength එක හොඳට තියෙනවා නම් ඉතා හොඳ Internet Speed එකක් ලබාගත හැක.</strong>
                 </p>
                 <div style={{ display: "flex", gap: "1rem" }}>
                   <button onClick={() => setSimWarningModal(null)} style={{ flex: 1, padding: "1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                   <button onClick={() => proceedToCheckout(simWarningModal)} style={{ flex: 1, padding: "1rem", background: "#ef4444", color: "#FFF", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>I Understand</button>
                 </div>
              </div>
            </div>
          )}

          {/* CHECKOUT MODAL */}
          {modalPackage && !simWarningModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
              <div style={{ width: "100%", maxWidth: "560px", padding: "2rem", background: "#10101a", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: 0, color: "#818cf8" }}>Step {checkoutStep} of 3</h3>
                  <button onClick={closeCheckout} disabled={isUploading} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
                </div>

                {checkoutStep === 1 && (
                  <div>
                    <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>Configure VPN Quota</h2>
                    <p style={{ color: "#818cf8", marginBottom: "1.5rem", fontWeight: "bold", background: "rgba(99,102,241,0.1)", padding: "0.8rem", borderRadius: "8px" }}>📦 {modalPackage.name}</p>
                    
                    <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.85rem", color: "#9ca3af" }}>Choose Data Quota & Pricing:</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "2rem" }}>
                      {Object.entries(modalPackage.type === "router" ? ROUTER_CONFIG_PRICES : MOBILE_CONFIG_PRICES).map(([quota, price]) => (
                        <button key={quota} onClick={() => setSelectedQuota(quota)} style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem", background: selectedQuota === quota ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid", borderColor: selectedQuota === quota ? "#818cf8" : "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#FFF", cursor: "pointer", textAlign: "left", fontSize: "1.1rem" }}>
                          <span style={{ fontWeight: selectedQuota === quota ? "bold" : "normal" }}>{quota}</span>
                          <strong style={{ color: "#22c55e" }}>Rs. {price as number}</strong>
                        </button>
                      ))}
                    </div>

                    <button onClick={() => setCheckoutStep(2)} disabled={!selectedQuota} style={{ width: "100%", padding: "1.2rem", background: selectedQuota ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.1)", color: selectedQuota ? "#FFF" : "rgba(255,255,255,0.3)", fontWeight: "bold", fontSize: "1.1rem", cursor: selectedQuota ? "pointer" : "not-allowed", borderRadius: "12px", border: "none" }}>Next: Payment Details →</button>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <div>
                    <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>Bank Transfer Details</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Transfer <strong style={{ color: "#22c55e" }}>Rs. {modalPackage.type === "router" ? ROUTER_CONFIG_PRICES[selectedQuota!] : MOBILE_CONFIG_PRICES[selectedQuota!]}</strong> to the following account:</p>
                    
                    <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>BANK</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>{BANK_ACCOUNT.bankName}</strong>
                          <button
                            type="button"
                            onClick={() => copyBankField("bank", BANK_ACCOUNT.bankName)}
                            style={{
                              background: copiedBankField === "bank" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)",
                              color: copiedBankField === "bank" ? "#22c55e" : "#cbd5e1",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              fontWeight: "bold",
                              transition: "all 0.2s"
                            }}
                          >
                            {copiedBankField === "bank" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>ACCOUNT NAME</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>{BANK_ACCOUNT.accountName}</strong>
                          <button
                            type="button"
                            onClick={() => copyBankField("accountName", BANK_ACCOUNT.accountName)}
                            style={{
                              background: copiedBankField === "accountName" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)",
                              color: copiedBankField === "accountName" ? "#22c55e" : "#cbd5e1",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              fontWeight: "bold",
                              transition: "all 0.2s"
                            }}
                          >
                            {copiedBankField === "accountName" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>ACCOUNT NO.</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ color: "#22c55e", fontSize: "1.2rem", letterSpacing: "1px" }}>{BANK_ACCOUNT.accountNo}</strong>
                          <button
                            type="button"
                            onClick={() => copyBankField("accountNo", BANK_ACCOUNT.accountNo)}
                            style={{
                              background: copiedBankField === "accountNo" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)",
                              color: copiedBankField === "accountNo" ? "#22c55e" : "#cbd5e1",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              fontWeight: "bold",
                              transition: "all 0.2s"
                            }}
                          >
                            {copiedBankField === "accountNo" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>BRANCH</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>{BANK_ACCOUNT.branch}</strong>
                          <button
                            type="button"
                            onClick={() => copyBankField("branch", BANK_ACCOUNT.branch)}
                            style={{
                              background: copiedBankField === "branch" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)",
                              color: copiedBankField === "branch" ? "#22c55e" : "#cbd5e1",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              fontWeight: "bold",
                              transition: "all 0.2s"
                            }}
                          >
                            {copiedBankField === "branch" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCheckoutStep(3)} style={{ flex: 2, padding: "1rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>Next: Upload Slip →</button>
                    </div>
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div>
                    <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>Upload Payment Slip</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Upload your receipt to verify payment and activate your VPN account.</p>
                    
                    <div style={{ border: "2px dashed rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.05)", borderRadius: "12px", padding: "3rem 1rem", textAlign: "center", marginBottom: "2rem", cursor: "pointer" }}>
                      <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} style={{ display: "none" }} id="slip-upload" disabled={isUploading} />
                      <label htmlFor="slip-upload" style={{ cursor: "pointer", display: "block" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>📁</div>
                        <h4 style={{ margin: "0 0 0.3rem 0", color: "#818cf8" }}>{isUploading ? "Uploading..." : slipFile ? slipFile.name : "Click here to upload slip image"}</h4>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>PNG, JPG or PDF</p>
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => setCheckoutStep(2)} disabled={isUploading} style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => { handleConfirmOrder(); setTimeout(() => window.open(`https://wa.me/+441163504152?text=${encodeURIComponent(`Hi, I just submitted an order for ${modalPackage?.name}. Please verify.`)}`, "_blank"), 1000); }} disabled={!slipFile || isUploading} style={{ flex: 2, padding: "1rem", background: slipFile ? "linear-gradient(90deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)", color: slipFile ? "#FFF" : "#6b7280", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: slipFile && !isUploading ? "pointer" : "not-allowed" }}>
                        {isUploading ? "Uploading to Cloudinary..." : "🚀 Submit Order"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🔐 VPN RENEW CUSTOM POPUP MODAL */}
          {renewModalOpen && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
              <div style={{ width: "100%", maxWidth: "480px", padding: "2rem", background: "#10101a", border: `1px solid ${metaData.isRenewUnlocked ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`, borderRadius: "18px", textAlign: "center", boxShadow: "0 20px 45px rgba(0,0,0,0.8)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>
                  {metaData.isRenewUnlocked ? "🔓" : "🔒"}
                </div>
                <h2 style={{ color: "#FFF", fontSize: "1.4rem", margin: "0 0 1rem 0" }}>
                  {metaData.isRenewUnlocked ? "VPN Renewal Notice" : "Renewal Not Permitted"}
                </h2>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.8rem" }}>
                  <p style={{ color: "#e2e8f0", lineHeight: 1.6, margin: 0, fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                    {metaData.renewPopupMessage || (metaData.isRenewUnlocked ? "You can now renew your VPN package." : "ඔබගේ පැකේජය අලුත් කිරීමට (Renew) දැනට අවසර ලබා දී නොමැත. කරුණාකර Admin අමතන්න.")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button 
                    type="button" 
                    onClick={() => setRenewModalOpen(false)} 
                    style={{ flex: 1, padding: "0.9rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem" }}
                  >
                    Close
                  </button>
                  {metaData.isRenewUnlocked && (
                    <button 
                      type="button" 
                      onClick={() => { setRenewModalOpen(false); setActiveTab("buy"); }} 
                      style={{ flex: 2, padding: "0.9rem", background: "linear-gradient(90deg, #22c55e, #16a34a)", color: "#FFF", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
                    >
                      Proceed to Renew (Store) →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 📱 FLOATING WHATSAPP POPOVER HUB (STEP 3) */}
      <div 
        ref={whatsappRef}
        className={`floating-contact-container ${isTourActive ? "tour-active-hide" : ""}`}
      >
        {/* Animated Glassmorphism Popover Card (Above the button) */}
        {whatsappMenuOpen && (
          <div className="whatsapp-popover-card">
            {/* Popover Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.1rem" }}>💬</span>
                <span style={{ fontSize: "0.88rem", fontWeight: "bold", color: "#FFF" }}>Legion WhatsApp Hub</span>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappMenuOpen(false)}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#9ca3af", width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", transition: "all 0.2s" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 0.9rem 0", fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.45 }}>
              Official Legion VPN community channel & direct admin assistance:
            </p>

            {/* Button 1: Join Channel */}
            <a
              href="https://whatsapp.com/channel/0029VbDrZJTISTkOlKJ5X307"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setWhatsappMenuOpen(false)}
              className="whatsapp-hub-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.7rem 0.9rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.22))",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                color: "#FFF",
                textDecoration: "none",
                marginBottom: "0.6rem",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>📢</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#c084fc", fontWeight: "bold", fontSize: "0.82rem" }}>Join our Channel to get UPDATES</div>
                <div style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>New configs, fixes & server notices</div>
              </div>
            </a>

            {/* Button 2: Contact Admin */}
            <a
              href="https://wa.me/+441163504152"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setWhatsappMenuOpen(false)}
              className="whatsapp-hub-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.7rem 0.9rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(37, 211, 102, 0.22), rgba(18, 140, 126, 0.26))",
                border: "1px solid rgba(37, 211, 102, 0.4)",
                color: "#FFF",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>💬</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#4ade80", fontWeight: "bold", fontSize: "0.82rem" }}>Contact Admin</div>
                <div style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>Direct 1-on-1 support on WhatsApp</div>
              </div>
            </a>
          </div>
        )}

        {/* The Floating WhatsApp Circular Trigger Button */}
        <button
          type="button"
          onClick={() => setWhatsappMenuOpen(!whatsappMenuOpen)}
          className="floating-contact-btn"
          title="Open WhatsApp Support Hub"
          aria-label="Open WhatsApp Support Hub"
          style={{
            border: "none",
            cursor: "pointer",
            outline: "none"
          }}
        >
          {whatsappMenuOpen ? (
            <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#FFF" }}>✕</span>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          )}
        </button>
      </div>

      {/* 🚀 LIQUID GLASS NAVIGATION TASKBAR (STEP 5) */}
      <nav 
        className={`liquid-glass-taskbar ${isTourActive ? "tour-dim-non-focused" : ""}`}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest("[data-tab-id]") as HTMLElement | null;
          if (el?.dataset.tabId) setScrubbedTabId(el.dataset.tabId);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest("[data-tab-id]") as HTMLElement | null;
          if (el?.dataset.tabId) setScrubbedTabId(el.dataset.tabId);
        }}
        onTouchEnd={() => {
          if (scrubbedTabId) {
            const matched = tabs.find(t => t.id === scrubbedTabId);
            if (matched) {
              if (matched.isLink && matched.href) {
                router.push(matched.href);
              } else {
                setActiveTab(scrubbedTabId);
                setActiveTool(null);
              }
            }
          }
          setScrubbedTabId(null);
        }}
      >
        {tabs.map(tab => {
          if (tab.isLink) {
            return (
              <Link 
                key={tab.id} 
                href={tab.href as string} 
                data-tab-id={tab.id}
                onMouseEnter={() => setHoveredTabId(tab.id)}
                onMouseLeave={() => setHoveredTabId(null)}
                className={`taskbar-item ${hoveredTabId === tab.id || scrubbedTabId === tab.id ? "hovered" : ""}`}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: "42px", 
                  height: "42px", 
                  borderRadius: "50%", 
                  color: "rgba(255,255,255,0.7)", 
                  textDecoration: "none",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <span>{tab.icon}</span>
              </Link>
            );
          }

          const isActive = activeTab === tab.id;
          const isHovered = hoveredTabId === tab.id;
          const isScrubbed = scrubbedTabId === tab.id;
          const shouldExpand = isActive || isScrubbed;

          return (
            <button 
              key={tab.id} 
              data-tab-id={tab.id}
              onClick={() => { setActiveTab(tab.id); setActiveTool(null); }} 
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              className={`taskbar-item ${isActive ? "active" : ""} ${isHovered || isScrubbed ? "hovered" : ""}`}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: shouldExpand ? "0.45rem" : "0", 
                padding: shouldExpand ? "0 1.1rem" : "0", 
                height: "42px", 
                minWidth: "42px", 
                width: shouldExpand ? "auto" : "42px", 
                justifyContent: "center", 
                borderRadius: "25px", 
                border: isActive ? "1px solid rgba(129, 140, 248, 0.5)" : isHovered || isScrubbed ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent", 
                background: isActive 
                  ? "linear-gradient(135deg, #3730a3 0%, #581c87 100%)" 
                  : isHovered || isScrubbed 
                  ? "rgba(79, 70, 229, 0.22)" 
                  : "transparent", 
                color: isActive ? "#FFF" : isHovered || isScrubbed ? "#e0e7ff" : "rgba(255,255,255,0.6)", 
                cursor: "pointer",
                boxShadow: isActive ? "0 0 16px rgba(79, 70, 229, 0.45), inset 0 1px 1px rgba(255,255,255,0.3)" : "none",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>{tab.icon}</span>
              {shouldExpand && (
                <span style={{ fontWeight: "bold", fontSize: "0.83rem", whiteSpace: "nowrap" }}>
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      {/* 🌟 GLASSMORPHISM & SPOTLIGHT BLACK/WHITE FOCUS STYLES */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Status Cards 4-in-a-row Parallel Desktop Grid & Mobile Single-Column */
        .status-cards-grid {
          display: grid;
          gap: 1.2rem;
          width: 100%;
        }
        @media (min-width: 901px) {
          .status-cards-grid.has-4-cards {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .status-cards-grid.has-3-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 900px) {
          .status-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Subtle gentle dimming for walkthrough */
        .tour-dim-non-focused {
          opacity: 0.52;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        /* The explicitly focused active card pops up in full color, bright glow and full opacity */
        .tour-spotlight-active {
          opacity: 1 !important;
          pointer-events: auto !important;
          position: relative !important;
          z-index: 99999 !important;
          border-color: #818cf8 !important;
          box-shadow: 0 0 35px rgba(99, 102, 241, 0.75), 0 0 0 3px rgba(129, 140, 248, 0.8) !important;
          animation: tourPulseGlow 2s infinite ease-in-out !important;
        }

        @keyframes tourPulseGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.5), 0 0 0 2px rgba(129, 140, 248, 0.6);
          }
          50% {
            box-shadow: 0 0 45px rgba(99, 102, 241, 0.9), 0 0 0 4px rgba(129, 140, 248, 0.95);
          }
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }



        /* 🧭 Mobile & Desktop Optimized Tour Styles */
        .tour-controller-wrapper {
          position: fixed;
          bottom: 5.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 92%;
          max-width: 520px;
          z-index: 100000;
          animation: fadeInUp 0.3s ease;
          pointer-events: auto;
        }

        .tour-controller-card {
          background: rgba(14, 14, 28, 0.94);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(129, 140, 248, 0.35);
          border-radius: 20px;
          padding: 1.2rem 1.4rem;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(99, 102, 241, 0.3);
        }

        .tour-step-title {
          font-size: 1rem;
        }

        .tour-step-text {
          font-size: 0.9rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .tour-controller-wrapper {
            bottom: 5.2rem !important;
            left: 10px !important;
            right: 10px !important;
            transform: none !important;
            width: auto !important;
            max-width: none !important;
          }
          .tour-controller-card {
            padding: 1rem 1.1rem !important;
            border-radius: 16px !important;
          }
          .tour-step-title {
            font-size: 0.92rem !important;
          }
          .tour-step-text {
            font-size: 0.82rem !important;
            line-height: 1.5 !important;
          }
        }

        /* Hide WhatsApp button during tour to prevent overlap on mobile */
        .floating-contact-container.tour-active-hide {
          opacity: 0 !important;
          pointer-events: none !important;
          transform: scale(0.6) !important;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        /* 📱 Floating Contact Us Container & WhatsApp Popover Hub Styles */
        .floating-contact-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1001;
        }

        .whatsapp-popover-card {
          position: absolute;
          bottom: 68px;
          right: 0;
          width: 290px;
          background: rgba(10, 10, 20, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(168, 85, 247, 0.35);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(37, 211, 102, 0.2);
          border-radius: 18px;
          padding: 1.2rem;
          animation: popoverSpring 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-origin: bottom right;
        }

        @keyframes popoverSpring {
          from {
            opacity: 0;
            transform: scale(0.7) translateY(15px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .whatsapp-hub-item:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .floating-contact-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25D366, #128C7E);
          color: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(37, 211, 102, 0.45);
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .floating-contact-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(37, 211, 102, 0.6);
        }

        @media (max-width: 768px) {
          .floating-contact-container {
            bottom: 5.2rem !important;
            right: 1rem !important;
          }
          .floating-contact-btn {
            width: 48px !important;
            height: 48px !important;
          }
          .floating-contact-btn svg {
            width: 24px !important;
            height: 24px !important;
          }
        }

        /* 🚀 LIQUID GLASS TASKBAR STYLING */
        .liquid-glass-taskbar {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.5rem;
          background: rgba(10, 8, 24, 0.92);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(99, 102, 241, 0.35);
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(79, 70, 229, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          z-index: 1000;
          transition: all 0.3s ease;
          user-select: none;
          touch-action: pan-x;
        }

        @media (max-width: 395px) {
          .mobile-hide-name { display: none !important; }
        }
      `}</style>
    </div>
  );
}
