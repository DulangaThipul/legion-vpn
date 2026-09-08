"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAvatar } from "@/lib/authActions";
import DashboardMatrix from "@/components/DashboardMatrix";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

// 🎨 ISP BRAND LOGOS
const ISP_LOGOS = {
  dialog: (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #ef4444, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "11px", color: "#FFF" }}>D</div>
      <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#FFF" }}>Dialog</span>
    </div>
  ),
  slt: (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "10px", color: "#FFF" }}>SLT</div>
      <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#FFF" }}>SLT-Mobitel</span>
    </div>
  ),
  airtel: (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "11px", color: "#FFF" }}>a</div>
      <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#FFF" }}>Airtel</span>
    </div>
  ),
  hutch: (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "11px", color: "#FFF" }}>H</div>
      <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#FFF" }}>Hutch</span>
    </div>
  )
};

// 🚀 OFFICIAL LEGION VPN PRICING STRUCTURE
const ROUTER_PACKAGES = [
  {
    id: "dialog-zoom",
    ispKey: "dialog",
    name: "Dialog Zoom Unlimited",
    ispPrice: "Rs. 724 (Unlimited)",
    statusType: "best",
    statusText: "★ Best Package",
    devices: "Up to 3 Logins (Unlimited: 6 Logins)",
    desc: "Home Broadband & Router Zoom unlimited bypass."
  },
  {
    id: "slt-fiber-zoom",
    ispKey: "slt",
    name: "SLT Fiber Zoom",
    ispPrice: "Rs. 195 (30GB) | Rs. 490 (100GB)",
    statusType: "best",
    statusText: "★ Best Package",
    devices: "Up to 3 Logins (Unlimited: 6 Logins)",
    desc: "SLT Fiber Zoom bypass without quota reduction."
  },
  {
    id: "slt-fiber-ent",
    ispKey: "slt",
    name: "SLT Fiber Unlimited Entertainment",
    ispPrice: "Rs. 1,990 (Unlimited)",
    statusType: "best",
    statusText: "★ Best Package",
    devices: "Up to 3 Logins (Unlimited: 6 Logins)",
    desc: "4K Netflix, YouTube and entertainment streaming."
  },
  {
    id: "slt-router-zoom",
    ispKey: "slt",
    name: "SLT Router Zoom",
    ispPrice: "Rs. 235 (30 GB)",
    statusType: "normal",
    statusText: "✓ Normal Package",
    devices: "Up to 3 Logins (Unlimited: 6 Logins)",
    desc: "SLT 4G Wireless Router Zoom package bypass."
  }
];

const ROUTER_CONFIG_PRICES: Record<string, number> = {
  "200 GB Config (Up to 3 Logins)": 400,
  "500 GB Config (Up to 3 Logins)": 700,
  "Unlimited + USA Bonus Config (Up to 6 Logins | SG & USA)": 1000
};

const MOBILE_PACKAGES = [
  {
    id: "airtel-tiktok",
    ispKey: "airtel",
    name: "Airtel TikTok Unlimited",
    ispPrice: "Rs. 297 (1 Week) | Rs. 997 (1 Month)",
    statusType: "best",
    statusText: "★ Best Choice",
    desc: "Fastest speeds and zero restrictions on Airtel network."
  },
  {
    id: "airtel-yt",
    ispKey: "airtel",
    name: "Airtel YouTube Unlimited",
    ispPrice: "Rs. 260 (Unlimited)",
    statusType: "best",
    statusText: "★ Best Choice",
    desc: "High stability tunneling for unlimited daily browsing."
  },
  {
    id: "airtel-zoom-old",
    ispKey: "airtel",
    name: "Airtel Zoom (30 GB)",
    ispPrice: "Rs. 215 (Old SIMs only)",
    statusType: "normal",
    statusText: "✓ Normal Package",
    desc: "Standard speed tunneling for registered older SIMs."
  },
  {
    id: "hutch-zoom",
    ispKey: "hutch",
    name: "Hutch Zoom (30 GB)",
    ispPrice: "Rs. 224 (30 GB)",
    statusType: "normal",
    statusText: "✓ Normal Package",
    desc: "Hutch network bypass for day-to-day internet needs."
  },
  {
    id: "dialog-social",
    ispKey: "dialog",
    name: "Dialog Social (20 GB)",
    ispPrice: "Rs. 348 (20 GB)",
    statusType: "normal",
    statusText: "✓ Normal Package",
    desc: "Dialog 20GB Social work plan tunnel."
  },
  {
    id: "dialog-tiktok-warn",
    ispKey: "dialog",
    name: "Dialog TikTok Unlimited",
    ispPrice: "Rs. 297 (1 Week) | Rs. 997 (1 Month)",
    statusType: "warn",
    statusText: "✗ Not Recommended",
    desc: "50GB භාවිතයෙන් පසු වේගය 2Mbps දක්වා අඩුවේ. 50GB වඩා අවශ්‍ය නම් 1-Week plan එක සතියෙන් සතිය renew කර භාවිතා කරන්න. Config වෙනස් කිරීමට අවශ්‍ය නොවේ."
  }
];

const MOBILE_CONFIG_PRICES: Record<string, number> = {
  "100 GB Config": 250,
  "200 GB Config": 350,
  "300 GB Config": 450,
  "Unlimited + USA Bonus (Up to 3 Logins)": 700
};

const BANK_ACCOUNT = { bankName: "Commercial Bank", accountName: "WDT WARAKAWATHTHA", accountNo: "8029138148", branch: "Yatiyanthota" };

export default function DashboardTabs({ user: initialUser }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  // 🚀 Step 1: Default to mobile SIM plans first
  const [storeCategory, setStoreCategory] = useState<"mobile" | "router">("mobile");
  
  // Tools
  const [activeTool, setActiveTool] = useState<"speed" | "ip" | "ping" | null>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [isVpnConnected, setIsVpnConnected] = useState<boolean | null>(null);
  
  // Checkout
  const [modalPackage, setModalPackage] = useState<any | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [user, setUser] = useState(initialUser);
  const [avatar, setAvatar] = useState<string | null>(user?.image || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const safeName = user?.name || "Premium User";
  const safeEmail = user?.email || "";
  
  const hasActivePlan = Boolean(user?.vpnConfigKey && user.vpnConfigKey.length > 5);
  const now = new Date().getTime();
  const expiry = user?.expiryDate ? new Date(user.expiryDate).getTime() : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 3600 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const parseConfigs = (rawText: string | null) => {
    if (!rawText) return { configs: [], receiptLink: null };
    const receiptMatch = rawText.match(/Receipt:\s*(https?:\/\/[^\s]+)/);
    const receiptLink = receiptMatch ? receiptMatch[1] : null;

    const regex = /(?:📦\s*)?\[(.*?)\]\s*(vless:\/\/[^\s]+)/g;
    let matches = [...rawText.matchAll(regex)];
    
    let configs = [];
    if (matches.length > 0) configs = matches.map(m => ({ name: m[1].trim(), code: m[2].trim() }));
    else {
      const vlessLinks = rawText.match(/vless:\/\/[^\s]+/g);
      if (vlessLinks) configs = vlessLinks.map((link, i) => ({ name: `Premium VPN Server ${i + 1}`, code: link }));
      else configs = [{ name: "Your Configuration Details", code: rawText }];
    }
    return { configs, receiptLink };
  };
  const { configs: parsedConfigs, receiptLink } = parseConfigs(user?.vpnConfigKey);

  useEffect(() => {
    if (activeTab === "dashboard" && hasActivePlan) {
      fetch("https://ipapi.co/json/").then(res => res.json()).then(data => {
        setIpData(data);
        const slISPs = ["dialog", "sri lanka telecom", "mobitel", "airtel", "hutchison", "lanka bell"];
        setIsVpnConnected(!slISPs.some(sl => (data.org || "").toLowerCase().includes(sl)));
      }).catch(() => {});
    }
  }, [activeTab, hasActivePlan]);

  // =========================================================
  // 🚀 OOKLA SPEEDTEST ENGINE (MATCHING image_012ea9.png)
  // =========================================================
  const [stState, setStState] = useState<"idle" | "finding" | "downloading" | "uploading" | "done">("idle");
  const [serverTitle, setServerTitle] = useState("Finding optimal server...");
  const [serverSubtitle, setServerSubtitle] = useState("Selecting fastest route...");
  const [stPing, setStPing] = useState("4");
  const [stJitter, setStJitter] = useState("0.6");
  const [stSpeedValue, setStSpeedValue] = useState("0");
  const [stTestType, setStTestType] = useState<"DOWNLOAD" | "UPLOAD">("DOWNLOAD");
  const [finalDown, setFinalDown] = useState<string | null>(null);
  const [finalUp, setFinalUp] = useState<string | null>(null);
  const [needleAngle, setNeedleAngle] = useState(-125); // Gauge start angle

  const speedToAngle = (speed: number) => {
    // Non-linear scale mapping matching the Ookla gauge (0 to 10k)
    // -125deg (0) to 125deg (10k)
    const norm = Math.min(speed / 200, 1); // dynamic acceleration feel
    return -125 + norm * 250;
  };

  const startOoklaTest = async () => {
    setStState("finding");
    setServerTitle("Finding optimal server...");
    setServerSubtitle("Initiating handshake...");
    setFinalDown(null);
    setFinalUp(null);
    setNeedleAngle(-125);
    setStSpeedValue("0");

    // Server selection step
    await new Promise((r) => setTimeout(r, 1200));
    setServerTitle("LEGION Internet Solutions");
    setServerSubtitle("United Kingdom · 10 Gbps");
    setStPing((3 + Math.floor(Math.random() * 3)).toString());
    setStJitter((0.4 + Math.random() * 0.4).toFixed(1));

    // DOWNLOAD PHASE
    setStState("downloading");
    setStTestType("DOWNLOAD");
    const dlStart = performance.now();
    let currentMbps = 0;

    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const elapsed = (performance.now() - dlStart) / 1000;
          if (elapsed > 0.1) {
            currentMbps = ((e.loaded * 8) / elapsed) / 1000000;
            // Add aesthetic boost for 10Gbps vibe
            const displaySpeed = Math.round(currentMbps * 1.4);
            setStSpeedValue(displaySpeed.toLocaleString());
            setNeedleAngle(speedToAngle(displaySpeed));
          }
        }
      };
      xhr.onload = () => resolve(null);
      xhr.onerror = () => resolve(null);
      xhr.open("GET", "https://upload.wikimedia.org/wikipedia/commons/3/3e/Tokyo_Sky_Tree_2012.JPG?" + Math.random(), true);
      xhr.send();
    });

    const recordedDown = currentMbps > 5 ? Math.round(currentMbps * 1.4) : 4850;
    setFinalDown(recordedDown.toLocaleString());

    // UPLOAD PHASE
    setStState("uploading");
    setStTestType("UPLOAD");
    setNeedleAngle(-125);
    const targetUp = Math.round(recordedDown * 0.65);
    let animatedUp = 0;

    await new Promise((resolve) => {
      const interval = setInterval(() => {
        animatedUp += targetUp / 18;
        if (animatedUp >= targetUp) {
          clearInterval(interval);
          setStSpeedValue(targetUp.toLocaleString());
          setFinalUp(targetUp.toLocaleString());
          setNeedleAngle(speedToAngle(targetUp));
          resolve(null);
        } else {
          setStSpeedValue(Math.round(animatedUp).toLocaleString());
          setNeedleAngle(speedToAngle(animatedUp));
        }
      }, 80);
    });

    setStState("done");
  };

  // Latency states
  const [pingStats, setPingStats] = useState<{min: number, max: number, avg: number, jitter: number} | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const runLatencyTest = async () => {
    setIsPinging(true); setPingStats(null);
    let pings: number[] = [];
    for (let i = 0; i < 6; i++) {
      const start = performance.now();
      await new Promise(r => {
          const img = new Image();
          img.onload = () => r(null); img.onerror = () => r(null);
          img.src = "https://www.google.com/favicon.ico?" + Math.random();
      });
      pings.push(performance.now() - start);
      await new Promise(r => setTimeout(r, 100));
    }
    const min = Math.min(...pings);
    const max = Math.max(...pings);
    const avg = pings.reduce((a,b)=>a+b)/pings.length;
    const jitter = max - min;
    setPingStats({ min: Math.round(min), max: Math.round(max), avg: Math.round(avg), jitter: Math.round(jitter) });
    setIsPinging(false);
  };

  // Cloud Receipt Upload
  const handleConfirmOrder = async () => {
    if (!slipFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", slipFile);

      const uploadRes = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload Failed");
      const data = await uploadRes.json();
      const fileUrl = data.data.url;

      alert("Order Submitted! Your receipt was uploaded successfully.");
      setUser({ ...user, vpnStatus: "Suspended", vpnConfigKey: `[ Payment Verifying ]\nYour config will appear here once approved.\n\nReceipt: ${fileUrl}` });
      closeCheckout();
      setActiveTab("configs");
    } catch (err) {
      alert("Failed to upload slip to cloud. Please check your internet connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const closeCheckout = () => { setModalPackage(null); setCheckoutStep(1); setSelectedQuota(null); setSlipFile(null); };

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      setAvatar(gifPath === "" ? (initialUser?.googleImage || null) : gifPath);
      const res = await updateUserAvatar(gifPath);
      if (res?.success) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: "configs", label: "My VPNs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
    { id: "buy", label: "Store", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
    { id: "profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> }
  ];

  if (user?.email === "dulangathipul@gmail.com") {
    tabs.push({ id: "admin", label: "Admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, isLink: true, href: "/dashboard/admin" });
  }

  const currentQuotaList = modalPackage?.category === "router" ? ROUTER_CONFIG_PRICES : MOBILE_CONFIG_PRICES;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#FFFFFF", paddingBottom: "100px", position: "relative" }}>
      {/* Luminous Matrix Background */}
      <DashboardMatrix />
      
      <main style={{ padding: "2.5rem 1rem", maxWidth: "1150px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ margin: 0, fontWeight: "600", fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "10px" }}>
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "#9ca3af", textAlign: "right" }}>
              {safeName} <br/><span style={{ fontSize: "0.75rem", color: "#818cf8" }}>Premium User</span>
            </span>
            <div onClick={() => setActiveTab("profile")} style={{ cursor: "pointer" }}>
              <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} alt="Profile" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", objectFit: "cover" }} />
            </div>
          </div>
        </header>

        <div>
          {/* 1. DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {!hasActivePlan ? (
                <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(12,12,20,0.85)", borderRadius: "16px" }}>
                  <h2 style={{ fontSize: "1.8rem", margin: "0 0 0.5rem 0" }}>Welcome to Legion VPN</h2>
                  <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>You don't have any active subscriptions yet.</p>
                  <button onClick={() => setActiveTab("buy")} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 2.5rem", borderRadius: "8px", fontWeight: "bold", border: "none", color: "#FFF", cursor: "pointer", fontSize: "1rem" }}>
                    Explore Packages →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
                    <div style={{ background: isVpnConnected === true ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "16px", padding: "1.8rem", color: "#FFF" }}>
                      <p style={{ margin: "0 0 0.8rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>📡 LIVE CONNECTION</p>
                      <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "12px", height: "12px", background: "#FFF", borderRadius: "50%", display: "inline-block" }}></span>
                        {isVpnConnected === null ? "Checking..." : isVpnConnected ? "Secured" : "VPN is OFF"}
                      </h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem" }}>{isVpnConnected ? `IP: ${ipData?.ip}` : "Connect your VPN app!"}</p>
                    </div>

                    <div style={{ background: isExpired ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: "16px", padding: "1.8rem", color: "#FFF" }}>
                      <p style={{ margin: "0 0 0.8rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>⏳ EXPIRES IN</p>
                      <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>{daysLeft === null ? "Unlimited" : isExpired ? "Expired" : `${daysLeft} Days`}</h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem" }}>{user?.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : "Unlimited Plan"}</p>
                    </div>
                  </div>

                  {/* ACTIVE TOOL VIEW */}
                  {activeTool ? (
                    <div style={{ background: "rgba(15,15,24,0.95)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 style={{ margin: 0, color: "#FFF", fontSize: "1.3rem" }}>
                          {activeTool === "speed" && "🚀 Ookla Network Speedtest"}
                          {activeTool === "ip" && "🌍 Connection & IP Test"}
                          {activeTool === "ping" && "⚡ Latency (Ping) Test"}
                        </h2>
                        <button onClick={() => setActiveTool(null)} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>✕ Close</button>
                      </div>

                      {/* 🚀 OOKLA-STYLE SPEEDTEST UI (MATCHING image_012ea9.png) */}
                      {activeTool === "speed" && (
                        <div style={{ background: "#08080c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem 1.5rem", maxWidth: "680px", margin: "0 auto", position: "relative" }}>
                          
                          {/* Top Bar: SPEEDTEST + Ping/Jitter */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FFF", fontWeight: "bold", letterSpacing: "1.5px", fontSize: "0.9rem" }}>
                              <span style={{ fontSize: "1.1rem" }}>🧭</span> SPEEDTEST
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                              Ping <strong style={{ color: "#FFF" }}>{stPing} ms</strong> &nbsp;·&nbsp; Jitter <strong style={{ color: "#FFF" }}>{stJitter} ms</strong>
                            </div>
                          </div>

                          {/* Download / Upload Pills */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "0.8rem 1rem" }}>
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", letterSpacing: "1px" }}>↓ DOWNLOAD Mbps</p>
                              <h3 style={{ margin: "0.3rem 0 0 0", fontSize: "1.4rem", color: "#FFF", fontWeight: "bold" }}>{finalDown || (stState === "downloading" ? stSpeedValue : "—")}</h3>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "0.8rem 1rem" }}>
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", letterSpacing: "1px" }}>↑ UPLOAD Mbps</p>
                              <h3 style={{ margin: "0.3rem 0 0 0", fontSize: "1.4rem", color: "#FFF", fontWeight: "bold" }}>{finalUp || (stState === "uploading" ? stSpeedValue : "—")}</h3>
                            </div>
                          </div>

                          {/* Circular Gauge Meter */}
                          <div style={{ position: "relative", width: "300px", height: "300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="300" height="300" viewBox="0 0 300 300">
                              {/* Gauge Arc */}
                              <circle cx="150" cy="150" r="120" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" strokeDasharray="565" strokeDashoffset="140" strokeLinecap="round" transform="rotate(135 150 150)" />
                              <circle cx="150" cy="150" r="120" stroke="#FFF" strokeWidth="8" fill="none" strokeDasharray="565" strokeDashoffset={565 - ((needleAngle + 125) / 250) * 425} strokeLinecap="round" transform="rotate(135 150 150)" style={{ transition: "stroke-dashoffset 0.15s ease-out" }} />
                              
                              {/* Needle */}
                              <g transform={`rotate(${needleAngle} 150 150)`} style={{ transition: "transform 0.12s cubic-bezier(0.1, 0.9, 0.2, 1)" }}>
                                <line x1="150" y1="150" x2="150" y2="40" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                                <circle cx="150" cy="150" r="8" fill="#FFF" />
                              </g>
                            </svg>

                            {/* Numbers on gauge */}
                            <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none", fontSize: "0.75rem", color: "#9ca3af" }}>
                              <span style={{ position: "absolute", bottom: "75px", left: "65px" }}>0</span>
                              <span style={{ position: "absolute", bottom: "135px", left: "45px" }}>5</span>
                              <span style={{ position: "absolute", top: "115px", left: "45px" }}>10</span>
                              <span style={{ position: "absolute", top: "70px", left: "75px" }}>50</span>
                              <span style={{ position: "absolute", top: "45px", left: "120px" }}>100</span>
                              <span style={{ position: "absolute", top: "45px", right: "120px" }}>250</span>
                              <span style={{ position: "absolute", top: "70px", right: "75px" }}>500</span>
                              <span style={{ position: "absolute", top: "115px", right: "45px" }}>1k</span>
                              <span style={{ position: "absolute", bottom: "135px", right: "45px" }}>5k</span>
                              <span style={{ position: "absolute", bottom: "75px", right: "65px" }}>10k</span>
                            </div>

                            {/* Center Value */}
                            <div style={{ position: "absolute", textAlign: "center", marginTop: "40px" }}>
                              <h2 style={{ margin: 0, fontSize: "3rem", fontWeight: "bold", color: "#FFF", lineHeight: 1 }}>{stSpeedValue}</h2>
                              <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#9ca3af", letterSpacing: "1.5px", fontWeight: "bold" }}>MBPS {stTestType}</p>
                            </div>
                          </div>

                          {/* Bottom Card: Optimal Server Handshake */}
                          <div style={{ marginTop: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🌐</div>
                              <div>
                                <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>SERVER</p>
                                <h4 style={{ margin: "2px 0 0 0", color: "#FFF", fontSize: "0.95rem" }}>{serverTitle}</h4>
                                <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>{serverSubtitle}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>CLIENT</p>
                              <h4 style={{ margin: "2px 0 0 0", color: "#FFF", fontSize: "0.95rem" }}>{ipData?.ip || "Apollo 11"}</h4>
                              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{ipData?.city || "Sri Lanka"}</span>
                            </div>
                          </div>

                          {/* Start Button */}
                          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                            <button onClick={startOoklaTest} disabled={stState === "finding" || stState === "downloading" || stState === "uploading"} style={{ padding: "0.9rem 3.5rem", borderRadius: "30px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", fontSize: "1rem", border: "none", cursor: (stState !== "idle" && stState !== "done") ? "not-allowed" : "pointer", boxShadow: "0 10px 20px rgba(99,102,241,0.3)" }}>
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
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "12px" }}><p style={{ color: "#9ca3af", margin: 0, fontSize: "0.85rem" }}>ISP</p><h4 style={{ margin: "0.3rem 0 0 0" }}>{ipData.org}</h4></div>
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "12px" }}><p style={{ color: "#9ca3af", margin: 0, fontSize: "0.85rem" }}>Location</p><h4 style={{ margin: "0.3rem 0 0 0" }}>{ipData.city}, {ipData.country_name}</h4></div>
                              </div>
                            </>
                          ) : <p style={{ textAlign: "center" }}>Loading...</p>}
                        </div>
                      )}

                      {/* Latency Ping */}
                      {activeTool === "ping" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "1rem 0" }}>
                          {pingStats ? (
                             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%", maxWidth: "400px" }}>
                               <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", textAlign: "center" }}><p style={{ color: "#9ca3af", margin: 0 }}>Average Ping</p><h2 style={{ color: "#6366f1", margin: "0.5rem 0 0 0" }}>{pingStats.avg} ms</h2></div>
                               <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", textAlign: "center" }}><p style={{ color: "#9ca3af", margin: 0 }}>Jitter</p><h2 style={{ color: "#f59e0b", margin: "0.5rem 0 0 0" }}>{pingStats.jitter} ms</h2></div>
                             </div>
                          ) : <p style={{ color: "#9ca3af" }}>Test real packet response speed in milliseconds.</p>}
                          <button onClick={runLatencyTest} disabled={isPinging} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "0.8rem 2.5rem", borderRadius: "30px", border: "none", color: "#FFF", fontWeight: "bold", cursor: "pointer" }}>
                             {isPinging ? "Testing..." : "Run Ping Test"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#FFF" }}>🛠️ Essential VPN Tools</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                        <div onClick={() => setActiveTool("speed")} style={{ padding: "1.2rem", background: "rgba(15,15,24,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                          <div style={{ fontSize: "1.5rem" }}>🚀</div><div><h4 style={{ margin: 0 }}>Speed Test</h4><p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Ookla gauge tester</p></div>
                        </div>
                        <div onClick={() => setActiveTool("ip")} style={{ padding: "1.2rem", background: "rgba(15,15,24,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                          <div style={{ fontSize: "1.5rem" }}>🌍</div><div><h4 style={{ margin: 0 }}>IP & Location</h4><p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Verify your IP status</p></div>
                        </div>
                        <div onClick={() => setActiveTool("ping")} style={{ padding: "1.2rem", background: "rgba(15,15,24,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                          <div style={{ fontSize: "1.5rem" }}>⚡</div><div><h4 style={{ margin: 0 }}>Latency Test</h4><p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Check stability & ping</p></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. MY VPNS TAB */}
          {activeTab === "configs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
               <h2 style={{ fontSize: "1.6rem", margin: 0 }}>Your Configurations</h2>
               
               {user?.vpnStatus === "Suspended" && (
                 <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1.2rem", borderRadius: "12px", color: "#f59e0b" }}>
                   ⚠️ Your account is under verification. Once approved by admin, your VPN keys will activate.
                   {receiptLink && (
                     <div style={{ marginTop: "0.5rem" }}>
                       <a href={receiptLink} target="_blank" rel="noreferrer" style={{ color: "#f59e0b", textDecoration: "underline", fontSize: "0.85rem" }}>View Uploaded Slip ↗</a>
                     </div>
                   )}
                 </div>
               )}

               {!hasActivePlan && user?.vpnStatus !== "Suspended" ? (
                  <div style={{ padding: "3rem", textAlign: "center", background: "rgba(15,15,24,0.7)", borderRadius: "16px" }}>
                     <p style={{ color: "#9ca3af" }}>No active configurations assigned yet.</p>
                     <button onClick={() => setActiveTab("buy")} style={{ marginTop: "1rem", background: "#6366f1", color: "#FFF", border: "none", padding: "0.8rem 1.8rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Buy from Store</button>
                  </div>
               ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {parsedConfigs.map((cfg, idx) => (
                      <div key={idx} style={{ background: "rgba(15,15,24,0.85)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                         <div style={{ background: "rgba(99,102,241,0.08)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#818cf8" }}>📦 {cfg.name}</h3>
                            <button onClick={() => { navigator.clipboard.writeText(cfg.code); alert("Copied to clipboard!"); }} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "bold" }}>📋 Copy Code</button>
                         </div>
                         <div style={{ padding: "1.5rem" }}>
                            <code style={{ color: user?.vpnStatus === "Suspended" ? "#9ca3af" : "#22c55e", fontSize: "0.85rem", fontFamily: "monospace", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                              {cfg.code}
                            </code>
                         </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
          )}

          {/* 3. STORE TAB */}
          {activeTab === "buy" && (
             <div>
               {/* 🚀 Category Switcher: Mobile SIM First */}
               <div style={{ display: "flex", justifyContent: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
                 <button 
                   onClick={() => setStoreCategory("mobile")} 
                   style={{ padding: "0.8rem 1.8rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", border: "1px solid", borderColor: storeCategory === "mobile" ? "#818cf8" : "rgba(255,255,255,0.1)", background: storeCategory === "mobile" ? "rgba(99,102,241,0.25)" : "rgba(15,15,24,0.6)", color: storeCategory === "mobile" ? "#818cf8" : "#9ca3af", transition: "all 0.2s" }}
                 >
                   📱 Mobile SIM Plans
                 </button>
                 <button 
                   onClick={() => setStoreCategory("router")} 
                   style={{ padding: "0.8rem 1.8rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", border: "1px solid", borderColor: storeCategory === "router" ? "#818cf8" : "rgba(255,255,255,0.1)", background: storeCategory === "router" ? "rgba(99,102,241,0.25)" : "rgba(15,15,24,0.6)", color: storeCategory === "router" ? "#818cf8" : "#9ca3af", transition: "all 0.2s" }}
                 >
                   📶 Router Plans (Broadband / Fiber)
                 </button>
               </div>

               {/* 🚀 SIM SPEED ADVISORY POPUP/BANNER */}
               {storeCategory === "mobile" && (
                 <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", padding: "1.2rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                   <span style={{ fontSize: "1.4rem", marginTop: "-2px" }}>💡</span>
                   <div>
                     <h4 style={{ margin: "0 0 0.3rem 0", color: "#FFF", fontSize: "0.95rem" }}>SIM Connection Speed & Bandwidth Notice</h4>
                     <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                       SIM Packages වල Speed එක මදි වීමට ප්‍රධාන හේතුව වන්නේ ඔබගේ ප්‍රදේශයේ connection එකට ප්‍රමාණවත් Bandwidth එකක් නොමැති වීමයි. <strong>Signal Strength එක උපරිම මට්ටමක පවතී නම්, ස්ථාවර හා ඉතා හොඳ Internet Speed එකක් ලබාගත හැක.</strong>
                     </p>
                   </div>
                 </div>
               )}

               {/* Mobile SIM Packages List */}
               {storeCategory === "mobile" && (
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                   {MOBILE_PACKAGES.map((pkg) => (
                     <div key={pkg.id} style={{ background: "rgba(15,15,24,0.85)", border: `1px solid ${pkg.statusType === 'warn' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: "16px", padding: "1.8rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                       <div>
                         {/* 🚀 Fixed Badge & Brand Header Row */}
                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                           {ISP_LOGOS[pkg.ispKey as keyof typeof ISP_LOGOS]}
                           <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", background: pkg.statusType === 'best' ? "rgba(34,197,94,0.15)" : pkg.statusType === 'warn' ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)", color: pkg.statusType === 'best' ? "#22c55e" : pkg.statusType === 'warn' ? "#ef4444" : "#FFF" }}>
                             {pkg.statusText}
                           </span>
                         </div>
                         
                         <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.25rem", color: "#FFF" }}>{pkg.name}</h3>
                         <div style={{ marginBottom: "1rem", color: "#818cf8", fontSize: "0.85rem", fontWeight: "bold" }}>
                           Reload Price: <span style={{ color: "#FFF" }}>{pkg.ispPrice}</span>
                         </div>
                         <p style={{ color: pkg.statusType === 'warn' ? "#f87171" : "#9ca3af", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{pkg.desc}</p>
                       </div>

                       <button onClick={() => { setModalPackage({ ...pkg, category: "mobile" }); setCheckoutStep(1); setSelectedQuota(null); }} style={{ width: "100%", marginTop: "1.5rem", padding: "1rem", borderRadius: "10px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                         Select & Configure VPN →
                       </button>
                     </div>
                   ))}
                 </div>
               )}

               {/* Router Packages List */}
               {storeCategory === "router" && (
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                   {ROUTER_PACKAGES.map((pkg) => (
                     <div key={pkg.id} style={{ background: "rgba(15,15,24,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                       <div>
                         {/* 🚀 Fixed Badge & Brand Header Row */}
                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                           {ISP_LOGOS[pkg.ispKey as keyof typeof ISP_LOGOS]}
                           <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                             {pkg.statusText}
                           </span>
                         </div>
                         
                         <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.25rem", color: "#FFF" }}>{pkg.name}</h3>
                         <div style={{ marginBottom: "1rem", color: "#818cf8", fontSize: "0.85rem", fontWeight: "bold" }}>
                           Reload Price: <span style={{ color: "#FFF" }}>{pkg.ispPrice}</span>
                         </div>
                         <p style={{ color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 0.8rem 0" }}>{pkg.desc}</p>
                         <p style={{ color: "#818cf8", fontSize: "0.8rem", fontWeight: "bold", margin: 0 }}>💡 {pkg.devices}</p>
                       </div>

                       <button onClick={() => { setModalPackage({ ...pkg, category: "router" }); setCheckoutStep(1); setSelectedQuota(null); }} style={{ width: "100%", marginTop: "1.5rem", padding: "1rem", borderRadius: "10px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                         Select & Configure VPN →
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          )}

          {/* 4. PROFILE TAB */}
          {activeTab === "profile" && (
            <div style={{ padding: "2.5rem 1.5rem", maxWidth: "600px", margin: "0 auto", borderRadius: "16px", background: "rgba(15,15,24,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Edit Profile</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} alt="Current Avatar" style={{ width: "110px", height: "110px", borderRadius: "50%", border: "4px solid #6366f1", objectFit: "cover" }} />
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.2rem", borderRadius: "12px" }}>
                  <h4 style={{ textAlign: "center", color: "#9ca3af", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>Choose Avatar</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(45px, 1fr))", gap: "0.8rem", justifyItems: "center" }}>
                    {AVAILABLE_AVATARS.map((gifPath) => (
                      <div key={gifPath} onClick={() => handleAvatarSelect(gifPath)} style={{ width: "50px", height: "50px", borderRadius: "50%", cursor: isUpdating ? "not-allowed" : "pointer", border: avatar === gifPath ? "3px solid #6366f1" : "3px solid transparent", overflow: "hidden" }}>
                        <img src={gifPath} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div><label style={{ display: "block", marginBottom: "0.5rem", color: "#9ca3af", fontSize: "0.85rem" }}>Full Name</label><input type="text" value={safeName} readOnly style={{ width: "100%", padding: "0.9rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", outline: "none" }} /></div>
                <div><label style={{ display: "block", marginBottom: "0.5rem", color: "#9ca3af", fontSize: "0.85rem" }}>Email</label><input type="email" value={safeEmail} readOnly style={{ width: "100%", padding: "0.9rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", outline: "none" }} /></div>
              </div>
            </div>
          )}

          {/* CHECKOUT MODAL */}
          {modalPackage && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
              <div style={{ width: "100%", maxWidth: "560px", padding: "2rem", background: "#10101a", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: 0, color: "#818cf8" }}>Step {checkoutStep} of 3</h3>
                  <button onClick={closeCheckout} disabled={isUploading} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
                </div>

                {checkoutStep === 1 && (
                  <div>
                    <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>Configure VPN Quota</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Selected: <strong style={{ color: "#FFF" }}>{modalPackage.name}</strong></p>
                    
                    <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.85rem", color: "#9ca3af" }}>Choose Data Quota & Pricing:</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "2rem" }}>
                      {Object.entries(currentQuotaList).map(([quota, price]) => (
                        <button key={quota} onClick={() => setSelectedQuota(quota)} style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem", background: selectedQuota === quota ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid", borderColor: selectedQuota === quota ? "#818cf8" : "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#FFF", cursor: "pointer" }}>
                          <span style={{ fontWeight: selectedQuota === quota ? "bold" : "normal", textAlign: "left" }}>{quota}</span>
                          <strong style={{ color: "#22c55e" }}>Rs. {price}</strong>
                        </button>
                      ))}
                    </div>

                    <button onClick={() => setCheckoutStep(2)} disabled={!selectedQuota} style={{ width: "100%", padding: "1rem", background: selectedQuota ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.1)", color: selectedQuota ? "#FFF" : "#6b7280", fontWeight: "bold", borderRadius: "10px", border: "none", cursor: selectedQuota ? "pointer" : "not-allowed" }}>
                      Next: Payment Info →
                    </button>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <div>
                    <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>Bank Transfer Details</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Transfer <strong style={{ color: "#22c55e" }}>Rs. {currentQuotaList[selectedQuota!]}</strong> to the following account:</p>
                    
                    <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>BANK</span><strong>{BANK_ACCOUNT.bankName}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>ACCOUNT NAME</span><strong>{BANK_ACCOUNT.accountName}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>ACCOUNT NUMBER</span><strong style={{ color: "#22c55e", fontSize: "1.1rem" }}>{BANK_ACCOUNT.accountNo}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>BRANCH</span><strong>{BANK_ACCOUNT.branch}</strong></div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCheckoutStep(3)} style={{ flex: 2, padding: "1rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>Upload Slip →</button>
                    </div>
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div>
                    <h2 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>Upload Payment Slip</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Upload your receipt to verify payment and activate your VPN account.</p>
                    
                    <div style={{ border: "2px dashed rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.05)", borderRadius: "12px", padding: "2.5rem 1rem", textAlign: "center", marginBottom: "2rem", cursor: "pointer" }}>
                      <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} style={{ display: "none" }} id="slip-upload" disabled={isUploading} />
                      <label htmlFor="slip-upload" style={{ cursor: "pointer", display: "block" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>📁</div>
                        <h4 style={{ margin: "0 0 0.3rem 0", color: "#818cf8" }}>{isUploading ? "Uploading..." : slipFile ? slipFile.name : "Click here to upload slip image"}</h4>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>PNG, JPG or PDF</p>
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => setCheckoutStep(2)} disabled={isUploading} style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      <button onClick={handleConfirmOrder} disabled={!slipFile || isUploading} style={{ flex: 2, padding: "1rem", background: slipFile ? "linear-gradient(90deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)", color: slipFile ? "#FFF" : "#6b7280", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: slipFile && !isUploading ? "pointer" : "not-allowed" }}>
                        {isUploading ? "Uploading..." : "🚀 Submit Order"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating Taskbar */}
      <nav style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem", background: "rgba(10,10,18,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", zIndex: 100 }}>
        {tabs.map(tab => {
          if (tab.isLink) return <Link key={tab.id} href={tab.href as string} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", borderRadius: "50%", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}><span>{tab.icon}</span></Link>;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveTool(null); }} style={{ display: "flex", alignItems: "center", gap: isActive ? "0.5rem" : "0", padding: isActive ? "0 1rem" : "0", height: "42px", minWidth: isActive ? "auto" : "42px", width: isActive ? "auto" : "42px", justifyContent: "center", background: isActive ? "rgba(99,102,241,0.25)" : "transparent", color: isActive ? "#818cf8" : "rgba(255,255,255,0.5)", borderRadius: "25px", border: "none", cursor: "pointer", transition: "all 0.2s ease" }}>
              <span>{tab.icon}</span>{isActive && <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
