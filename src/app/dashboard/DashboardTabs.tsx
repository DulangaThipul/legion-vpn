"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import DashboardMatrix from "@/components/DashboardMatrix";

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

export default function DashboardLayout({ user: initialUser }: { user: any }) {
  const [activeTab, setActiveTab] = useState("configs");
  const [selectedProvider, setSelectedProvider] = useState<"Airtel" | "Dialog" | "SLT" | null>(null);
  
  // Modal State
  const [modalPackage, setModalPackage] = useState<string | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);

  // Profile Mock State
  const [user, setUser] = useState(initialUser);
  const [editName, setEditName] = useState(user.name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [avatar, setAvatar] = useState<string | null>(user.image);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfirmOrder = () => {
    if (!modalPackage || !selectedQuota) return;
    const price = pricingRules[modalPackage][selectedQuota];
    const message = `Hi, I want to purchase the ${modalPackage} with ${selectedQuota} Quota (RS ${price}).`;
    const whatsappUrl = `https://wa.me/94700000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    setModalPackage(null);
    setSelectedQuota(null);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, name: editName, email: editEmail, image: avatar });
    alert("Profile updated successfully (Mocked)");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setAvatar(objectUrl);
    }
  };

  const tabs = [
    { id: "configs", label: "My Configs", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg> },
    { id: "buy", label: "Buy Config", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> },
    { id: "profile", label: "Profile", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
    { id: "home", label: "Home", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>, isLink: true, href: "/" }
  ];

  if (user.email === "dulangathipul@gmail.com") {
    tabs.push({ 
      id: "admin", 
      label: "Admin Panel", 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, 
      isLink: true, 
      href: "/dashboard/admin" 
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#FFFFFF", paddingBottom: "100px", position: "relative", zIndex: 1 }}>
      <DashboardMatrix />
      
      {/* MAIN CONTENT AREA */}
      <main style={{ padding: "3rem 1.5rem", maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "300", letterSpacing: "1px" }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="hidden sm:block" style={{ fontWeight: "600", fontSize: "1.1rem" }}>{user.name}</span>
            {avatar ? (
              <img src={avatar} alt="Profile" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid #FFFFFF", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#333", border: "2px solid #FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div>
          
          {/* MY CONFIGS TAB */}
          {activeTab === "configs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* How the Legion Network Works */}
              <div className="glass-panel" style={{ padding: "3rem", borderLeft: "4px solid #FFFFFF", position: "relative", overflow: "hidden", animation: "fadeInUp 0.5s ease forwards", opacity: 0 }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)", filter: "blur(20px)" }} />
                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#FFFFFF", textShadow: "0 0 15px rgba(255,255,255,1)" }}>●</span> How the Legion Network Works
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <p style={{ color: "var(--muted-text)", lineHeight: 1.8, fontSize: "1.1rem", margin: 0 }}>
                    Legion VPN bypasses localized ISP restrictions (Airtel/Dialog/SLT) by routing your traffic through an encrypted AES-256 VLESS/Reality Secure Tunnel. This masks your SNI (Server Name Indication) packet data, turning restricted host payloads into unsecured white-listed traffic, and tunnels it straight to our premium Singapore Core Infrastructure before fetching your unthrottled internet requests.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.8, fontSize: "1rem", margin: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
                    Legion VPN මගින් ඔබගේ අන්තර්ජාල සේවා සපයන්නාගේ (Airtel/Dialog/SLT) සීමාවන් මගහැර, ඔබගේ දත්ත AES-256 VLESS/Reality Secure Tunnel එකක් හරහා සංකේතනය කර යවයි. මෙහිදී ඔබගේ SNI දත්ත වසන් කර, සීමා කරන ලද වෙබ් අඩවි දත්ත, ආරක්ෂිත white-listed දත්ත බවට පත් කර, අපගේ Premium සිංගප්පූරු සේවාදායකය වෙත යවා වේගවත් අන්තර්ජාල පහසුකම් ලබා දෙයි.
                  </p>
                </div>
              </div>

              {/* Your VPN Configuration Key & Usage */}
              <div className="glass-panel hover:scale-[1.01] transition-transform duration-300" style={{ padding: "3rem", position: "relative", animation: "fadeInUp 0.5s ease forwards 0.1s", opacity: 0 }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Your Unique VLESS Configuration Key</h2>
                  <button 
                    className="btn" 
                    onClick={() => user.subscriptionLink ? window.open(user.subscriptionLink, "_blank") : alert("Usage link not available.")}
                    style={{ 
                      background: "rgba(255,255,255,0.1)", 
                      color: "#FFFFFF", 
                      border: "1px solid rgba(255,255,255,0.3)",
                      padding: "0.5rem 1.5rem",
                      fontSize: "0.9rem",
                      borderRadius: "20px",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.color = "#000000";
                      e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.8)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "#FFFFFF";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    📊 View Usage
                  </button>
                </div>

                <div style={{ 
                  background: "#050505", 
                  padding: "1.5rem", 
                  borderRadius: "12px", 
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  wordBreak: "break-all"
                }}>
                  <code style={{ color: "#FFFFFF", fontSize: "1.1rem", fontFamily: "'Courier New', Courier, monospace" }}>
                    {user.vpnConfigKey || "No config assigned yet. Please purchase a package."}
                  </code>
                  {user.vpnConfigKey && (
                    <button 
                      className="btn" 
                      style={{ 
                        alignSelf: "flex-start", 
                        background: "#FFFFFF", 
                        color: "#000000", 
                        fontWeight: "bold",
                        border: "none",
                        padding: "0.8rem 2.5rem",
                        fontSize: "1rem",
                        cursor: "pointer",
                        transition: "transform 0.2s ease"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                      onClick={() => {
                        navigator.clipboard.writeText(user.vpnConfigKey);
                        alert("Copied to clipboard!");
                      }}
                    >
                      Copy Key
                    </button>
                  )}
                </div>
              </div>

              {/* Setup Guides & Clients (Bilingual) */}
              <div className="glass-panel" style={{ padding: "3rem", animation: "fadeInUp 0.5s ease forwards 0.2s", opacity: 0 }}>
                <h2 style={{ marginBottom: "2.5rem", fontSize: "1.8rem" }}>Client Configuration Workflows</h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem" }}>
                  
                  {/* NetMod Guide */}
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "2.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "#FFFFFF" }} />
                    <h3 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", color: "#FFFFFF" }}>Android & Windows PC<br/><span style={{ fontSize: "1rem", color: "var(--muted-text)", fontWeight: "normal" }}>(NetMod HTTP)</span></h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem", color: "var(--muted-text)", lineHeight: 1.6 }}>
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem" }}><span style={{ color: "#FFFFFF", fontWeight: "bold" }}>1.</span> Click the Download button to grab NetMod for your device.</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginLeft: "1.2rem", marginTop: "0.2rem" }}>NetMod ඇප් එක පහළින් Download කරගන්න.</div>
                      </div>
                      
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem" }}><span style={{ color: "#FFFFFF", fontWeight: "bold" }}>2.</span> Copy your unique VLESS Configuration Key from the panel above.</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginLeft: "1.2rem", marginTop: "0.2rem" }}>ඔබගේ VLESS කන්ෆිග් කී (Configuration Key) එක කොපි කරගන්න.</div>
                      </div>

                      <div>
                        <div style={{ display: "flex", gap: "0.5rem" }}><span style={{ color: "#FFFFFF", fontWeight: "bold" }}>3.</span> Open NetMod, navigate to Menu &gt; Import Config from Clipboard, and hit the 'Start' terminal button.</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginLeft: "1.2rem", marginTop: "0.2rem" }}>NetMod ඇප් එක open කරලා, Menu එකට ගිහින් 'Import Config from Clipboard' තෝරන්න. ඊට පස්සෙ 'Start' button එක ඔබන්න.</div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <button className="btn btn-outline hover:scale-105 transition-transform duration-300" style={{ flex: 1, padding: "0.8rem", fontSize: "0.95rem" }} onClick={() => window.open("https://play.google.com/store/apps/details?id=com.netmod.syna&hl=en&pli=1", "_blank")}>
                        Download Android
                      </button>
                      <button className="btn btn-outline hover:scale-105 transition-transform duration-300" style={{ flex: 1, padding: "0.8rem", fontSize: "0.95rem" }} onClick={() => window.open("https://sourceforge.net/projects/netmodhttp/", "_blank")}>
                        Download PC
                      </button>
                    </div>
                  </div>

                  {/* V2Box Guide */}
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "2.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "#FFFFFF" }} />
                    <h3 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", color: "#FFFFFF" }}>iOS / iPhone<br/><span style={{ fontSize: "1rem", color: "var(--muted-text)", fontWeight: "normal" }}>(V2Box Client)</span></h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem", color: "var(--muted-text)", lineHeight: 1.6 }}>
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem" }}><span style={{ color: "#FFFFFF", fontWeight: "bold" }}>1.</span> Download V2Box from the Apple App Store using our direct button.</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginLeft: "1.2rem", marginTop: "0.2rem" }}>පහළ තියෙන button එකෙන් V2Box ඇප් එක Download කරගන්න.</div>
                      </div>

                      <div>
                        <div style={{ display: "flex", gap: "0.5rem" }}><span style={{ color: "#FFFFFF", fontWeight: "bold" }}>2.</span> Copy the VLESS configuration key generated for your account.</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginLeft: "1.2rem", marginTop: "0.2rem" }}>ඔබගේ VLESS කන්ෆිග් කී (Configuration Key) එක කොපි කරගන්න.</div>
                      </div>

                      <div>
                        <div style={{ display: "flex", gap: "0.5rem" }}><span style={{ color: "#FFFFFF", fontWeight: "bold" }}>3.</span> Open V2Box, tap the '+' sign at the top right, select 'Import v2ray config from clipboard', and switch on the connection toggle.</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginLeft: "1.2rem", marginTop: "0.2rem" }}>V2Box ඇප් එක open කරලා, උඩ දකුණු පැත්තේ තියෙන '+' ලකුණ ඔබලා, 'Import v2ray config from clipboard' තෝරලා connect කරන්න.</div>
                      </div>
                    </div>
                    
                    <button className="btn btn-outline hover:scale-105 transition-transform duration-300" style={{ width: "100%", padding: "0.8rem", fontSize: "0.95rem" }} onClick={() => window.open("https://apps.apple.com/us/app/v2box-v2ray-client/id6446814690", "_blank")}>
                      Download iOS
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* BUY CONFIG TAB */}
          {activeTab === "buy" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap", justifyContent: "center" }}>
                {(["Airtel", "Dialog", "SLT"] as const).map(provider => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className="btn hover:scale-105"
                    style={{ 
                      minWidth: "130px", 
                      fontSize: "1.1rem",
                      background: selectedProvider === provider ? "#FFFFFF" : "transparent",
                      color: selectedProvider === provider ? "#000000" : "#FFFFFF",
                      border: "1px solid #FFFFFF",
                      borderRadius: "30px",
                      boxShadow: selectedProvider === provider ? "0 0 15px rgba(255,255,255,0.5)" : "none",
                      transition: "all 0.3s ease"
                    }}
                  >
                    {provider}
                  </button>
                ))}
              </div>

              {!selectedProvider && (
                <div className="animate-fade-in glass-panel" style={{ padding: "2rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
                  <p style={{ color: "var(--muted-text)", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "1.05rem" }}>
                    If you are using a mobile SIM, internet speeds vary depending on your device and location, making it difficult to maintain a stable connection speed; please note that this is not an issue caused by us at LEGION VPN.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
                    ඔයා use කරන්නෙ Mobile Sim එකක් නම් packages වල internet speed එක ඔයාගෙ Device එක අනුව සහ ස්තානය අනුව වෙනස් වෙන නිසා Mobile Sim එකකින් stable connection speed එකක් තියාගන්න අමාරු වෙනවා. එය LEGION VPN වන අපගේ දෝශයක් නොවන බව කරුණාවෙන් දන්වා සිටිමු.
                  </p>
                </div>
              )}

              {selectedProvider && (
                <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                  {packages[selectedProvider].map((pkg, index) => (
                    <div key={index} className="glass-panel" style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      justifyContent: "space-between", 
                      padding: "2.5rem",
                      transition: "all 0.3s ease",
                      animation: `fadeInUp 0.5s ease forwards ${index * 0.1}s`,
                      opacity: 0,
                      transform: "translateY(20px)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      position: "relative",
                      overflow: "hidden"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                      e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
                      e.currentTarget.style.boxShadow = "0 15px 40px rgba(255,255,255,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }} />
                      
                      <div style={{ marginBottom: "2rem" }}>
                        <span style={{ 
                          display: "inline-block", 
                          padding: "0.4rem 1rem", 
                          background: "rgba(255,255,255,0.1)", 
                          borderRadius: "30px", 
                          fontSize: "0.75rem", 
                          fontWeight: "bold", 
                          letterSpacing: "1.5px", 
                          textTransform: "uppercase",
                          marginBottom: "1.5rem",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          Premium Access
                        </span>
                        <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.5rem", lineHeight: 1.4, fontWeight: "500" }}>{pkg.name}</h3>
                        
                        <ul style={{ padding: 0, margin: 0, listStyle: "none", color: "var(--muted-text)", fontSize: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <li style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ color: "#000000", background: "#FFFFFF", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold" }}>✓</span> 
                            Unthrottled High Speed
                          </li>
                          <li style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ color: "#000000", background: "#FFFFFF", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold" }}>✓</span> 
                            Secure XTLS-Reality Tunnel
                          </li>
                          <li style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ color: "#000000", background: "#FFFFFF", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold" }}>✓</span> 
                            Gaming Optimized Ping
                          </li>
                        </ul>
                      </div>

                      <button 
                        onClick={() => {
                          setModalPackage(pkg.name);
                          setSelectedQuota(null);
                        }}
                        style={{ 
                          width: "100%",
                          padding: "1.2rem", 
                          borderRadius: "30px",
                          background: "#FFFFFF",
                          color: "#000000",
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 0 20px rgba(255,255,255,0.2)",
                          marginTop: "auto"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.boxShadow = "0 0 30px rgba(255,255,255,0.6)";
                          e.currentTarget.style.transform = "scale(1.03)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.2)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        Select Package →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="glass-panel hover:scale-[1.01] transition-transform duration-300" style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto", animation: "fadeInUp 0.5s ease forwards", opacity: 0 }}>
              <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Edit Profile</h2>
              
              <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Avatar Upload Drop Zone */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      border: "2px dashed rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.5)",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = "#FFFFFF"}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"}
                  >
                    {avatar ? (
                      <img src={avatar} alt="Avatar Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "2rem", color: "var(--muted-text)" }}>+</span>
                    )}
                    <div style={{ 
                      position: "absolute", 
                      bottom: 0, width: "100%", 
                      background: "rgba(0,0,0,0.6)", 
                      textAlign: "center", 
                      padding: "5px",
                      fontSize: "0.75rem",
                      color: "#FFFFFF"
                    }}>
                      Upload
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: "none" }} 
                    onChange={handleAvatarChange}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted-text)" }}>Full Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "1rem", 
                      background: "rgba(0,0,0,0.5)", 
                      border: "1px solid rgba(255,255,255,0.2)", 
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted-text)" }}>Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "1rem", 
                      background: "rgba(0,0,0,0.5)", 
                      border: "1px solid rgba(255,255,255,0.2)", 
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }} 
                  />
                </div>
                <button type="submit" className="btn" style={{ 
                  background: "#FFFFFF", 
                  color: "#000000", 
                  fontWeight: "bold",
                  padding: "1rem",
                  marginTop: "1rem",
                  fontSize: "1.1rem",
                  borderRadius: "30px"
                }}>
                  Save Changes
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* LIQUID GLASS BUBBLE TASKBAR (WHITE CYBERPUNK THEME) */}
      <nav style={{
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem",
        background: "rgba(5, 5, 5, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "50px",
        zIndex: 100,
        boxShadow: "0 0 25px rgba(255, 255, 255, 0.1), inset 0 0 10px rgba(255,255,255,0.05)"
      }}>
        {tabs.map(tab => {
          if (tab.isLink) {
            return (
              <Link 
                key={tab.id} 
                href={tab.href as string}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  color: "rgba(255,255,255,0.4)",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  background: "transparent"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#FFFFFF";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.textShadow = "0 0 10px rgba(255,255,255,0.8)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.textShadow = "none";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.icon}</span>
              </Link>
            );
          }

          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: isActive ? "0.8rem" : "0",
                padding: isActive ? "0 1.5rem 0 1rem" : "0",
                height: "50px",
                minWidth: isActive ? "auto" : "50px",
                width: isActive ? "auto" : "50px",
                justifyContent: "center",
                background: isActive ? "#FFFFFF" : "transparent",
                color: isActive ? "#000000" : "rgba(255,255,255,0.4)",
                borderRadius: "25px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)", 
                whiteSpace: "nowrap",
                overflow: "hidden",
                boxShadow: isActive ? "0 0 20px rgba(255, 255, 255, 0.6)" : "none"
              }}
              onMouseOver={(e) => { 
                if (!isActive) {
                  e.currentTarget.style.color = "#FFFFFF"; 
                  e.currentTarget.style.textShadow = "0 0 10px rgba(255,255,255,0.8)";
                }
              }}
              onMouseOut={(e) => { 
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)"; 
                  e.currentTarget.style.textShadow = "none";
                }
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", textShadow: "none" }}>{tab.icon}</span>
              <span style={{ 
                maxWidth: isActive ? "150px" : "0px", 
                opacity: isActive ? 1 : 0, 
                transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                fontWeight: "bold",
                fontSize: "1rem"
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* DYNAMIC QUOTA MODAL */}
      {modalPackage && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          animation: "fadeIn 0.3s ease"
        }}>
          <div className="glass-panel" style={{ 
            width: "100%", 
            maxWidth: "500px", 
            padding: "3rem", 
            background: "#0a0a0a",
            position: "relative"
          }}>
            <button 
              onClick={() => setModalPackage(null)}
              style={{ position: "absolute", top: "1rem", right: "1.5rem", background: "none", border: "none", color: "#FFFFFF", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Select Data Quota</h2>
            <p style={{ color: "var(--muted-text)", marginBottom: "2rem" }}>{modalPackage}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {Object.entries(pricingRules[modalPackage] || {}).map(([quota, price]) => (
                <button
                  key={quota}
                  onClick={() => setSelectedQuota(quota)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "1.5rem",
                    background: selectedQuota === quota ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid",
                    borderColor: selectedQuota === quota ? "#FFFFFF" : "rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontWeight: selectedQuota === quota ? "bold" : "normal" }}>{quota}</span>
                  <span style={{ fontWeight: "bold" }}>RS {price}</span>
                </button>
              ))}
            </div>

            <button 
              className="btn"
              onClick={handleConfirmOrder}
              disabled={!selectedQuota}
              style={{ 
                width: "100%", 
                padding: "1rem", 
                background: selectedQuota ? "#FFFFFF" : "rgba(255,255,255,0.2)", 
                color: selectedQuota ? "#000000" : "rgba(255,255,255,0.5)",
                fontWeight: "bold",
                fontSize: "1.1rem",
                cursor: selectedQuota ? "pointer" : "not-allowed",
                borderRadius: "30px"
              }}
            >
              Confirm Order via WhatsApp
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
