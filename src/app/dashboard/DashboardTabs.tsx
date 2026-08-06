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

export default function DashboardTabs({ user: initialUser }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProvider, setSelectedProvider] = useState<"Airtel" | "Dialog" | "SLT" | null>(null);
  const [modalPackage, setModalPackage] = useState<string | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);
  const [showTestPlans, setShowTestPlans] = useState(false);
  
  const [activeTool, setActiveTool] = useState<"speed" | "ip" | "ping" | null>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [isVpnConnected, setIsVpnConnected] = useState<boolean | null>(null);
  const [pingResult, setPingResult] = useState<number | null>(null);

  // 🚀 Scraped Data State
  const [usageData, setUsageData] = useState<{dataUsed: string, limit: string} | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [user, setUser] = useState(initialUser);
  const [avatar, setAvatar] = useState<string | null>(user.image);
  const [isUpdating, setIsUpdating] = useState(false);

  const hasActivePlan = Boolean(user.vpnConfigKey && user.vpnConfigKey.length > 5);
  const now = new Date().getTime();
  const expiry = user.expiryDate ? new Date(user.expiryDate).getTime() : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 3600 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  useEffect(() => {
    if (activeTab === "dashboard" && hasActivePlan) {
      // 1. IP / Connection Detector
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          setIpData(data);
          const slISPs = ["dialog", "sri lanka telecom", "mobitel", "airtel", "hutchison", "lanka bell"];
          const isp = (data.org || "").toLowerCase();
          setIsVpnConnected(!slISPs.some(sl => isp.includes(sl)));
        }).catch(() => {});

      // 2. Fetch Live Usage Data from our API
      if (user.subscriptionLink) {
        setLoadingUsage(true);
        fetch(`/api/usage?url=${encodeURIComponent(user.subscriptionLink)}`)
          .then(res => res.json())
          .then(data => {
            if (data.dataUsed && data.dataUsed !== "N/A") {
              setUsageData(data);
            }
          })
          .catch(err => console.error("Failed to fetch usage"))
          .finally(() => setLoadingUsage(false));
      }
    }
  }, [activeTab, hasActivePlan, user.subscriptionLink]);

  const runPingTest = async () => {
    setPingResult(null);
    const start = Date.now();
    try { await fetch("https://1.1.1.1/cdn-cgi/trace", { mode: "no-cors", cache: "no-store" }); setPingResult(Date.now() - start); } 
    catch { setPingResult(Date.now() - start); }
  };

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setAvatar(gifPath === "" ? (initialUser.googleImage || null) : gifPath);
    const res = await updateUserAvatar(gifPath);
    if (res.success) router.refresh();
    setIsUpdating(false);
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
                /* FREE TRIAL UI */
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

              /* PREMIUM DASHBOARD */
                <div className="animate-fade-in flex flex-col gap-6">
                  
                  {activeTool ? (
                    <div className="glass-panel" style={{ background: "rgba(15,15,20,0.8)", padding: "1rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", minHeight: "500px", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", padding: "1rem" }}>
                        <h2 style={{ margin: 0, color: "#FFF" }}>
                          {activeTool === "speed" && "🚀 Live Speed Test"}
                          {activeTool === "ip" && "🌍 Connection & IP Test"}
                          {activeTool === "ping" && "⚡ Latency (Ping) Test"}
                        </h2>
                        <button onClick={() => setActiveTool(null)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>✕ Close Tool</button>
                      </div>

                      {activeTool === "speed" && (
                        <div style={{ flex: 1, borderRadius: "12px", overflow: "hidden", background: "#fff" }}>
                          <iframe src="https://openspeedtest.com/Get-widget.php" width="100%" height="100%" style={{ border: "none", minHeight: "600px" }}></iframe>
                        </div>
                      )}

                      {activeTool === "ip" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
                          {ipData ? (
                            <>
                              <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <p style={{ color: "var(--muted-text)", margin: "0 0 0.5rem 0" }}>Your Current IP Address</p>
                                <h1 style={{ margin: 0, color: "#22c55e", fontSize: "2.5rem" }}>{ipData.ip}</h1>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}><p style={{ color: "var(--muted-text)", margin: "0 0 0.5rem 0" }}>ISP / Network</p><h3 style={{ margin: 0, color: "#FFF" }}>{ipData.org}</h3></div>
                                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}><p style={{ color: "var(--muted-text)", margin: "0 0 0.5rem 0" }}>Location</p><h3 style={{ margin: 0, color: "#FFF" }}>{ipData.city}, {ipData.country_name}</h3></div>
                              </div>
                              <div style={{ marginTop: "1rem", padding: "1.5rem", background: isVpnConnected ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: `1px solid ${isVpnConnected ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                                {isVpnConnected ? <h3 style={{ margin: 0, color: "#22c55e" }}>🟢 Your Connection is Secured & Hidden.</h3> : <h3 style={{ margin: 0, color: "#ef4444" }}>🔴 Your Original ISP is visible! Connect your VPN.</h3>}
                              </div>
                            </>
                          ) : <p>Loading IP Data...</p>}
                        </div>
                      )}

                      {activeTool === "ping" && (
                        <div style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
                          <h3 style={{ color: "var(--muted-text)", textAlign: "center" }}>Test connection stability to Cloudflare (1.1.1.1)</h3>
                          {pingResult !== null && (
                            <div style={{ width: "200px", height: "200px", borderRadius: "50%", border: "4px solid #6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", boxShadow: "0 0 30px rgba(99,102,241,0.2)" }}>
                              <h1 style={{ margin: 0, fontSize: "3rem", color: "#FFF" }}>{pingResult}</h1><p style={{ margin: 0, color: "#818cf8", fontWeight: "bold" }}>ms (Ping)</p>
                            </div>
                          )}
                          <button onClick={runPingTest} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "30px", border: "none", color: "#FFF", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" }}>Run Ping Test</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                        
                        {/* 🟢 Card 1: LIVE CONNECTION */}
                        <div style={{ background: isVpnConnected === true ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", position: "relative", overflow: "hidden" }}>
                          <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", opacity: 0.9 }}>📡 LIVE CONNECTION</p>
                          <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "12px", height: "12px", background: "#FFF", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #FFF", animation: isVpnConnected ? "pulse 2s infinite" : "none" }}></span>
                            {isVpnConnected === null ? "Checking..." : isVpnConnected ? "Secured" : "VPN is OFF"}
                          </h2>
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>{isVpnConnected ? `IP: ${ipData?.ip}` : "Your real ISP is visible!"}</p>
                        </div>

                        {/* ⏳ Card 2: COUNTDOWN */}
                        <div style={{ background: isExpired ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", position: "relative", overflow: "hidden" }}>
                          <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", opacity: 0.9 }}>⏳ EXPIRES IN</p>
                          <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "bold" }}>{daysLeft === null ? "Unlimited" : isExpired ? "Expired" : `${daysLeft}d`}</h2>
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : "Unlimited Plan"}</p>
                        </div>

                        {/* 📊 Card 3: SCRAPED DATA USAGE */}
                        <div style={{ background: "rgba(30, 30, 40, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", color: "var(--muted-text)" }}>📊 DATA USED</p>
                            
                            {loadingUsage ? (
                              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "rgba(255,255,255,0.5)", animation: "pulse 1.5s infinite" }}>Syncing Data...</h2>
                            ) : usageData ? (
                              <>
                                <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "bold" }}>{usageData.dataUsed}</h2>
                                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "var(--muted-text)" }}>{usageData.limit}</p>
                              </>
                            ) : (
                              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>Data Unavailable</h2>
                            )}
                          </div>
                          <button onClick={() => {
                            if (user.subscriptionLink) {
                               setLoadingUsage(true);
                               fetch(`/api/usage?url=${encodeURIComponent(user.subscriptionLink)}`).then(res=>res.json()).then(data=>setUsageData(data)).finally(()=>setLoadingUsage(false));
                            } else alert("Usage link not set by Admin.");
                          }} style={{ marginTop: "1rem", width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", padding: "0.8rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                            {usageData ? "Refresh Data ↻" : "Load Usage"}
                          </button>
                        </div>

                      </div>

                      {/* 🛠️ IN-APP VPN TOOLS SECTION */}
                      <div style={{ marginTop: "1rem" }}>
                        <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#FFF" }}>🛠️ Essential VPN Tools</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                          
                          <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.5rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => setActiveTool("speed")}>
                            <div style={{ width: "50px", height: "50px", background: "rgba(99,102,241,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🚀</div>
                            <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.2rem 0" }}>Speed Test</h4><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>Check tunnel speed</p></div>
                          </div>

                          <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.5rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => setActiveTool("ip")}>
                            <div style={{ width: "50px", height: "50px", background: "rgba(34,197,94,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🌍</div>
                            <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.2rem 0" }}>IP & Location</h4><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>Verify IP is hidden</p></div>
                          </div>

                          <div className="glass-panel hover:scale-[1.02]" style={{ padding: "1.5rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => setActiveTool("ping")}>
                            <div style={{ width: "50px", height: "50px", background: "rgba(245,158,11,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>⚡</div>
                            <div style={{ flex: 1 }}><h4 style={{ margin: "0 0 0.2rem 0" }}>Latency (Ping)</h4><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>Game stability test</p></div>
                          </div>

                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* අනිත් TABS සේරම කලින් විදිහටම තියෙනවා... */}
          {activeTab === "configs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeInUp 0.3s ease" }}>
               <div className="glass-panel" style={{ padding: "3rem", position: "relative" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#FFF" }}>Your VLESS Configuration Key</h2>
                <div style={{ background: "#050505", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <code style={{ color: "#22c55e", fontSize: "1rem", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {user.vpnConfigKey || "No config assigned yet."}
                  </code>
                  {hasActivePlan && (
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
                     <button onClick={() => { setModalPackage(pkg.name); setSelectedQuota(null); }} style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", fontSize: "1rem", border: "none", cursor: "pointer", marginTop: "auto" }}>🛒 Buy Now</button>
                   </div>
                 ))}
               </div>
             )}
           </div>
          )}

          {/* DYNAMIC QUOTA MODAL */}
          {modalPackage && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
              <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "2.5rem", background: "#0a0a0f", position: "relative", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "16px" }}>
                <button onClick={() => setModalPackage(null)} style={{ position: "absolute", top: "1rem", right: "1.5rem", background: "none", border: "none", color: "var(--muted-text)", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
                <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Select Data Quota</h2>
                <p style={{ color: "#6366f1", marginBottom: "2rem", fontWeight: "bold" }}>{modalPackage}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                  {Object.entries(pricingRules[modalPackage] || {}).map(([quota, price]) => (
                    <button key={quota} onClick={() => setSelectedQuota(quota)} style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem", background: selectedQuota === quota ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.02)", border: "1px solid", borderColor: selectedQuota === quota ? "#818cf8" : "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#FFFFFF", fontSize: "1.1rem", cursor: "pointer" }}>
                      <span style={{ fontWeight: selectedQuota === quota ? "bold" : "normal" }}>{quota}</span>
                      <span style={{ fontWeight: "bold" }}>RS {price}</span>
                    </button>
                  ))}
                </div>
                <button onClick={handleConfirmOrder} disabled={!selectedQuota} style={{ width: "100%", padding: "1rem", background: selectedQuota ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.1)", color: selectedQuota ? "#FFF" : "rgba(255,255,255,0.3)", fontWeight: "bold", fontSize: "1.1rem", cursor: selectedQuota ? "pointer" : "not-allowed", borderRadius: "8px", border: "none" }}>Confirm Order via WhatsApp</button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* LIQUID GLASS BUBBLE TASKBAR */}
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
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }
        
        @media (max-width: 768px) {
          .desktop-name { display: none !important; }
          .dashboard-title { font-size: 1.5rem !important; }
          .taskbar-label { display: none !important; } 
        }
      `}</style>
    </div>
  );
}
