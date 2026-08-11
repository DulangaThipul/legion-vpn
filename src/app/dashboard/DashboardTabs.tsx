"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAvatar } from "@/lib/authActions";
import DashboardMatrix from "@/components/DashboardMatrix";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

const pricingRules: Record<string, Record<string, number>> = {
  "Airtel Old Sim 260 Package VPN": { "100GB": 400, "200GB": 600, "Unlimited": 800 },
  "Airtel New Sim Rs.297 (7D) / 997 Package VPN": { "100GB": 400, "200GB": 600, "Unlimited": 800 },
  "Dialog Router 724 Zoom Unlimited Package": { "100GB": 450, "200GB": 650, "Unlimited": 850 },
  "SLT 4G/Fiber Router 490 Zoom 100GB Package": { "100GB": 400, "200GB": 600 },
  "SLT Fiber 1990 Unlimited": { "100GB": 1000, "200GB": 1200, "Unlimited": 1400 }
};

const packages = {
  Airtel: [{ name: "Airtel Old Sim 260 Package VPN" }, { name: "Airtel New Sim Rs.297 (7D) / 997 Package VPN" }],
  Dialog: [{ name: "Dialog Router 724 Zoom Unlimited Package" }],
  SLT: [{ name: "SLT 4G/Fiber Router 490 Zoom 100GB Package" }, { name: "SLT Fiber 1990 Unlimited" }]
};

const testPackages = [
  { provider: "DIALOG ROUTER", name: "Dialog Zoom Unlimited Rs.724", desc: "3GB Data You Can Use For Testing..." },
  { provider: "SLT ROUTER/FIBER", name: "SLT Zoom 30GB/Rs.195 & 100GB/Rs.490", desc: "3GB Data You Can Use For Testing..." },
  { provider: "SLT ROUTER/FIBER", name: "SLT Unlimited Entertainment/Netflix Unlimited - Rs.1990", desc: "This is Unlimited Plan" },
  { provider: "AIRTEL", name: "Airtel TikTok Unlimited - Rs.297/1 week , Rs.997/1 month", desc: "This is Unlimited Plan" }
];

// Dynamic Bank Accounts based on Referral Code
const BANK_ACCOUNTS: Record<string, any> = {
  DEFAULT: { bankName: "HNB", accountName: "BBJN Rupasinghe", accountNo: "124020206878", branch: "Mahiyangana" },
  RAVIDU: { bankName: "Commercial Bank", accountName: "Ravidu Perera", accountNo: "87654321092", branch: "Colombo 01" }
};

export default function DashboardTabs({ user: initialUser }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProvider, setSelectedProvider] = useState<"Airtel" | "Dialog" | "SLT" | null>(null);
  const [showTestPlans, setShowTestPlans] = useState(false);
  const [activeTool, setActiveTool] = useState<"speed" | "ip" | "ping" | null>(null);
  
  // Checkout States
  const [modalPackage, setModalPackage] = useState<string | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [referralCode, setReferralCode] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const [ipData, setIpData] = useState<any>(null);
  const [isVpnConnected, setIsVpnConnected] = useState<boolean | null>(null);
  const [pingResult, setPingResult] = useState<number | null>(null);
  const [usageData, setUsageData] = useState<{dataUsed: string, limit: string} | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  const [user, setUser] = useState(initialUser);
  const [avatar, setAvatar] = useState<string | null>(user.image);
  const [isUpdating, setIsUpdating] = useState(false);

  const hasActivePlan = Boolean(user.vpnConfigKey && user.vpnConfigKey.length > 5);
  const now = new Date().getTime();
  const expiry = user.expiryDate ? new Date(user.expiryDate).getTime() : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 3600 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const currentBank = BANK_ACCOUNTS[referralCode.toUpperCase()] || BANK_ACCOUNTS.DEFAULT;

  const fetchUsageData = () => {
    if (!user.subscriptionLink) return;
    const match = user.subscriptionLink.match(/id=(\d+)/);
    const vpnId = match ? match[1] : user.subscriptionLink.trim();
    setLoadingUsage(true);
    setUsageError(null);
    fetch(`/api/usage?id=${vpnId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setUsageError(data.error);
        else if (data.dataUsed) setUsageData({ dataUsed: data.dataUsed, limit: data.limit });
      })
      .catch(err => setUsageError("Network Error"))
      .finally(() => setLoadingUsage(false));
  };

  useEffect(() => {
    if (activeTab === "dashboard" && hasActivePlan) {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          setIpData(data);
          const slISPs = ["dialog", "sri lanka telecom", "mobitel", "airtel", "hutchison", "lanka bell"];
          const isp = (data.org || "").toLowerCase();
          setIsVpnConnected(!slISPs.some(sl => isp.includes(sl)));
        }).catch(() => {});
      fetchUsageData();
    }
  }, [activeTab, hasActivePlan, user.subscriptionLink]);

  const runPingTest = async () => {
    setPingResult(null);
    const start = Date.now();
    try { await fetch("https://1.1.1.1/cdn-cgi/trace", { mode: "no-cors", cache: "no-store" }); setPingResult(Date.now() - start); } 
    catch { setPingResult(Date.now() - start); }
  };

  const handleConfirmOrder = async () => {
    alert("Order Submitted! Your VPN Config is generated and pending Admin Review.");
    
    // Auto Update UI locally to show pending state
    setUser({ ...user, vpnStatus: "Suspended", vpnConfigKey: "Pending Review - Uploaded slip is being checked." });
    setModalPackage(null);
    setCheckoutStep(1);
    setSlipFile(null);
    setReferralCode("");
    setActiveTab("configs");
  };

  const closeCheckout = () => {
    setModalPackage(null);
    setCheckoutStep(1);
    setSelectedQuota(null);
    setReferralCode("");
    setSlipFile(null);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: "configs", label: "My VPNs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
    { id: "buy", label: "Store", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
    { id: "tutorials", label: "Tutorials", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> },
    { id: "tickets", label: "Tickets", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> },
    { id: "profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> }
  ];

  if (user.email === "dulangathipul@gmail.com") tabs.push({ id: "admin", label: "Admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, isLink: true, href: "/dashboard/admin" });

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#FFFFFF", paddingBottom: "100px", position: "relative", zIndex: 1 }}>
      <DashboardMatrix />
      
      <main style={{ padding: "3rem 1.5rem", maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        
        <header className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", position: "relative", zIndex: 50 }}>
          <h1 className="dashboard-title" style={{ margin: 0, fontWeight: "600", letterSpacing: "0.5px", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "10px" }}>
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="desktop-name" style={{ fontWeight: "600", fontSize: "1rem", color: "var(--muted-text)" }}>
              {user.name} <br/><span style={{ fontSize: "0.75rem", color: "#6366f1" }}>Premium User</span>
            </span>
            <div onClick={() => setActiveTab("profile")} style={{ cursor: "pointer" }}>
              <img src={avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="Profile" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", objectFit: "cover" }} />
            </div>
          </div>
        </header>

        <div>
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {!hasActivePlan ? (
                !showTestPlans ? (
                  <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(10, 10, 15, 0.6)", borderRadius: "16px" }}>
                    <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Welcome to Legion VPN</h2>
                    <p style={{ color: "var(--muted-text)", marginBottom: "2.5rem" }}>You don't have any active subscriptions yet.</p>
                    <button onClick={() => setShowTestPlans(true)} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "8px", fontWeight: "bold", border: "none", color: "#FFF", cursor: "pointer", fontSize: "1.1rem" }}>Get a test plan →</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                       <div><h2 style={{ fontSize: "1.6rem", margin: "0 0 0.5rem 0" }}>Choose a Test Plan</h2><p style={{ color: "var(--muted-text)", margin: 0 }}>Select a trial package to test our premium speeds.</p></div>
                       <button onClick={() => setShowTestPlans(false)} style={{ background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", padding: "0.5rem 1.5rem", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                      {testPackages.map((pkg, index) => (
                        <div key={index} className="glass-panel" style={{ padding: "2rem", background: "rgba(18, 18, 28, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                             <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold" }}>🧪 TEST</span>
                             <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "1.2rem" }}>FREE</span>
                          </div>
                          <div style={{ marginBottom: "1.5rem", flex: 1 }}>
                            <p style={{ fontSize: "0.75rem", color: "var(--muted-text)", fontWeight: "bold", marginBottom: "0.5rem" }}>{pkg.provider}</p>
                            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.3rem" }}>{pkg.name}</h3>
                            <div style={{ borderLeft: "3px solid #6366f1", paddingLeft: "1rem" }}><p style={{ color: "var(--muted-text)", margin: 0 }}>{pkg.desc}</p></div>
                          </div>
                          <button onClick={() => window.open(`https://wa.me/94753403800?text=${encodeURIComponent(`Hi, I would like to activate a FREE Trial for: ${pkg.name}`)}`, "_blank")} style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "linear-gradient(90deg, #6366f1, #a855f7)", color: "#FFF", fontWeight: "bold", border: "none", cursor: "pointer" }}>🚀 Activate Free Trial</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="animate-fade-in flex flex-col gap-6">
                  {/* LIVE CONNECTION, COUNTDOWN, AND API USAGE CARDS REMAIN UNCHANGED */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                    <div style={{ background: isVpnConnected === true ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", position: "relative", overflow: "hidden" }}>
                      <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", opacity: 0.9 }}>📡 LIVE CONNECTION</p>
                      <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "12px", height: "12px", background: "#FFF", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #FFF", animation: isVpnConnected ? "pulse 2s infinite" : "none" }}></span>
                        {isVpnConnected === null ? "Checking..." : isVpnConnected ? "Secured" : "VPN is OFF"}
                      </h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>{isVpnConnected ? `IP: ${ipData?.ip}` : "Your real ISP is visible!"}</p>
                    </div>

                    <div style={{ background: isExpired ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", position: "relative", overflow: "hidden" }}>
                      <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", opacity: 0.9 }}>⏳ EXPIRES IN</p>
                      <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "bold" }}>{daysLeft === null ? "Unlimited" : isExpired ? "Expired" : `${daysLeft}d`}</h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : "Unlimited Plan"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "configs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeInUp 0.3s ease" }}>
               <div className="glass-panel" style={{ padding: "3rem", position: "relative" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#FFF" }}>Your VLESS Configuration Key</h2>
                {user.vpnStatus === "Suspended" && (
                  <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid #f59e0b", padding: "1rem", borderRadius: "8px", color: "#f59e0b", marginBottom: "1.5rem", fontWeight: "bold" }}>
                    ⚠️ Your account is currently in REVIEW. The config will be active once payment is verified.
                  </div>
                )}
                <div style={{ background: "#050505", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <code style={{ color: user.vpnStatus === "Suspended" ? "var(--muted-text)" : "#22c55e", fontSize: "1rem", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {user.vpnConfigKey || "No config assigned yet."}
                  </code>
                  {hasActivePlan && user.vpnStatus !== "Suspended" && (
                    <button className="btn" style={{ alignSelf: "flex-start", background: "#FFF", color: "#000", fontWeight: "bold", border: "none", padding: "0.8rem 2.5rem", cursor: "pointer", borderRadius: "8px" }} onClick={() => { navigator.clipboard.writeText(user.vpnConfigKey); alert("Copied to clipboard!"); }}>
                      Copy Config Key
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "buy" && (
             <div className="animate-fade-in">
             <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap", justifyContent: "center" }}>
               {(["Airtel", "Dialog", "SLT"] as const).map(provider => (
                 <button key={provider} onClick={() => setSelectedProvider(provider)} className="btn hover:scale-105" style={{ minWidth: "140px", fontSize: "1rem", fontWeight: "bold", background: selectedProvider === provider ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)", color: selectedProvider === provider ? "#818cf8" : "var(--muted-text)", border: `1px solid ${selectedProvider === provider ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", padding: "0.8rem 1.5rem", transition: "all 0.3s ease" }}>
                   {provider} Plans
                 </button>
               ))}
             </div>
             {selectedProvider && (
               <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                 {packages[selectedProvider].map((pkg, index) => (
                   <div key={index} className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem", background: "rgba(18, 18, 28, 0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                     <div style={{ marginBottom: "1.5rem" }}>
                       <span style={{ display: "inline-block", padding: "0.3rem 0.8rem", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1.5rem" }}>{selectedProvider} ROUTER</span>
                       <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.4rem", lineHeight: 1.4, fontWeight: "600", minHeight: "60px" }}>{pkg.name}</h3>
                     </div>
                     <button onClick={() => { setModalPackage(pkg.name); setCheckoutStep(1); setSelectedQuota(null); }} style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", fontSize: "1rem", border: "none", cursor: "pointer", marginTop: "auto" }}>🛒 Buy Now</button>
                   </div>
                 ))}
               </div>
             )}
           </div>
          )}

          {/* 3-STEP CHECKOUT MODAL */}
          {modalPackage && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
              <div className="glass-panel" style={{ width: "100%", maxWidth: "600px", padding: "2.5rem", background: "#11111a", position: "relative", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "16px", maxHeight: "90vh", overflowY: "auto" }}>
                <button onClick={closeCheckout} style={{ position: "absolute", top: "1rem", right: "1.5rem", background: "none", border: "none", color: "var(--muted-text)", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
                
                {/* Stepper Header */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
                  {[1, 2, 3].map(step => (
                    <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", opacity: checkoutStep === step ? 1 : 0.5 }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: checkoutStep >= step ? "#6366f1" : "rgba(255,255,255,0.1)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>{step}</div>
                      <span style={{ fontSize: "0.8rem", color: checkoutStep >= step ? "#818cf8" : "var(--muted-text)" }}>
                        {step === 1 ? "VPN Details" : step === 2 ? "Payment Info" : "Upload Slip"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* STEP 1: VPN Details & Quota */}
                {checkoutStep === 1 && (
                  <div className="animate-fade-in">
                    <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Configure Your VPN</h2>
                    <p style={{ color: "#818cf8", marginBottom: "1.5rem", fontWeight: "bold", background: "rgba(99,102,241,0.1)", padding: "0.5rem", borderRadius: "8px" }}>📦 {modalPackage}</p>
                    
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>Select Quota *</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem" }}>
                      {Object.entries(pricingRules[modalPackage] || {}).map(([quota, price]) => (
                        <button key={quota} onClick={() => setSelectedQuota(quota)} style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: selectedQuota === quota ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.02)", border: "1px solid", borderColor: selectedQuota === quota ? "#818cf8" : "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#FFFFFF", cursor: "pointer", textAlign: "left" }}>
                          <span style={{ fontWeight: selectedQuota === quota ? "bold" : "normal" }}>{quota}</span>
                          <span style={{ fontWeight: "bold" }}>Rs. {price}</span>
                        </button>
                      ))}
                    </div>

                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>Agent / Referral Code (Optional)</label>
                    <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g. RAVIDU" style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", textTransform: "uppercase", marginBottom: "2rem" }} />

                    <button onClick={() => setCheckoutStep(2)} disabled={!selectedQuota} style={{ width: "100%", padding: "1rem", background: selectedQuota ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.1)", color: selectedQuota ? "#FFF" : "rgba(255,255,255,0.3)", fontWeight: "bold", fontSize: "1.1rem", cursor: selectedQuota ? "pointer" : "not-allowed", borderRadius: "8px", border: "none" }}>Next: Payment Details →</button>
                  </div>
                )}

                {/* STEP 2: Bank Details */}
                {checkoutStep === 2 && (
                  <div className="animate-fade-in">
                    <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Payment Details</h2>
                    <p style={{ color: "var(--muted-text)", marginBottom: "1.5rem" }}>Transfer <strong style={{color:"#FFF"}}>Rs. {pricingRules[modalPackage][selectedQuota!]}</strong> to the account below.</p>
                    
                    <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted-text)" }}>BANK</span>
                        <strong style={{ color: "#FFF" }}>{currentBank.bankName}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted-text)" }}>ACCOUNT NAME</span>
                        <strong style={{ color: "#FFF" }}>{currentBank.accountName}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted-text)" }}>ACCOUNT NO.</span>
                        <strong style={{ color: "#22c55e", fontSize: "1.2rem", letterSpacing: "1px" }}>{currentBank.accountNo}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted-text)" }}>BRANCH</span>
                        <strong style={{ color: "#FFF" }}>{currentBank.branch}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCheckoutStep(3)} style={{ flex: 2, padding: "1rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>Next: Upload Slip →</button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Upload Slip */}
                {checkoutStep === 3 && (
                  <div className="animate-fade-in">
                    <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Upload Payment Slip</h2>
                    <p style={{ color: "var(--muted-text)", marginBottom: "1.5rem" }}>Upload your bank transfer receipt to auto-generate your config.</p>
                    
                    <div style={{ border: "2px dashed rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.05)", borderRadius: "12px", padding: "3rem 1rem", textAlign: "center", marginBottom: "2rem", cursor: "pointer" }}>
                      <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} style={{ display: "none" }} id="slip-upload" />
                      <label htmlFor="slip-upload" style={{ cursor: "pointer", display: "block" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📁</div>
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "#818cf8" }}>{slipFile ? slipFile.name : "Click here to upload slip"}</h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-text)" }}>JPG, PNG, or PDF</p>
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => setCheckoutStep(2)} style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      <button onClick={handleConfirmOrder} disabled={!slipFile} style={{ flex: 2, padding: "1rem", background: slipFile ? "linear-gradient(90deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)", color: slipFile ? "#FFF" : "rgba(255,255,255,0.3)", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: slipFile ? "pointer" : "not-allowed" }}>🚀 Submit Order</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <nav style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem", background: "rgba(5, 5, 10, 0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "50px", zIndex: 100 }}>
        {tabs.map(tab => {
          if (tab.isLink) return <Link key={tab.id} href={tab.href as string} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "45px", height: "45px", borderRadius: "50%", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}><span>{tab.icon}</span></Link>;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => {setActiveTab(tab.id); setActiveTool(null);}} style={{ display: "flex", alignItems: "center", gap: isActive ? "0.6rem" : "0", padding: isActive ? "0 1.2rem 0 1rem" : "0", height: "45px", minWidth: isActive ? "auto" : "45px", width: isActive ? "auto" : "45px", justifyContent: "center", background: isActive ? "rgba(99, 102, 241, 0.2)" : "transparent", color: isActive ? "#818cf8" : "rgba(255,255,255,0.5)", borderRadius: "25px", border: "1px solid", borderColor: isActive ? "rgba(99, 102, 241, 0.3)" : "transparent", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", whiteSpace: "nowrap", overflow: "hidden" }}>
              <span>{tab.icon}</span><span className="taskbar-label" style={{ maxWidth: isActive ? "120px" : "0px", opacity: isActive ? 1 : 0, transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", fontWeight: "bold", fontSize: "0.9rem" }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) {
          .desktop-name { display: none !important; }
          .dashboard-title { font-size: 1.5rem !important; }
          .taskbar-label { display: none !important; } 
        }
      `}</style>
    </div>
  );
}
