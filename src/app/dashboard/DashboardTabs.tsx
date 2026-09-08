"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAvatar, submitClientPaymentOrder, sendClientHeartbeat } from "@/lib/authActions";
import DashboardMatrix from "@/components/DashboardMatrix";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

const ISP_LOGOS = {
  Dialog: "https://files.catbox.moe/zyac5x.png",
  Airtel: "https://files.catbox.moe/5s5vfc.png",
  Hutch: "https://files.catbox.moe/fhd762.png",
  SLT: "https://files.catbox.moe/86zkr9.webp"
};

const BANK_ACCOUNT = { bankName: "Commercial Bank", accountName: "WDT WARAKAWATHTHA", accountNo: "8029138148", branch: "Yatiyanthota" };

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

const ROUTER_CONFIG_PRICES: Record<string, number> = { "200 GB Config": 400, "500 GB Config": 700, "Unlimited + USA Bonus Config": 1000 };
const MOBILE_CONFIG_PRICES: Record<string, number> = { "100 GB Config": 250, "200 GB Config": 350, "300 GB Config": 450, "Unlimited + USA Bonus": 700 };

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

  const [user, setUser] = useState(initialUser);
  const [avatar, setAvatar] = useState<string | null>(user?.image || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [payments, setPayments] = useState<any[]>([]);
  const [achievements, setAchievements] = useState({ legion: false, nolimits: false, organized: false, dedicated: false });
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string} | null>(null);

  // 🚀 Read Metadata from Database
  let metaData = { alert: "", isPremium: false, payments: [] as any[], pendingOrders: [] as any[] };
  if (user?.subscriptionLink) {
    try {
      metaData = { ...metaData, ...JSON.parse(user.subscriptionLink) };
    } catch {
      metaData.alert = user.subscriptionLink;
    }
  }

  // 🚀 Center Alert Dismiss Logic (Shown once per alert)
  const [showCenterAlert, setShowCenterAlert] = useState(false);

  useEffect(() => {
    if (metaData.alert) {
      const userDismissKey = `legion_dismissed_alert_${user?.id || user?.email}`;
      const dismissed = localStorage.getItem(userDismissKey);
      if (dismissed !== metaData.alert) {
        setShowCenterAlert(true);
      }
    }
  }, [metaData.alert, user?.id, user?.email]);

  const handleDismissAlert = () => {
    if (metaData.alert) {
      const userDismissKey = `legion_dismissed_alert_${user?.id || user?.email}`;
      localStorage.setItem(userDismissKey, metaData.alert);
    }
    setShowCenterAlert(false);
  };

  // 🚀 User-Specific Payments (Isolated from Database Only)
  useEffect(() => {
    if (metaData.payments && Array.isArray(metaData.payments)) {
      setPayments(metaData.payments);
    } else {
      setPayments([]);
    }
  }, [user?.subscriptionLink]);

  const isVerified = metaData.isPremium || payments.length > 0 || Boolean(user?.vpnConfigKey && user.vpnConfigKey.length > 5);
  const safeName = user?.name || "Premium User";
  const safeEmail = user?.email || "";
  
  const hasActivePlan = Boolean(user?.vpnConfigKey && user.vpnConfigKey.length > 5 && !user.vpnConfigKey.includes("Payment Verifying"));
  const now = new Date().getTime();
  const expiry = user?.expiryDate ? new Date(user.expiryDate).getTime() : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 3600 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  // 🚀 Real-time Online Heartbeat Every 15s
  useEffect(() => {
    sendClientHeartbeat();
    const hb = setInterval(() => sendClientHeartbeat(), 15000);
    return () => clearInterval(hb);
  }, []);

  const availablePackages = ALL_PACKAGES.filter(p => activeIsp === "All" || p.isp === activeIsp);
  const hasRouter = availablePackages.some(p => p.type === "router");
  const hasMobile = availablePackages.some(p => p.type === "mobile");

  useEffect(() => {
    if (!hasRouter && activeNetworkType === "router") setActiveNetworkType("all");
    if (!hasMobile && activeNetworkType === "mobile") setActiveNetworkType("all");
  }, [activeIsp, hasRouter, hasMobile, activeNetworkType]);

  // 🚀 Parse Configurations without stripping existing ones
  const parseConfigs = (rawText: string | null) => {
    if (!rawText) return [];
    const regex = /(?:📦\s*)?\[(.*?)\]\s*([\s\S]*?)(?=(?:📦\s*)?\[|$)/g;
    let matches = [...rawText.matchAll(regex)];
    let configs = [];
    if (matches.length > 0) {
      configs = matches
        .map(m => ({ name: m[1].trim(), code: m[2].trim() }))
        .filter(c => !c.name.toLowerCase().includes("payment verifying") && c.code.length > 0);
    } else if (!rawText.includes("Payment Verifying")) {
      const vlessLinks = rawText.match(/vless:\/\/[^\s]+/g);
      if (vlessLinks) configs = vlessLinks.map((link, i) => ({ name: `Premium Server ${i + 1}`, code: link }));
      else if (rawText.trim().length > 5) configs = [{ name: "VPN Configuration Details", code: rawText.trim() }];
    }
    return configs;
  };
  const activeConfigs = parseConfigs(user?.vpnConfigKey);

  // 🚀 STRIP BRACKETS [...] BEFORE COPYING
  const handleCopyCleanCode = (text: string) => {
    const cleanCode = text.replace(/(?:📦\s*)?\[[\s\S]*?\]\s*/g, "").trim();
    navigator.clipboard.writeText(cleanCode);
    alert("Copied to clipboard!");
  };

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
      intervalId = setInterval(checkConnection, 4000); 
    }
    return () => clearInterval(intervalId);
  }, [activeTab, activeTool]);

  // Speed Test Engine
  const [stState, setStState] = useState<"idle" | "finding" | "downloading" | "uploading" | "done">("idle");
  const [stPing, setStPing] = useState("--");
  const [stDown, setStDown] = useState("0.00");
  const [stUp, setStUp] = useState("0.00");
  const [gaugeValue, setGaugeValue] = useState(0); 

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
            setGaugeValue(Math.min(avgSpeed / 150, 1));
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
                setGaugeValue(Math.min(upTarget / 150, 1));
                resolve(null);
            } else {
                setStUp(currentUp.toFixed(2));
                setGaugeValue(Math.min(currentUp / 150, 1));
            }
        }, 100);
    });

    setStState("done");
  };

  const cancelTest = () => { setStState("idle"); setGaugeValue(0); };

  const handleSelectPackage = (pkg: any) => {
    if (pkg.type === "mobile") setSimWarningModal(pkg);
    else proceedToCheckout(pkg);
  };

  const proceedToCheckout = (pkg: any) => {
    setSimWarningModal(null);
    setModalPackage(pkg);
    setCheckoutStep(1);
    setSelectedQuota(null);
  };

  // 🚀 SUBMIT ORDER WITH GOOGLE FIREBASE STORAGE
  const handleConfirmOrder = async () => {
    if (!slipFile) return;
    setIsUploading(true);

    try {
      let fileUrl = "";

      // 1. Upload directly to Firebase Storage
      try {
        const storageRef = ref(storage, `payment_slips/${Date.now()}_${slipFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`);
        await uploadBytes(storageRef, slipFile);
        fileUrl = await getDownloadURL(storageRef);
      } catch {
        // Safe fallback if Firebase config is incomplete
        const formData = new FormData();
        formData.append("file", slipFile);
        const uploadRes = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: formData });
        const data = await uploadRes.json();
        fileUrl = data?.data?.url || "";
      }

      if (!fileUrl) throw new Error("Failed to get slip URL");

      const amount = currentQuotaList[selectedQuota!] || 0;

      // 2. Save order to Prisma Database without overwriting current configs
      const res = await submitClientPaymentOrder({
        packageName: modalPackage?.name || "Custom Plan",
        amount,
        receiptUrl: fileUrl
      });

      if (res?.success) {
        setUser(res.user);
        alert("Order Submitted! Your receipt was uploaded to Firebase and sent to Admin for review.");
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

  const closeCheckout = () => { setModalPackage(null); setSimWarningModal(null); setCheckoutStep(1); setSelectedQuota(null); setSlipFile(null); };

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newAvatar = gifPath === "" ? (initialUser?.googleImage || null) : gifPath;
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

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: "buy", label: "Store", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
    { id: "configs", label: "My VPNs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
    { id: "payments", label: "Payments", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg> },
    { id: "achievements", label: "Achievements", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> },
    { id: "profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> }
  ];

  if (user?.email === "dulangathipul@gmail.com") {
    tabs.push({ id: "admin", label: "Admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, isLink: true, href: "/dashboard/admin" });
  }

  const currentQuotaList = modalPackage?.type === "router" ? ROUTER_CONFIG_PRICES : MOBILE_CONFIG_PRICES;
  const pendingOrders = metaData.pendingOrders || [];

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#FFFFFF", paddingBottom: "100px", position: "relative" }}>
      <DashboardMatrix />
      
      {/* TOAST NOTIFICATION WITH SOUND */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: "100px", right: "20px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 1.5rem", borderRadius: "12px", zIndex: 9999, boxShadow: "0 10px 30px rgba(99,102,241,0.5)", animation: "fadeInUp 0.3s ease", display: "flex", gap: "15px", alignItems: "center" }}>
          <audio autoPlay src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=success-1-6297.mp3" />
          <span style={{ fontSize: "2rem" }}>🏆</span>
          <div>
            <h4 style={{ margin: 0, color: "#FFF", fontSize: "1rem" }}>{toastMsg.title}</h4>
            <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.85rem" }}>{toastMsg.desc}</p>
          </div>
        </div>
      )}

      {/* 🚀 CENTER BIG CUSTOM POPUP MODAL (SHOWN ONCE PER ALERT) */}
      {showCenterAlert && metaData.alert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1.5rem" }}>
          <div style={{ background: "#11111a", border: "1px solid rgba(99,102,241,0.5)", borderRadius: "20px", padding: "2.5rem 2rem", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
              {metaData.alert.split(" ")[0] || "📢"}
            </div>
            <h2 style={{ color: "#FFF", fontSize: "1.4rem", marginBottom: "1rem" }}>Notice from Admin</h2>
            <p style={{ color: "#cbd5e1", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              {metaData.alert.replace(/^[^\s]+/, "").trim() || metaData.alert}
            </p>
            <button onClick={handleDismissAlert} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.8rem 2.8rem", borderRadius: "10px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 10px 25px rgba(99,102,241,0.4)" }}>
              OK, I Understand
            </button>
          </div>
        </div>
      )}

      <main style={{ padding: "2.5rem 1rem", maxWidth: "1150px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1rem" }}>
                <div onClick={() => window.open("https://wa.me/+441163504152?text=I%20need%20a%20Free%20Test%20Plan", "_blank")} style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(20,184,166,0.05) 100%)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "16px", padding: "1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1.2rem" }} className="hover-scale-card">
                  <div style={{ fontSize: "2.5rem" }}>🎁</div>
                  <div>
                    <h3 style={{ margin: "0 0 0.3rem 0", color: "#22c55e", fontSize: "1.1rem" }}>Claim Free Test Plan</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>Experience our premium speeds with a 3GB trial.</p>
                  </div>
                </div>
                <div onClick={() => setActiveTab("buy")} style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1.2rem" }} className="hover-scale-card">
                  <div style={{ fontSize: "2.5rem" }}>🛒</div>
                  <div>
                    <h3 style={{ margin: "0 0 0.3rem 0", color: "#818cf8", fontSize: "1.1rem" }}>Buy Premium Config</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>Unlock unlimited internet with our stable plans.</p>
                  </div>
                </div>
              </div>

              {hasActivePlan && (
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
              )}

              {/* Tools view */}
              <div style={{ background: "#0c0c14", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 style={{ margin: "0 0 1.2rem 0", color: "#FFF" }}>🛠️ Essential VPN Tools</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <button onClick={() => setActiveTool("speed")} style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#FFF", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🚀</div>
                    <strong>Speed Test</strong>
                  </button>
                  <button onClick={() => setActiveTool("ip")} style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#FFF", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🌍</div>
                    <strong>IP Info</strong>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. STORE TAB */}
          {activeTab === "buy" && (
            <div className="animate-fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {ALL_PACKAGES.map((pkg) => (
                  <div key={pkg.id} style={{ background: "#0c0c14", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                        <img src={ISP_LOGOS[pkg.isp as keyof typeof ISP_LOGOS]} width={20} height={20} alt={pkg.isp} />
                        <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "6px" }}>{pkg.type === "router" ? "Router" : "Mobile"}</span>
                      </div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#FFF" }}>{pkg.name}</h3>
                      <p style={{ color: "#818cf8", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>{pkg.ispPrice}</p>
                      <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>{pkg.desc}</p>
                    </div>
                    <button onClick={() => handleSelectPackage(pkg)} style={{ marginTop: "1rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.8rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                      Select & Configure →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MY VPNS TAB (SHOWS BOTH PENDING AND ACTIVE CONFIGS) */}
          {activeTab === "configs" && (
            <div className="animate-fade-in flex flex-col gap-4">
              <h2 style={{ margin: 0, color: "#FFF" }}>My Configurations</h2>
              
              {/* 🚀 PENDING PACKAGES SECTION (ONLY AWAITING VERIFICATION APPEARS HERE) */}
              {pendingOrders.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "0.5rem" }}>
                  {pendingOrders.map((po: any, idx: number) => (
                    <div key={idx} style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "1.2rem 1.5rem", borderRadius: "14px", color: "#f59e0b" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1.5rem" }}>⏳</span>
                          <div>
                            <h4 style={{ margin: 0, color: "#FFF", fontSize: "1rem" }}>{po.package || "New VPN Plan"} (Pending Verification)</h4>
                            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#f59e0b" }}>Receipt submitted. Waiting for Admin approval...</p>
                          </div>
                        </div>
                        {po.receipt && (
                          <a href={po.receipt} target="_blank" rel="noreferrer" style={{ color: "#818cf8", textDecoration: "underline", fontSize: "0.85rem", fontWeight: "bold" }}>
                            View Uploaded Receipt ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🚀 ACTIVE CONFIGURATIONS (DISPLAYED NORMALLY WITHOUT BEING OVERWRITTEN) */}
              {activeConfigs.length > 0 ? (
                activeConfigs.map((cfg, idx) => (
                  <div key={idx} style={{ background: "#0c0c14", padding: "1.2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                      <h4 style={{ margin: 0, color: "#818cf8" }}>{cfg.name}</h4>
                      {/* 🚀 STRIPS ALL BRACKETS [...] BEFORE COPYING */}
                      <button onClick={() => handleCopyCleanCode(cfg.code)} style={{ background: "#4f46e5", color: "#FFF", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Copy</button>
                    </div>
                    <code style={{ fontSize: "0.8rem", color: "#22c55e", wordBreak: "break-all" }}>{cfg.code}</code>
                  </div>
                ))
              ) : pendingOrders.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", background: "rgba(15,15,24,0.7)", borderRadius: "16px" }}>
                  <p style={{ color: "#9ca3af" }}>No active configurations assigned yet.</p>
                  <button onClick={() => setActiveTab("buy")} style={{ marginTop: "1rem", background: "#6366f1", color: "#FFF", border: "none", padding: "0.8rem 1.8rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Buy from Store</button>
                </div>
              ) : null}
            </div>
          )}

          {/* 4. PAYMENTS TAB (ISOLATED TO CURRENT USER) */}
          {activeTab === "payments" && (
            <div className="animate-fade-in" style={{ background: "#0c0c14", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ margin: "0 0 1.5rem 0", color: "#FFF" }}>My Payment History</h2>
              {payments.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No payments recorded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.02)", padding: "1rem 1.2rem", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <h4 style={{ margin: 0, color: "#FFF" }}>{p.package}</h4>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{new Date(p.date).toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <h3 style={{ margin: 0, color: "#22c55e" }}>Rs. {p.amount}</h3>
                        <a href={p.receipt} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#818cf8" }}>View Slip ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="animate-fade-in" style={{ background: "#0c0c14", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
              <img src={avatar || `https://ui-avatars.com/api/?name=${safeName}`} alt="Profile" style={{ width: "90px", height: "90px", borderRadius: "50%", margin: "0 auto 1rem", border: "3px solid #6366f1" }} />
              <h2 style={{ margin: 0, color: "#FFF" }}>{safeName}</h2>
              <p style={{ color: "#9ca3af", margin: "0.3rem 0 1.5rem" }}>{safeEmail}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))", gap: "0.5rem" }}>
                {AVAILABLE_AVATARS.map((gif) => (
                  <img key={gif} src={gif} onClick={() => handleAvatarSelect(gif)} alt="avatar" style={{ width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer", border: avatar === gif ? "2px solid #6366f1" : "none" }} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CHECKOUT MODAL (SLIP UPLOAD USING FIREBASE) */}
      {modalPackage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div style={{ background: "#11111a", padding: "2rem", borderRadius: "16px", maxWidth: "450px", width: "100%", border: "1px solid rgba(99,102,241,0.3)" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#FFF" }}>Configure {modalPackage.name}</h3>
            
            {checkoutStep === 1 && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {Object.entries(currentQuotaList).map(([quota, price]) => (
                    <button key={quota} onClick={() => setSelectedQuota(quota)} style={{ padding: "0.8rem", borderRadius: "8px", background: selectedQuota === quota ? "#4f46e5" : "rgba(255,255,255,0.05)", border: "none", color: "#FFF", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                      <span>{quota}</span>
                      <strong>Rs. {price}</strong>
                    </button>
                  ))}
                </div>
                <button onClick={() => setCheckoutStep(2)} disabled={!selectedQuota} style={{ width: "100%", padding: "0.8rem", background: "#22c55e", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Next →</button>
              </div>
            )}

            {checkoutStep === 2 && (
              <div>
                <p style={{ color: "#9ca3af" }}>Transfer <strong>Rs. {currentQuotaList[selectedQuota!]}</strong> to:</p>
                <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                  <p style={{ margin: 0 }}>Bank: {BANK_ACCOUNT.bankName}</p>
                  <p style={{ margin: "0.2rem 0" }}>Account: <strong>{BANK_ACCOUNT.accountNo}</strong></p>
                  <p style={{ margin: 0 }}>Name: {BANK_ACCOUNT.accountName}</p>
                </div>
                <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} style={{ marginBottom: "1rem", width: "100%" }} />
                <button onClick={handleConfirmOrder} disabled={!slipFile || isUploading} style={{ width: "100%", padding: "0.8rem", background: "#22c55e", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  {isUploading ? "Uploading to Firebase..." : "Submit Payment Slip"}
                </button>
              </div>
            )}
            <button onClick={closeCheckout} style={{ width: "100%", marginTop: "0.5rem", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* FOOTER TASKBAR */}
      <nav style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem", background: "rgba(10,10,18,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50px", zIndex: 100 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: activeTab === tab.id ? "0.5rem" : "0", padding: activeTab === tab.id ? "0 1rem" : "0", height: "42px", minWidth: "42px", justifyContent: "center", background: activeTab === tab.id ? "rgba(99,102,241,0.25)" : "transparent", color: activeTab === tab.id ? "#818cf8" : "rgba(255,255,255,0.5)", borderRadius: "25px", border: "none", cursor: "pointer" }}>
            <span>{tab.icon}</span>{activeTab === tab.id && <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{tab.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
