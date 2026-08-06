"use client";

import { useState } from "react";
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

  const [user, setUser] = useState(initialUser);
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [avatar, setAvatar] = useState<string | null>(user.image);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🚀 User ට Config එකක් තියෙනවද කියලා Check කරන ලොජික් එක
  const hasActivePlan = Boolean(user.vpnConfigKey && user.vpnConfigKey.length > 5);

  // Expiry Date එකෙන් දවස් කීයද කියලා බලනවා
  const daysLeft = user.expiryDate ? Math.ceil((new Date(user.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

  const handleConfirmOrder = () => {
    if (!modalPackage || !selectedQuota) return;
    const price = pricingRules[modalPackage][selectedQuota];
    window.open(`https://wa.me/94753403800?text=${encodeURIComponent(`Hi, I want to purchase the ${modalPackage} with ${selectedQuota} Quota (RS ${price}).`)}`, "_blank");
    setModalPackage(null);
    setSelectedQuota(null);
  };

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setAvatar(gifPath === "" ? (initialUser.googleImage || null) : gifPath);
    const res = await updateUserAvatar(gifPath);
    if (res.success) router.refresh();
    else { alert("Error updating avatar!"); setAvatar(initialUser.image); }
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

  if (user.email === "dulangathipul@gmail.com") {
    tabs.push({ id: "admin", label: "Admin", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, isLink: true, href: "/dashboard/admin" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#FFFFFF", paddingBottom: "100px", position: "relative", zIndex: 1 }}>
      <DashboardMatrix />
      
      <main style={{ padding: "3rem 1.5rem", maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        
        {/* HEADER */}
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
          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* 🟢 1.1 CONFIG නැති අයට (FREE TRIAL UI) 🟢 */}
              {!hasActivePlan ? (
                <>
                  {!showTestPlans ? (
                    <div className="glass-panel animate-fade-in" style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(10, 10, 15, 0.6)", borderRadius: "16px" }}>
                      <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "#FFF" }}>Welcome to Legion VPN</h2>
                      <p style={{ color: "var(--muted-text)", marginBottom: "2.5rem" }}>You don't have any active subscriptions yet.</p>
                      <button onClick={() => setShowTestPlans(true)} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "8px", fontWeight: "bold", border: "none", color: "#FFF", cursor: "pointer", fontSize: "1.1rem" }}>
                        Get a test plan →
                      </button>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                         <div>
                           <h2 style={{ fontSize: "1.6rem", color: "#FFF", margin: "0 0 0.5rem 0" }}>Choose a Test Plan</h2>
                           <p style={{ color: "var(--muted-text)", margin: 0, fontSize: "0.95rem" }}>Select a trial package to test our premium speeds.</p>
                         </div>
                         <button onClick={() => setShowTestPlans(false)} style={{ background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", padding: "0.5rem 1.5rem", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                        {testPackages.map((pkg, index) => (
                          <div key={index} className="glass-panel" style={{ padding: "2rem", background: "rgba(18, 18, 28, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                               <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold" }}>🧪 TEST</span>
                               <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "1.2rem" }}>FREE</span>
                            </div>
                            <div style={{ marginBottom: "1.5rem", flex: 1 }}>
                              <p style={{ fontSize: "0.75rem", color: "var(--muted-text)", fontWeight: "bold", marginBottom: "0.5rem" }}>{pkg.provider}</p>
                              <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.3rem", color: "#FFF" }}>{pkg.name}</h3>
                              <div style={{ borderLeft: "3px solid #6366f1", paddingLeft: "1rem", marginBottom: "1.5rem" }}>
                                 <p style={{ color: "var(--muted-text)", fontSize: "0.95rem", margin: 0 }}>{pkg.desc}</p>
                              </div>
                            </div>
                            <button onClick={() => window.open(`https://wa.me/94753403800?text=${encodeURIComponent(`Hi, I would like to activate a FREE Trial for: ${pkg.name}`)}`, "_blank")} style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "linear-gradient(90deg, #6366f1, #a855f7)", color: "#FFF", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                              🚀 Activate Free Trial
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (

              /* 🟢 1.2 CONFIG තියෙන අයට (ACTIVE DASHBOARD - CLOUDNET STYLE) 🟢 */
                <div className="animate-fade-in flex flex-col gap-6">
                  
                  {/* Global Alert / Payment Confirmed Notification */}
                  <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ background: "rgba(99,102,241,0.2)", padding: "10px", borderRadius: "10px", color: "#818cf8" }}>🔔</div>
                    <div>
                      <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF", fontSize: "1rem" }}>Welcome back, {user.name.split(" ")[0]}!</h4>
                      <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.85rem" }}>Your secure tunnel is ready. {user.alertMessage && <span style={{color: "#ef4444", fontWeight: "bold"}}>{user.alertMessage}</span>}</p>
                    </div>
                  </div>

                  {/* 🚀 STATUS CARDS ROW (CloudNet Style) */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                    
                    {/* Card 1: VPN STATUS */}
                    <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", position: "relative", overflow: "hidden", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)" }}>
                      <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", opacity: 0.9 }}>📡 VPN STATUS</p>
                      <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "12px", height: "12px", background: "#FFF", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #FFF" }}></span>
                        {user.vpnStatus || "Active"}
                      </h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>Secure Tunnel Connected</p>
                    </div>

                    {/* Card 2: EXPIRES IN */}
                    <div style={{ background: (!daysLeft || daysLeft < 4) ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", position: "relative", overflow: "hidden", boxShadow: "0 10px 20px rgba(139, 92, 246, 0.2)" }}>
                      <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", opacity: 0.9 }}>⏳ EXPIRES IN</p>
                      <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "bold" }}>
                        {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : "0d") : "∞"}
                      </h2>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>
                        {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : "Unlimited Plan"}
                      </p>
                    </div>

                    {/* Card 3: DATA USED & VIEW USAGE */}
                    <div style={{ background: "rgba(30, 30, 40, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.5rem", color: "#FFF", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px", color: "var(--muted-text)" }}>📊 DATA USAGE</p>
                        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Track Data</h2>
                      </div>
                      <button 
                        onClick={() => user.subscriptionLink ? window.open(user.subscriptionLink, "_blank") : alert("Usage link not available.")}
                        style={{ marginTop: "1rem", width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", padding: "0.8rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                        View Live Usage →
                      </button>
                    </div>

                  </div>

                  {/* 🚀 VPN TOOLS SECTION (අලුත් එක) */}
                  <div style={{ marginTop: "2rem" }}>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
                      🛠️ Essential VPN Tools
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                      
                      {/* Tool 1: Speed Test */}
                      <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem" }}>
                        <div style={{ width: "50px", height: "50px", background: "rgba(99,102,241,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🚀</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF" }}>Network Speed Test</h4>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)", marginBottom: "0.8rem" }}>Check your tunnel speed</p>
                          <button onClick={() => window.open("https://fast.com", "_blank")} style={{ background: "#6366f1", color: "#FFF", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "bold" }}>Run Speedtest</button>
                        </div>
                      </div>

                      {/* Tool 2: IP Checker */}
                      <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem" }}>
                        <div style={{ width: "50px", height: "50px", background: "rgba(34,197,94,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🌍</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF" }}>IP & Leak Test</h4>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)", marginBottom: "0.8rem" }}>Verify IP is hidden</p>
                          <button onClick={() => window.open("https://ipleak.net", "_blank")} style={{ background: "transparent", border: "1px solid #22c55e", color: "#22c55e", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "bold" }}>Check IP Status</button>
                        </div>
                      </div>

                      {/* Tool 3: Copy Config Shortcut */}
                      <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(15, 15, 20, 0.6)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem" }}>
                        <div style={{ width: "50px", height: "50px", background: "rgba(245,158,11,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🔑</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF" }}>VLESS Config</h4>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)", marginBottom: "0.8rem" }}>Get your secure key</p>
                          <button onClick={() => { setActiveTab("configs"); window.scrollTo({top:0, behavior:"smooth"}); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#FFF", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "bold" }}>View & Copy Code</button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* අනිත් TABS (Configs, Store, Tutorials, etc.) කලින් විදිහටම තියෙනවා */}
          {activeTab === "configs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeInUp 0.3s ease" }}>
               {/* Config Key Section Only (No duplicates) */}
               <div className="glass-panel" style={{ padding: "3rem", position: "relative" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#FFF" }}>Your VLESS Configuration Key</h2>
                <div style={{ background: "#050505", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <code style={{ color: "#22c55e", fontSize: "1rem", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
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

          {/* Buy Store Section */}
          {activeTab === "buy" && (
            // (Store code from previous remains exactly same here)
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
          
        </div>
      </main>

      {/* LIQUID GLASS BUBBLE TASKBAR */}
      <nav style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem", background: "rgba(5, 5, 10, 0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "50px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.05)" }}>
        {tabs.map(tab => {
          if (tab.isLink) {
             return <Link key={tab.id} href={tab.href as string} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "45px", height: "45px", borderRadius: "50%", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}><span>{tab.icon}</span></Link>;
          }
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: isActive ? "0.6rem" : "0", padding: isActive ? "0 1.2rem 0 1rem" : "0", height: "45px", minWidth: isActive ? "auto" : "45px", width: isActive ? "auto" : "45px", justifyContent: "center", background: isActive ? "rgba(99, 102, 241, 0.2)" : "transparent", color: isActive ? "#818cf8" : "rgba(255,255,255,0.5)", borderRadius: "25px", border: "1px solid", borderColor: isActive ? "rgba(99, 102, 241, 0.3)" : "transparent", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", whiteSpace: "nowrap", overflow: "hidden" }}>
              <span>{tab.icon}</span>
              <span className="taskbar-label" style={{ maxWidth: isActive ? "120px" : "0px", opacity: isActive ? 1 : 0, transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", fontWeight: "bold", fontSize: "0.9rem" }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

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

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @media (max-width: 768px) {
          .desktop-name { display: none !important; }
          .dashboard-title { font-size: 1.5rem !important; }
          .taskbar-label { display: none !important; } 
        }
        @media (min-width: 769px) {
          .dashboard-title { font-size: 2rem !important; }
        }
      `}</style>
    </div>
  );
}
