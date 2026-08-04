"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAdmin } from "@/lib/authActions";

// 🚀 ඔයාගේ සයිට් එකේ තියෙන Packages ලිස්ට් එක 
const PACKAGE_LIST = [
  "Airtel Old Sim 260 Package",
  "Airtel New Sim Rs.297 (7D) / 997 Package",
  "Dialog Router 724 Zoom Unlimited",
  "SLT 4G/Fiber Router 490 Zoom 100GB",
  "SLT Fiber 1990 Unlimited",
  "Custom / Special Package"
];

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  // Search logic
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (userId: string, newConfig: string, newLink: string, newStatus: string, newExpiry: string) => {
    try {
      const response = await updateUserAdmin(userId, {
        vpnConfigKey: newConfig,
        subscriptionLink: newLink,
        vpnStatus: newStatus,
        expiryDate: newExpiry ? new Date(newExpiry) : null
      });

      if (response.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, vpnConfigKey: newConfig, subscriptionLink: newLink, vpnStatus: newStatus, expiryDate: newExpiry } : u));
        setToast("Changes saved successfully!");
        router.refresh();
      } else {
        alert("Failed to save changes.");
      }
    } catch (error) {
      alert("Failed to save changes: " + (error as Error).message);
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <main style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "600", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
          🛡️ Advanced CRM Dashboard
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold", background: "rgba(99,102,241,0.1)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
          ← Back to Site
        </Link>
      </header>

      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "1rem 2rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 20px rgba(34,197,94,0.3)", animation: "fadeInDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* Search Bar & Analytics Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Search clients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "1rem 1.5rem", borderRadius: "12px", background: "rgba(15,15,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "1rem" }}
        />
        <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", padding: "1rem 1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", color: "#818cf8", fontWeight: "bold" }}>
          👥 Total Clients: {users.length}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredUsers.map(user => (
          <UserAdvancedCard key={user.id} user={user} onSave={handleSave} />
        ))}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </main>
  );
}

function UserAdvancedCard({ user, onSave }: { user: any, onSave: (id: string, config: string, link: string, status: string, expiry: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  
  // States
  const [configText, setConfigText] = useState(user.vpnConfigKey || "");
  const [subLink, setSubLink] = useState(user.subscriptionLink || "");
  const [status, setStatus] = useState(user.vpnStatus || "Inactive");
  const [expiry, setExpiry] = useState(user.expiryDate ? new Date(user.expiryDate).toISOString().split('T')[0] : "");

  const [selectedPkg, setSelectedPkg] = useState(PACKAGE_LIST[0]);
  const [tempVless, setTempVless] = useState("");

  const handleAddConfig = () => {
    if (!tempVless) { alert("Please paste a VLESS key first!"); return; }
    const newBlock = `📦 [ ${selectedPkg} ]\n${tempVless}\n\n`;
    setConfigText(prev => prev ? prev + newBlock : newBlock);
    setTempVless(""); 
  };

  const addDays = (days: number) => {
    const date = expiry ? new Date(expiry) : new Date();
    date.setDate(date.getDate() + days);
    setExpiry(date.toISOString().split('T')[0]);
  };

  // Calculate days remaining
  const daysLeft = expiry ? Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

  return (
    <div style={{ background: "rgba(15,15,20,0.8)", border: `1px solid ${expanded ? "#6366f1" : "rgba(255,255,255,0.05)"}`, borderRadius: "16px", overflow: "hidden", transition: "all 0.3s ease" }}>
      
      {/* CARD HEADER */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "rgba(99,102,241,0.05)" : "transparent", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
              {user.name} 
              {status === "Active" && <span style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 8px #22c55e" }} title="Active"/>}
              {status === "Suspended" && <span style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 8px #ef4444" }} title="Suspended"/>}
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {daysLeft !== null && (
            <span style={{ color: daysLeft < 3 ? "#ef4444" : "var(--muted-text)", fontSize: "0.85rem", fontWeight: "bold" }}>
              {daysLeft > 0 ? `${daysLeft} Days Left` : "Expired"}
            </span>
          )}
          <div style={{ color: "var(--muted-text)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}>▼</div>
        </div>
      </div>

      {/* EXPANDED CRM AREA */}
      {expanded && (
        <div style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          
          {/* COLUMN 1: Config Generator */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.2)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#818cf8" }}>➕ Assign Ordered VPN Config</h4>
            
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>Package</label>
            <select value={selectedPkg} onChange={(e) => setSelectedPkg(e.target.value)} style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", marginBottom: "1rem", outline: "none" }}>
              {PACKAGE_LIST.map(pkg => <option key={pkg} value={pkg} style={{ background: "#0a0a0f" }}>{pkg}</option>)}
            </select>

            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>VLESS Key</label>
            <textarea value={tempVless} onChange={(e) => setTempVless(e.target.value)} placeholder="vless://..." style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", minHeight: "60px", marginBottom: "1rem" }} />
            
            <button onClick={handleAddConfig} style={{ width: "100%", padding: "0.8rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              ↓ Add to User ↓
            </button>
          </div>

          {/* COLUMN 2: Account Status & Expiry */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>🔒 Account Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: status === "Suspended" ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${status === "Suspended" ? "#ef4444" : "rgba(255,255,255,0.1)"}`, color: status === "Suspended" ? "#ef4444" : "#FFF", fontWeight: "bold", outline: "none" }}>
                <option value="Active" style={{ background: "#0a0a0f" }}>🟢 Active</option>
                <option value="Inactive" style={{ background: "#0a0a0f" }}>⚪ Inactive</option>
                <option value="Suspended" style={{ background: "#0a0a0f" }}>🔴 Suspended (Ban)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>⏳ Subscription Expiry Date</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ flex: 1, padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", colorScheme: "dark" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => addDays(30)} style={{ flex: 1, padding: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>+ 30 Days (Renew)</button>
                <button onClick={() => setExpiry("")} style={{ flex: 1, padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Clear Date</button>
              </div>
            </div>
            
             <div>
               <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>📊 Data Usage Link</label>
               <input type="text" value={subLink} onChange={(e) => setSubLink(e.target.value)} placeholder="https://legionvpn.com/my-usage/..." style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
            </div>
          </div>

          {/* FULL WIDTH: Final View & Save */}
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "1rem" }}>
             <h4 style={{ margin: 0, color: "#FFF" }}>👁️ Assigned Configs (Raw Text)</h4>
             <textarea value={configText} onChange={(e) => setConfigText(e.target.value)} placeholder="No configs assigned yet..." style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#22c55e", minHeight: "100px", fontFamily: "monospace", fontSize: "0.9rem", whiteSpace: "pre-wrap" }} />
             
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
                <a href={`mailto:${user.email}`} style={{ color: "#818cf8", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>✉️ Send Email to Client</a>
                
                <button onClick={() => onSave(user.id, configText, subLink, status, expiry)} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", padding: "1rem 3rem", borderRadius: "30px", fontWeight: "bold", fontSize: "1.1rem", border: "none", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 5px 15px rgba(99,102,241,0.3)" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  💾 Sync & Save Profile
                </button>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
