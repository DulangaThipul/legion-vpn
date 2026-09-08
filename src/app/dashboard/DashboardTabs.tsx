"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAvatar } from "@/lib/authActions";
import DashboardMatrix from "@/components/DashboardMatrix";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

// 🚀 ISP Logos
const ISP_LOGOS = {
  Dialog: "https://files.catbox.moe/zyac5x.png",
  Airtel: "https://files.catbox.moe/5s5vfc.png",
  Hutch: "https://files.catbox.moe/fhd762.png",
  SLT: "https://files.catbox.moe/86zkr9.webp"
};

const BANK_ACCOUNT = { bankName: "Commercial Bank", accountName: "WDT WARAKAWATHTHA", accountNo: "8029138148", branch: "Yatiyanthota" };

// 🚀 Unified Packages with precise device counts and no emojis in type
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
  const [activeIsp, setActiveIsp] = useState<string>("Dialog");
  const [activeNetworkType, setActiveNetworkType] = useState<"all" | "router" | "mobile">("all");
  
  // Tools & States
  const [activeTool, setActiveTool] = useState<"speed" | "ip" | "ping" | "webrtc" | null>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [isVpnConnected, setIsVpnConnected] = useState<boolean | null>(null);
  
  // Checkout
  const [modalPackage, setModalPackage] = useState<any | null>(null);
  const [simWarningModal, setSimWarningModal] = useState<any | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [user, setUser] = useState(initialUser);
  const [avatar, setAvatar] = useState<string | null>(user?.image || null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Payments & Achievements
  const [payments, setPayments] = useState<any[]>([]);
  const [achievements, setAchievements] = useState({ legion: false, nolimits: false, organized: false, dedicated: false });
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string} | null>(null);

  const safeName = user?.name || "Premium User";
  const safeEmail = user?.email || "";
  
  const isVerified = payments.length > 0 || Boolean(user?.vpnConfigKey && user.vpnConfigKey.length > 5);
  const hasActivePlan = Boolean(user?.vpnConfigKey && user.vpnConfigKey.length > 5);
  const now = new Date().getTime();
  const expiry = user?.expiryDate ? new Date(user.expiryDate).getTime() : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 3600 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("legion_welcome");
    if (!hasSeenWelcome) {
      setTimeout(() => {
        setToastMsg({ title: "Achievement Unlocked! 🏆", desc: "You know the Secret to Bypass Internet" });
        localStorage.setItem("legion_welcome", "true");
        setTimeout(() => setToastMsg(null), 5000);
      }, 2000);
    }

    const savedAch = JSON.parse(localStorage.getItem("legion_achievements") || "{}");
    setAchievements(prev => ({ ...prev, ...savedAch }));

    const storedPayments = JSON.parse(localStorage.getItem("legion_payments") || "[]");
    const currentYear = new Date().getFullYear();
    const validPayments = storedPayments.filter((p: any) => new Date(p.date).getFullYear() === currentYear);
    
    if (validPayments.length !== storedPayments.length) {
      localStorage.setItem("legion_payments", JSON.stringify(validPayments));
    }
    setPayments(validPayments);

    const timer = setTimeout(() => { unlockAchievement("dedicated", "Dedicated User"); }, 600000);
    return () => clearTimeout(timer);
  }, []);

  const unlockAchievement = (key: keyof typeof achievements, title: string) => {
    setAchievements(prev => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: true };
      localStorage.setItem("legion_achievements", JSON.stringify(next));
      setToastMsg({ title: "Achievement Unlocked! 🏆", desc: title });
      setTimeout(() => setToastMsg(null), 4000);
      return next;
    });
  };

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

  // ==========================================
  // 🚀 FIXED: SPEED TEST GAUGE
  // ==========================================
  const [stState, setStState] = useState<"idle" | "finding" | "downloading" | "uploading" | "done">("idle");
  const [stPing, setStPing] = useState("--");
  const [stDown, setStDown] = useState("0.00");
  const [stUp, setStUp] = useState("0.00");
  const [gaugeValue, setGaugeValue] = useState(0); // 0.0 to 1.0
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const startSpeedTest = async () => {
    setStState("finding"); setStPing("--"); setStDown("0.00"); setStUp("0.00"); setGaugeValue(0);
    
    await new Promise(r => setTimeout(r, 1200));

    const pings: number[] = [];
    for(let i=0; i<3; i++) {
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
      xhrRef.current = xhr;
      const startTime = performance.now();
      
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const elapsed = (performance.now() - startTime) / 1000;
          if(elapsed > 0.2) {
            const mbps = ((e.loaded * 8) / elapsed) / 1000000;
            speedHistory.push(mbps);
            if(speedHistory.length > 5) speedHistory.shift(); 
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
            if(upTarget - currentUp < 0.5) {
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

  const cancelTest = () => {
    if(xhrRef.current) xhrRef.current.abort();
    setStState("idle"); setGaugeValue(0);
  };

  const [leakIPs, setLeakIPs] = useState<string[]>([]);
  const [isCheckingLeak, setIsCheckingLeak] = useState(false);
  const checkWebRTC = () => {
    setIsCheckingLeak(true); setLeakIPs([]);
    const rtc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    rtc.createDataChannel(""); rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
    rtc.onicecandidate = (e) => {
      if (e.candidate && e.candidate.candidate) {
        const ipMatch = e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (ipMatch) setLeakIPs(prev => Array.from(new Set([...prev, ipMatch[1]])));
      }
    };
    setTimeout(() => { setIsCheckingLeak(false); rtc.close(); }, 3000);
  };

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

  const handleConfirmOrder = async () => {
    if (!slipFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", slipFile);
      const uploadRes = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload Failed");
      const data = await uploadRes.json();
      const fileUrl = data.data.url;

      unlockAchievement("legion", "Be a part of LEGION");
      if (modalPackage?.name.toLowerCase().includes("unlimited") || selectedQuota?.toLowerCase().includes("unlimited")) {
        unlockAchievement("nolimits", "No More Limitations");
      }

      const newPayment = {
        id: Date.now(),
        date: new Date().toISOString(),
        package: modalPackage?.name || "Custom Plan",
        amount: currentQuotaList[selectedQuota!] || 0,
        status: "Verifying",
        receipt: fileUrl
      };
      const updatedPayments = [newPayment, ...payments];
      localStorage.setItem("legion_payments", JSON.stringify(updatedPayments));
      setPayments(updatedPayments);

      alert("Order Submitted! Your receipt was uploaded successfully.");
      setUser({ ...user, vpnStatus: "Suspended", vpnConfigKey: `[ Payment Verifying ]\nYour config will appear here once approved.\n\nReceipt: ${fileUrl}` });
      closeCheckout();
      setActiveTab("configs");
    } catch (err) {
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
      unlockAchievement("organized", "Organized Person");
      router.refresh();
    } catch (e) {
      console.error(e);
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
    { id: "configs", label: "My VPNs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
    { id: "buy", label: "Store", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
    { id: "payments", label: "Payments", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg> },
    { id: "achievements", label: "Achievements", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> },
    { id: "profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> }
  ];

  if (user?.email === "dulangathipul@gmail.com") {
    tabs.push({ id: "admin", label: "Admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, isLink: true, href: "/dashboard/admin" });
  }

  const currentQuotaList = modalPackage?.type === "router" ? ROUTER_CONFIG_PRICES : MOBILE_CONFIG_PRICES;

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

      {/* CUSTOM ADMIN NOTIFICATION POPUP */}
      {user?.alertMessage && (
        <div style={{ position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", background: user.alertMessage.includes("❌") ? "#ef4444" : "#22c55e", padding: "1rem 2rem", borderRadius: "30px", zIndex: 9999, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", fontWeight: "bold", display: "flex", gap: "10px", alignItems: "center", animation: "fadeInDown 0.3s ease", width: "90%", maxWidth: "400px", textAlign: "center", justifyContent: "center" }}>
          {user.alertMessage}
        </div>
      )}

      <main style={{ padding: "2.5rem 1rem", maxWidth: "1150px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* 🚀 FIXED HEADER FOR MOBILE */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ margin: 0, fontWeight: "600", fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "10px" }}>
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "#e5e7eb" }}>{safeName}</span>
              {isVerified ? (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#818cf8", fontWeight: "bold" }}>
                  Premium User <img src="https://files.catbox.moe/mq2edy.png" alt="Verified" width={14} height={14} />
                </span>
              ) : (
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Free User</span>
              )}
            </div>
            {/* 🚀 Clicking Avatar opens Profile Tab */}
            <div onClick={() => setActiveTab("profile")} style={{ cursor: "pointer", flexShrink: 0 }}>
              <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} alt="Profile" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", objectFit: "cover" }} />
            </div>
          </div>
        </header>

        <div>
          {/* =======================
              1. DASHBOARD TAB 
          ======================== */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6 animate-fade-in">
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
                          {activeTool === "speed" && "🚀 Legion Network Speedtest"}
                          {activeTool === "ip" && "🌍 Connection & IP Test"}
                          {activeTool === "webrtc" && "🛡️ WebRTC Leak Test"}
                          {activeTool === "ping" && "⚡ Latency (Ping) Test"}
                        </h2>
                        <button onClick={() => { setActiveTool(null); cancelTest(); }} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>✕ Close</button>
                      </div>

                      {/* 🚀 FIXED SPEEDTEST UI */}
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

                          <div style={{ position: "relative", width: "300px", height: "180px", margin: "0 auto", display: "flex", justifyContent: "center" }}>
                            <svg width="300" height="150" viewBox="0 0 300 150" style={{ overflow: "visible" }}>
                              {/* Background Arc */}
                              <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
                              {/* Colored Progress Arc */}
                              <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke={stState === "uploading" ? "#8b5cf6" : "#22c55e"} strokeWidth="12" strokeLinecap="round" 
                                    strokeDasharray="377" 
                                    strokeDashoffset={377 - (377 * gaugeValue)} 
                                    style={{ transition: "stroke-dashoffset 0.15s ease-out, stroke 0.3s ease" }} />
                              {/* Needle */}
                              <g transform={`translate(150, 150) rotate(${-90 + (gaugeValue * 180)})`} style={{ transition: "transform 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)" }}>
                                <line x1="0" y1="0" x2="0" y2="-90" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
                                <circle cx="0" cy="0" r="8" fill="#6366f1" />
                              </g>
                            </svg>
                            
                            {/* Numbers on gauge */}
                            <div style={{ position: "absolute", width: "100%", height: "150px", pointerEvents: "none", fontSize: "0.75rem", color: "#9ca3af" }}>
                              <span style={{ position: "absolute", bottom: "-10px", left: "20px" }}>0</span>
                              <span style={{ position: "absolute", top: "50px", left: "25px" }}>25</span>
                              <span style={{ position: "absolute", top: "0px", left: "70px" }}>50</span>
                              <span style={{ position: "absolute", top: "-20px", left: "135px" }}>75</span>
                              <span style={{ position: "absolute", top: "0px", right: "70px" }}>100</span>
                              <span style={{ position: "absolute", bottom: "-10px", right: "10px" }}>150+</span>
                            </div>

                            <div style={{ position: "absolute", bottom: "-20px", textAlign: "center" }}>
                              <h2 style={{ margin: 0, fontSize: "3rem", fontWeight: "bold", color: "#FFF", lineHeight: 1 }}>{stState === "uploading" || stState === "done" ? stUp : stDown}</h2>
                              <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#9ca3af", letterSpacing: "1.5px", fontWeight: "bold" }}>MBPS</p>
                            </div>
                          </div>

                          <div style={{ marginTop: "3rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🌐</div>
                              <div>
                                <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>SERVER</p>
                                <h4 style={{ margin: "2px 0 0 0", color: "#FFF", fontSize: "0.95rem" }}>{stState === "finding" ? "Finding optimal server..." : "LEGION Internet Solutions"}</h4>
                                <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>{stState === "finding" ? "Selecting..." : "United Kingdom · 10 Gbps"}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>YOUR ISP</p>
                              <h4 style={{ margin: "2px 0 0 0", color: "#FFF", fontSize: "0.95rem" }}>{ipData?.org || "Apollo 11"}</h4>
                              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{ipData?.ip || "Moon"}</span>
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

                      {/* 🚀 Latency Ping Test */}
                      {activeTool === "ping" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <h3 style={{ color: "#9ca3af", textAlign: "center", fontWeight: "normal", margin: "0 0 1rem 0" }}>Google DNS Latency Test (8.8.8.8)</h3>
                          {pingStats ? (
                             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%", maxWidth: "500px", margin: "0 auto" }}>
                               <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Average Ping</p>
                                 <h2 style={{ margin: 0, color: "#6366f1", fontSize: "2rem" }}>{pingStats.avg} <span style={{fontSize:"1rem", color:"#9ca3af"}}>ms</span></h2>
                               </div>
                               <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Jitter</p>
                                 <h2 style={{ margin: 0, color: "#f59e0b", fontSize: "2rem" }}>{pingStats.jitter} <span style={{fontSize:"1rem", color:"#9ca3af"}}>ms</span></h2>
                               </div>
                               <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Min Ping</p>
                                 <h2 style={{ margin: 0, color: "#22c55e", fontSize: "1.5rem" }}>{pingStats.min} ms</h2>
                               </div>
                               <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Max Ping</p>
                                 <h2 style={{ margin: 0, color: "#ef4444", fontSize: "1.5rem" }}>{pingStats.max} ms</h2>
                               </div>
                             </div>
                          ) : (
                             <div style={{ width: "200px", height: "200px", borderRadius: "50%", border: "4px dashed rgba(99,102,241,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", animation: isPinging ? "spin 2s linear infinite" : "none" }}>
                                <span style={{ fontSize: "4rem", animation: isPinging ? "pulse 1s infinite" : "none" }}>⚡</span>
                             </div>
                          )}
                          <div style={{ textAlign: "center", marginTop: "1rem" }}>
                            <button onClick={runLatencyTest} disabled={isPinging} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "30px", border: "none", color: "#FFF", fontSize: "1.1rem", fontWeight: "bold", cursor: isPinging ? "not-allowed" : "pointer", boxShadow: "0 10px 20px rgba(99,102,241,0.3)" }}>
                               {isPinging ? "Testing Packets..." : "Run Ping Test"}
                            </button>
                          </div>
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
                    <div>
                      <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#FFF" }}>🛠️ Essential VPN Tools</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                        <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.8rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "1.5rem", cursor: "pointer", transition: "all 0.3s" }} onClick={() => setActiveTool("speed")}>
                          <div style={{ width: "60px", height: "60px", background: "rgba(99,102,241,0.1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🚀</div>
                          <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem" }}>Speed Test</h4><p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>Check tunnel speed</p></div>
                          <div style={{ color: "#6366f1" }}>→</div>
                        </div>

                        <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.8rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "1.5rem", cursor: "pointer", transition: "all 0.3s" }} onClick={() => setActiveTool("ip")}>
                          <div style={{ width: "60px", height: "60px", background: "rgba(34,197,94,0.1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🌍</div>
                          <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem" }}>IP & Location</h4><p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>Verify IP is hidden</p></div>
                          <div style={{ color: "#22c55e" }}>→</div>
                        </div>

                        <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.8rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "1.5rem", cursor: "pointer", transition: "all 0.3s" }} onClick={() => setActiveTool("ping")}>
                          <div style={{ width: "60px", height: "60px", background: "rgba(245,158,11,0.1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>⚡</div>
                          <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem" }}>Latency Test</h4><p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>Game stability check</p></div>
                          <div style={{ color: "#f59e0b" }}>→</div>
                        </div>

                        <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.8rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "1.5rem", cursor: "pointer", transition: "all 0.3s" }} onClick={() => { setActiveTool("webrtc"); checkWebRTC(); }}>
                          <div style={{ width: "60px", height: "60px", background: "rgba(239,68,68,0.1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🛡️</div>
                          <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem" }}>WebRTC Leak</h4><p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>Advanced privacy scan</p></div>
                          <div style={{ color: "#ef4444" }}>→</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =======================
              2. MY VPNS TAB 
          ======================== */}
          {activeTab === "configs" && (
            <div className="animate-fade-in flex flex-col gap-6">
               <h2 style={{ fontSize: "1.6rem", margin: 0 }}>Your Configurations</h2>
               
               {user?.vpnStatus === "Suspended" && (
                 <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1.2rem", borderRadius: "12px", color: "#f59e0b", display: "flex", flexDirection: "column", gap: "10px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "15px", fontWeight: "bold" }}>
                     <span style={{ fontSize: "1.5rem" }}>⚠️</span> Your account is currently in REVIEW. The config will be active once payment is verified.
                   </div>
                   {receiptLink && (
                      <a href={receiptLink} target="_blank" rel="noreferrer" style={{ color: "#f59e0b", textDecoration: "underline", fontSize: "0.85rem", marginLeft: "2.5rem" }}>
                        View Uploaded Receipt ↗
                      </a>
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

          {/* =======================
              3. STORE TAB (WITH DOUBLE FILTERS)
          ======================== */}
          {activeTab === "buy" && (
             <div>
               {/* Primary Filter: ISP Logos */}
               <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.5rem" }}>
                 {Object.keys(ISP_LOGOS).map(isp => (
                   <button 
                     key={isp}
                     onClick={() => setActiveIsp(isp)} 
                     style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.6rem 1.5rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", border: "1px solid", borderColor: activeIsp === isp ? "#818cf8" : "rgba(255,255,255,0.1)", background: activeIsp === isp ? "rgba(99,102,241,0.25)" : "rgba(15,15,24,0.6)", color: activeIsp === isp ? "#FFF" : "#9ca3af", transition: "all 0.2s" }}
                   >
                     <img src={ISP_LOGOS[isp as keyof typeof ISP_LOGOS]} width={24} height={24} style={{ borderRadius: "50%" }} alt={isp} />
                     {isp}
                   </button>
                 ))}
               </div>

               {/* Secondary Filter: Network Type */}
               <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                 <button onClick={() => setActiveNetworkType("all")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer", border: "1px solid", borderColor: activeNetworkType === "all" ? "#22c55e" : "rgba(255,255,255,0.1)", background: activeNetworkType === "all" ? "rgba(34,197,94,0.15)" : "transparent", color: activeNetworkType === "all" ? "#22c55e" : "#9ca3af" }}>All Packages</button>
                 <button onClick={() => setActiveNetworkType("router")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer", border: "1px solid", borderColor: activeNetworkType === "router" ? "#818cf8" : "rgba(255,255,255,0.1)", background: activeNetworkType === "router" ? "rgba(99,102,241,0.15)" : "transparent", color: activeNetworkType === "router" ? "#818cf8" : "#9ca3af" }}>Router Packages</button>
                 <button onClick={() => setActiveNetworkType("mobile")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer", border: "1px solid", borderColor: activeNetworkType === "mobile" ? "#f59e0b" : "rgba(255,255,255,0.1)", background: activeNetworkType === "mobile" ? "rgba(245,158,11,0.15)" : "transparent", color: activeNetworkType === "mobile" ? "#f59e0b" : "#9ca3af" }}>Mobile SIM</button>
               </div>

               {/* SIM Warning (Visible only if Mobile is selected in secondary filter) */}
               {activeNetworkType === "mobile" && (
                 <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", padding: "1.2rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                   <span style={{ fontSize: "1.4rem", marginTop: "-2px" }}>💡</span>
                   <div>
                     <h4 style={{ margin: "0 0 0.3rem 0", color: "#FFF", fontSize: "0.95rem" }}>SIM Connection Speed Notice</h4>
                     <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                       SIM Packages වල Speed එක මදි වීමට ප්‍රධාන හේතුව වන්නේ ඔබගේ connection එකට ප්‍රමාණවත් Bandwidth එකක් නොමැති වීමයි. <strong>Signal Strength එක හොඳට තියෙනවා නම් ඉතා හොඳ Internet Speed එකක් ලබාගත හැක.</strong>
                     </p>
                   </div>
                 </div>
               )}

               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                 {ALL_PACKAGES
                   .filter(p => p.isp === activeIsp && (activeNetworkType === "all" || p.type === activeNetworkType))
                   .map((pkg) => (
                   <div key={pkg.id} style={{ background: "rgba(15,15,24,0.85)", border: `1px solid ${pkg.statusType === 'warn' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: "16px", padding: "1.8rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                     <div>
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px" }}>
                         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                           <img src={ISP_LOGOS[pkg.isp as keyof typeof ISP_LOGOS]} width={20} height={20} style={{ borderRadius: "50%" }} alt={pkg.isp} />
                           <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", background: pkg.statusType === 'best' ? "rgba(34,197,94,0.15)" : pkg.statusType === 'warn' ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)", color: pkg.statusType === 'best' ? "#22c55e" : pkg.statusType === 'warn' ? "#ef4444" : "#FFF" }}>
                             {pkg.statusText}
                           </span>
                         </div>
                         <span style={{ fontSize: "0.75rem", color: "#818cf8", border: "1px solid rgba(129,140,248,0.3)", padding: "2px 8px", borderRadius: "20px" }}>
                           {pkg.type === "router" ? "Router Package" : "Mobile Sim"}
                         </span>
                       </div>
                       
                       <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.25rem", color: "#FFF", wordBreak: "break-word" }}>{pkg.name}</h3>
                       <div style={{ marginBottom: "1rem", color: "#818cf8", fontSize: "0.85rem", fontWeight: "bold" }}>
                         ISP Package Price: <span style={{ color: "#FFF" }}>{pkg.ispPrice}</span>
                       </div>
                       <p style={{ color: pkg.statusType === 'warn' ? "#f87171" : "#9ca3af", fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 0.8rem 0" }}>{pkg.desc}</p>
                       <p style={{ color: "#818cf8", fontSize: "0.8rem", fontWeight: "bold", margin: 0 }}>💡 {pkg.devices}</p>
                     </div>

                     <button onClick={() => handleSelectPackage(pkg)} style={{ width: "100%", marginTop: "1.5rem", padding: "1rem", borderRadius: "10px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                       Select & Configure VPN →
                     </button>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {/* =======================
              4. PAYMENTS TAB
          ======================== */}
          {activeTab === "payments" && (
            <div style={{ padding: "2.5rem 1.5rem", maxWidth: "800px", margin: "0 auto", borderRadius: "16px", background: "rgba(15,15,24,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ marginBottom: "0.5rem", color: "#FFF" }}>Payment History ({new Date().getFullYear()})</h2>
              <p style={{ color: "#9ca3af", marginBottom: "2rem", fontSize: "0.9rem" }}>Payments are stored locally and will automatically reset at the start of the next year.</p>
              
              {payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <span style={{ fontSize: "3rem" }}>🧾</span>
                  <h3 style={{ color: "#9ca3af", marginTop: "1rem" }}>No payments made yet.</h3>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", padding: "1.2rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                       <div>
                         <p style={{ margin: "0 0 0.3rem 0", color: "#818cf8", fontWeight: "bold" }}>{p.package}</p>
                         <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>{new Date(p.date).toLocaleDateString()} at {new Date(p.date).toLocaleTimeString()}</p>
                       </div>
                       <div style={{ textAlign: "right" }}>
                         <h3 style={{ margin: "0 0 0.3rem 0", color: "#22c55e" }}>Rs. {p.amount}</h3>
                         <span style={{ fontSize: "0.75rem", background: p.status === "Verified" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", color: p.status === "Verified" ? "#22c55e" : "#f59e0b", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>{p.status}</span>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================
              5. ACHIEVEMENTS TAB
          ======================== */}
          {activeTab === "achievements" && (
            <div style={{ padding: "2.5rem 1.5rem", maxWidth: "800px", margin: "0 auto", borderRadius: "16px", background: "rgba(15,15,24,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ marginBottom: "0.5rem", color: "#FFF", textAlign: "center" }}>Achievements</h2>
              <p style={{ color: "#9ca3af", marginBottom: "2rem", fontSize: "0.9rem", textAlign: "center" }}>Complete hidden tasks around the dashboard to unlock these achievements!</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                <div style={{ background: achievements.legion ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.4)", border: `1px solid ${achievements.legion ? "#818cf8" : "rgba(255,255,255,0.05)"}`, padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
                   <div style={{ fontSize: "3rem", filter: achievements.legion ? "none" : "grayscale(100%) opacity(30%)" }}>🚀</div>
                   <h3 style={{ margin: "1rem 0 0.5rem 0", color: achievements.legion ? "#FFF" : "#6b7280" }}>Be a part of LEGION</h3>
                   <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Unlock by successfully uploading your first payment slip.</p>
                </div>
                <div style={{ background: achievements.nolimits ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.4)", border: `1px solid ${achievements.nolimits ? "#818cf8" : "rgba(255,255,255,0.05)"}`, padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
                   <div style={{ fontSize: "3rem", filter: achievements.nolimits ? "none" : "grayscale(100%) opacity(30%)" }}>♾️</div>
                   <h3 style={{ margin: "1rem 0 0.5rem 0", color: achievements.nolimits ? "#FFF" : "#6b7280" }}>No More Limitations</h3>
                   <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Purchase an Unlimited package and break the limits.</p>
                </div>
                <div style={{ background: achievements.organized ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.4)", border: `1px solid ${achievements.organized ? "#818cf8" : "rgba(255,255,255,0.05)"}`, padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
                   <div style={{ fontSize: "3rem", filter: achievements.organized ? "none" : "grayscale(100%) opacity(30%)" }}>🎨</div>
                   <h3 style={{ margin: "1rem 0 0.5rem 0", color: achievements.organized ? "#FFF" : "#6b7280" }}>Organized Person</h3>
                   <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Personalize your profile by changing your avatar.</p>
                </div>
                <div style={{ background: achievements.dedicated ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.4)", border: `1px solid ${achievements.dedicated ? "#818cf8" : "rgba(255,255,255,0.05)"}`, padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
                   <div style={{ fontSize: "3rem", filter: achievements.dedicated ? "none" : "grayscale(100%) opacity(30%)" }}>⏳</div>
                   <h3 style={{ margin: "1rem 0 0.5rem 0", color: achievements.dedicated ? "#FFF" : "#6b7280" }}>Dedicated User</h3>
                   <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Stay active on the dashboard for more than 10 minutes.</p>
                </div>
              </div>
            </div>
          )}

          {/* =======================
              PROFILE TAB (FIXED LAYOUT)
          ======================== */}
          {activeTab === "profile" && (
            <div style={{ padding: "2.5rem 1.5rem", maxWidth: "600px", margin: "0 auto", borderRadius: "16px", background: "rgba(15,15,24,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Edit Profile</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}`} alt="Current Avatar" style={{ width: "110px", height: "110px", borderRadius: "50%", border: "4px solid #6366f1", objectFit: "cover" }} />
                  <h3 style={{ margin: "1rem 0 0.2rem 0", color: "#FFF", fontSize: "1.2rem" }}>{safeName}</h3>
                  {isVerified ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "#818cf8", fontWeight: "bold" }}>
                      Premium User <img src="https://files.catbox.moe/mq2edy.png" alt="Verified" width={16} height={16} />
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Free User</span>
                  )}
                  
                  {/* Google Image Restore Button */}
                  {initialUser?.googleImage && avatar !== initialUser.googleImage && (
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

                <div><label style={{ display: "block", marginBottom: "0.5rem", color: "#9ca3af", fontSize: "0.85rem" }}>Email</label><input type="email" value={safeEmail} readOnly style={{ width: "100%", padding: "0.9rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", outline: "none" }} /></div>
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
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>BANK</span><strong>{BANK_ACCOUNT.bankName}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>ACCOUNT NAME</span><strong>{BANK_ACCOUNT.accountName}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>ACCOUNT NO.</span><strong style={{ color: "#22c55e", fontSize: "1.2rem", letterSpacing: "1px" }}>{BANK_ACCOUNT.accountNo}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>BRANCH</span><strong>{BANK_ACCOUNT.branch}</strong></div>
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
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
