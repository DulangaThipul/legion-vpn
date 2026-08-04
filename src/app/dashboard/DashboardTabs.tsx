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
  Airtel: [
    { name: "Airtel Old Sim 260 Package VPN" },
    { name: "Airtel New Sim Rs.297 (7D) / 997 Package VPN" }
  ],
  Dialog: [
    { name: "Dialog Router 724 Zoom Unlimited Package" }
  ],
  SLT: [
    { name: "SLT 4G/Fiber Router 490 Zoom 100GB Package" },
    { name: "SLT Fiber 1990 Unlimited" }
  ]
};

// 🚀 අලුතින් එකතු කරපු Test Packages ලිස්ට් එක (CloudNet එකේ විදිහටම)
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
  
  // 🚀 Test Plans පෙන්නන්න හදපු අලුත් State එක
  const [showTestPlans, setShowTestPlans] = useState(false);

  const [user, setUser] = useState(initialUser);
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [avatar, setAvatar] = useState<string | null>(user.image);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmOrder = () => {
    if (!modalPackage || !selectedQuota) return;
    const price = pricingRules[modalPackage][selectedQuota];
    const message = `Hi, I want to purchase the ${modalPackage} with ${selectedQuota} Quota (RS ${price}).`;
    window.open(`https://wa.me/94753403800?text=${encodeURIComponent(message)}`, "_blank");
    setModalPackage(null);
    setSelectedQuota(null);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Profile info saved successfully!");
  };

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setAvatar(gifPath === "" ? (initialUser.googleImage || null) : gifPath);
    
    const res = await updateUserAvatar(gifPath);
    if (res.success) {
      router.refresh(); 
    } else {
      alert("Error updating avatar!");
      setAvatar(initialUser.image); 
    }
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
            {tabs.find(t => t.id === activeTab)?.icon} 
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="desktop-name" style={{ fontWeight: "600", fontSize: "1rem", color: "var(--muted-text)" }}>
              {user.name} <br/><span style={{ fontSize: "0.75rem", color: "#6366f1" }}>Premium User</span>
            </span>
            <div onClick={() => setActiveTab("profile")} style={{ display: "block", cursor: "pointer", flexShrink: 0 }}>
              {avatar ? (
                <img src={avatar} alt="Profile" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", objectFit: "cover", transition: "transform 0.3s ease" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"} />
              ) : (
                <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#333", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.3s ease" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        <div>
          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {!showTestPlans ? (
                <div className="glass-panel animate-fade-in" style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(10, 10, 15, 0.6)", borderRadius: "16px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                  <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "#FFF" }}>No Active VPN Plans</h2>
                  <p style={{ color: "var(--muted-text)", marginBottom: "2.5rem" }}>You don't have any active subscriptions yet.</p>
                  
                  <button onClick={() => setShowTestPlans(true)} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", padding: "1rem 3rem", borderRadius: "8px", fontWeight: "bold", border: "none", color: "#FFF", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 10px 20px rgba(99, 102, 241, 0.3)", fontSize: "1.1rem" }} onMouseOver={e => e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform="scale(1)"}>
                    Get a test plan →
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                     <div>
                       <h2 style={{ fontSize: "1.6rem", color: "#FFF", margin: "0 0 0.5rem 0" }}>Choose a Test Plan</h2>
                       <p style={{ color: "var(--muted-text)", margin: 0, fontSize: "0.95rem" }}>Select a trial package to test our premium speeds.</p>
                     </div>
                     <button onClick={() => setShowTestPlans(false)} style={{ background: "rgba(255,255,255,0.05)", color: "#FFF", border: "1px solid rgba(255,255,255,0.1)", padding: "0.5rem 1.5rem", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                       ← Back
                     </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {testPackages.map((pkg, index) => (
                      <div key={index} className="glass-panel" style={{ 
                        display: "flex", flexDirection: "column", padding: "2rem", transition: "all 0.3s ease",
                        background: "rgba(18, 18, 28, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", position: "relative"
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)"; e.currentTarget.style.transform = "translateY(-5px)"; }} 
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                           <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px", letterSpacing: "1px" }}>
                              🧪 TEST
                           </span>
                           <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "1.2rem" }}>FREE</span>
                        </div>

                        <div style={{ marginBottom: "1.5rem", flex: 1 }}>
                          <p style={{ fontSize: "0.75rem", color: "var(--muted-text)", fontWeight: "bold", letterSpacing: "1px", marginBottom: "0.5rem", textTransform: "uppercase" }}>{pkg.provider}</p>
                          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.3rem", lineHeight: 1.4, fontWeight: "600", color: "#FFF", minHeight: "55px" }}>{pkg.name}</h3>

                          <div style={{ borderLeft: "3px solid #6366f1", paddingLeft: "1rem", marginBottom: "1.5rem" }}>
                             <p style={{ color: "var(--muted-text)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>{pkg.desc}</p>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", color: "#818cf8", fontSize: "0.85rem" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                              {pkg.name.substring(0, 30)}...
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", color: "#818cf8", fontSize: "0.85rem" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                              Auto
                            </div>
                          </div>
                        </div>

                        <button onClick={() => window.open(`https://wa.me/94753403800?text=${encodeURIComponent(`Hi, I would like to activate a FREE Trial for: ${pkg.name}`)}`, "_blank")} style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "linear-gradient(90deg, #6366f1, #a855f7)", color: "#FFF", fontWeight: "bold", fontSize: "1rem", border: "none", cursor: "pointer", transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = 0.9} onMouseOut={(e) => e.currentTarget.style.opacity = 1}>
                          🚀 Activate Free Trial
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MY VPNs / CONFIGS TAB */}
          {activeTab === "configs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeInUp 0.3s ease" }}>
              <div className="glass-panel" style={{ padding: "3rem", borderLeft: "4px solid #6366f1", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%)", pointerEvents: "none" }} />
                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#6366f1", textShadow: "0 0 15px rgba(99, 102, 241, 0.8)" }}>●</span> How the Legion Network Works
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <p style={{ color: "var(--muted-text)", lineHeight: 1.8, fontSize: "1.05rem", margin: 0 }}>
                    Legion VPN bypasses localized ISP restrictions (Airtel/Dialog/SLT) by routing your traffic through an encrypted AES-256 VLESS/Reality Secure Tunnel.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.8, fontSize: "0.95rem", margin: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
                    Legion VPN මගින් ඔබගේ අන්තර්ජාල සේවා සපයන්නාගේ (Airtel/Dialog/SLT) සීමාවන් මගහැර, ඔබගේ දත්ත සංකේතනය කර යවයි.
                  </p>
                </div>
              </div>

              <div className="glass-panel hover:scale-[1.01] transition-transform duration-300" style={{ padding: "3rem", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Your Unique VLESS Configuration Key</h2>
                  <button 
                    className="btn" 
                    onClick={() => user.subscriptionLink ? window.open(user.subscriptionLink, "_blank") : alert("Usage link not available.")}
                    style={{ background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "0.5rem 1.5rem", fontSize: "0.9rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" }}
                  >
                    📊 View Usage
                  </button>
                </div>
                <div style={{ background: "#050505", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "1.5rem", wordBreak: "break-all" }}>
                  <code style={{ color: "#FFFFFF", fontSize: "1rem", fontFamily: "'Courier New', Courier, monospace", whiteSpace: "pre-wrap" }}>
                    {user.vpnConfigKey || "No config assigned yet. Please purchase a package from the Store."}
                  </code>
                  {user.vpnConfigKey && (
                    <button 
                      className="btn" 
                      style={{ alignSelf: "flex-start", background: "#FFFFFF", color: "#000000", fontWeight: "bold", border: "none", padding: "0.8rem 2.5rem", fontSize: "1rem", cursor: "pointer", borderRadius: "8px" }}
                      onClick={() => { navigator.clipboard.writeText(user.vpnConfigKey); alert("Copied to clipboard!"); }}
                    >
                      Copy Key
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. STORE (BUY VPN) TAB */}
          {activeTab === "buy" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap", justifyContent: "center" }}>
                {(["Airtel", "Dialog", "SLT"] as const).map(provider => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className="btn hover:scale-105"
                    style={{ 
                      minWidth: "140px", fontSize: "1rem", fontWeight: "bold",
                      background: selectedProvider === provider ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                      color: selectedProvider === provider ? "#818cf8" : "var(--muted-text)",
                      border: `1px solid ${selectedProvider === provider ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "12px", padding: "0.8rem 1.5rem", transition: "all 0.3s ease"
                    }}
                  >
                    {provider} Plans
                  </button>
                ))}
              </div>

              {!selectedProvider && (
                <div className="animate-fade-in glass-panel" style={{ padding: "2rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 15, 20, 0.6)", textAlign: "center", maxWidth: "800px", margin: "0 auto", borderRadius: "16px" }}>
                  <p style={{ color: "var(--muted-text)", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "1rem" }}>If you are using a mobile SIM, internet speeds vary depending on your device and location, making it difficult to maintain a stable connection speed; please note that this is not an issue caused by us at LEGION VPN.</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0, fontSize: "0.9rem" }}>ඔයා use කරන්නෙ Mobile Sim එකක් නම් packages වල internet speed එක ඔයාගෙ Device එක අනුව සහ ස්තානය අනුව වෙනස් වෙන නිසා Mobile Sim එකකින් stable connection speed එකක් තියාගන්න අමාරු වෙනවා. එය අපගේ දෝශයක් නොවන බව කරුණාවෙන් දන්වා සිටිමු.</p>
                </div>
              )}

              {selectedProvider && (
                <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                  {packages[selectedProvider].map((pkg, index) => (
                    <div key={index} className="glass-panel" style={{ 
                      display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem", transition: "all 0.3s ease",
                      background: "rgba(18, 18, 28, 0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", position: "relative"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)"; e.currentTarget.style.transform = "translateY(-5px)"; }} 
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      
                      <div style={{ marginBottom: "1.5rem" }}>
                        <span style={{ display: "inline-block", padding: "0.3rem 0.8rem", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1.5rem" }}>
                          {selectedProvider} ROUTER
                        </span>
                        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.4rem", lineHeight: 1.4, fontWeight: "600", minHeight: "60px" }}>{pkg.name}</h3>
                        
                        <p style={{ color: "var(--muted-text)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                          This is an optimized plan. Once your data quota is used up, you will need to reactivate the data package.
                        </p>
                      </div>

                      <button onClick={() => { setModalPackage(pkg.name); setSelectedQuota(null); }} style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", fontSize: "1rem", border: "none", cursor: "pointer", transition: "transform 0.2s", marginTop: "auto" }}>
                        🛒 Buy Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. TUTORIALS & APPS TAB */}
          {activeTab === "tutorials" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h2 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                   <span style={{ color: "#ef4444" }}>▶</span> Setup Guides & Video Tutorials
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem", background: "rgba(15, 15, 20, 0.6)" }}>
                    <div style={{ width: "50px", height: "50px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>▶</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>NetMod PC & Android</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>How to use with VLESS code</p>
                      <button style={{ marginTop: "1rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "0.4rem 0", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", width: "100%", fontWeight: "bold" }}>Watch Video</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "2rem" }}>
                   <span style={{ color: "#22c55e" }}>🤖</span> Download VPN Apps
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1.2rem", background: "rgba(15, 15, 20, 0.6)" }}>
                    <div style={{ width: "50px", height: "50px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: "1.5rem", flexShrink: 0 }}>⏵</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>NetMod</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>Highly Recommended (Android/PC)</p>
                      <button onClick={() => window.open("https://play.google.com/store/apps/details?id=com.netmod.syna", "_blank")} style={{ marginTop: "1rem", background: "transparent", color: "#818cf8", border: "none", padding: "0", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold" }}>📥 Download App</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SUPPORT TICKETS TAB */}
          {activeTab === "tickets" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
              <div className="glass-panel" style={{ width: "100%", padding: "3rem", textAlign: "center", background: "rgba(15, 15, 20, 0.6)", borderRadius: "16px" }}>
                <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Support Tickets</h2>
                <p style={{ color: "var(--muted-text)", marginBottom: "2rem", maxWidth: "500px", margin: "0 auto 2rem auto" }}>Need help with your VPN configuration or package? Open a support ticket.</p>
                <button style={{ background: "#FFF", color: "#000", fontWeight: "bold", padding: "0.8rem 2.5rem", borderRadius: "30px", border: "none", cursor: "pointer" }}>+ Create New Ticket</button>
              </div>
            </div>
          )}

          {/* 6. PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="glass-panel animate-fade-in" style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto", borderRadius: "16px", background: "rgba(15, 15, 20, 0.6)" }}>
              <h2 style={{ marginBottom: "2rem", textAlign: "center", color: "#FFFFFF" }}>Edit Profile</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: "3px solid #6366f1", background: "#333", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {avatar ? (
                      <img src={avatar} alt="Current Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "3rem", color: "#FFF" }}>{user?.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 style={{ textAlign: "center", color: "var(--muted-text)", marginBottom: "1.2rem", fontSize: "0.95rem" }}>Choose your Avatar</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(50px, 1fr))", gap: "1rem", justifyItems: "center" }}>
                    {AVAILABLE_AVATARS.map((gifPath) => (
                      <div key={gifPath} onClick={() => handleAvatarSelect(gifPath)} style={{ width: "50px", height: "50px", borderRadius: "50%", cursor: isUpdating ? "not-allowed" : "pointer", position: "relative", overflow: "hidden", border: avatar === gifPath ? "3px solid #6366f1" : "2px solid transparent", transition: "all 0.3s ease", opacity: isUpdating && avatar !== gifPath ? 0.5 : 1 }}>
                        <img src={gifPath} alt="Avatar option" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
                  <div><label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted-text)", fontSize: "0.9rem" }}>Full Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF", borderRadius: "8px", fontSize: "1rem" }} /></div>
                  <div><label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted-text)", fontSize: "0.9rem" }}>Email Address</label><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF", borderRadius: "8px", fontSize: "1rem" }} /></div>
                  <button type="submit" style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", fontWeight: "bold", padding: "1rem", marginTop: "1rem", fontSize: "1.1rem", borderRadius: "8px", border: "none", cursor: "pointer" }}>Save Changes</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* LIQUID GLASS BUBBLE TASKBAR */}
      <nav style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem", background: "rgba(5, 5, 10, 0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "50px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.05)" }}>
        {tabs.map(tab => {
          if (tab.isLink) {
            return (
              <Link key={tab.id} href={tab.href as string} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "45px", height: "45px", borderRadius: "50%", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "all 0.3s ease" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.icon}</span>
              </Link>
            );
          }
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: isActive ? "0.6rem" : "0", padding: isActive ? "0 1.2rem 0 1rem" : "0", height: "45px", minWidth: isActive ? "auto" : "45px", width: isActive ? "auto" : "45px", justifyContent: "center", background: isActive ? "rgba(99, 102, 241, 0.2)" : "transparent", color: isActive ? "#818cf8" : "rgba(255,255,255,0.5)", borderRadius: "25px", border: "1px solid", borderColor: isActive ? "rgba(99, 102, 241, 0.3)" : "transparent", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", whiteSpace: "nowrap", overflow: "hidden" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.icon}</span>
              <span className="taskbar-label" style={{ maxWidth: isActive ? "120px" : "0px", opacity: isActive ? 1 : 0, transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", fontWeight: "bold", fontSize: "0.9rem" }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* DYNAMIC QUOTA MODAL FOR STORE */}
      {modalPackage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, animation: "fadeIn 0.3s ease" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "2.5rem", background: "#0a0a0f", position: "relative", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "16px" }}>
            <button onClick={() => setModalPackage(null)} style={{ position: "absolute", top: "1rem", right: "1.5rem", background: "none", border: "none", color: "var(--muted-text)", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Select Data Quota</h2>
            <p style={{ color: "#6366f1", marginBottom: "2rem", fontWeight: "bold" }}>{modalPackage}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {Object.entries(pricingRules[modalPackage] || {}).map(([quota, price]) => (
                <button key={quota} onClick={() => setSelectedQuota(quota)} style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem", background: selectedQuota === quota ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.02)", border: "1px solid", borderColor: selectedQuota === quota ? "#818cf8" : "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#FFFFFF", fontSize: "1.1rem", cursor: "pointer", transition: "all 0.2s ease" }}>
                  <span style={{ fontWeight: selectedQuota === quota ? "bold" : "normal" }}>{quota}</span>
                  <span style={{ fontWeight: "bold" }}>RS {price}</span>
                </button>
              ))}
            </div>
            <button className="btn" onClick={handleConfirmOrder} disabled={!selectedQuota} style={{ width: "100%", padding: "1rem", background: selectedQuota ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.1)", color: selectedQuota ? "#FFF" : "rgba(255,255,255,0.3)", fontWeight: "bold", fontSize: "1.1rem", cursor: selectedQuota ? "pointer" : "not-allowed", borderRadius: "8px", border: "none" }}>Confirm Order via WhatsApp</button>
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
