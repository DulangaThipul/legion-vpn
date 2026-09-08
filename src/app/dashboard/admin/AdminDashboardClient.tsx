"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAdmin } from "@/lib/authActions";

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

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Added Custom Message Field
  const handleSave = async (userId: string, newConfig: string, newStatus: string, newExpiry: string, newCustomMsg: string) => {
    try {
      const response = await updateUserAdmin(userId, {
        vpnConfigKey: newConfig,
        vpnStatus: newStatus,
        expiryDate: newExpiry ? new Date(newExpiry) : null,
        alertMessage: newCustomMsg // Send Live Message!
      });

      if (response.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, vpnConfigKey: newConfig, vpnStatus: newStatus, expiryDate: newExpiry, alertMessage: newCustomMsg } : u));
        setToast("Changes saved & synced live successfully!");
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
          🛡️ LEGION Super Admin
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold", background: "rgba(99,102,241,0.1)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
          ← Back to Site
        </Link>
      </header>

      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "1rem 2rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 20px rgba(34,197,94,0.3)" }}>
          {toast}
        </div>
      )}

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
    </main>
  );
}

function UserAdvancedCard({ user, onSave }: { user: any, onSave: (id: string, config: string, status: string, expiry: string, msg: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [configText, setConfigText] = useState(user.vpnConfigKey || "");
  const [status, setStatus] = useState(user.vpnStatus || "Inactive");
  const [expiry, setExpiry] = useState(user.expiryDate ? new Date(user.expiryDate).toISOString().split('T')[0] : "");
  
  // Custom Live Message
  const [customMsg, setCustomMsg] = useState(user.alertMessage || "");
  const [msgType, setMsgType] = useState<"success" | "danger">(user.alertMessage?.includes("❌") ? "danger" : "success");

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

  const daysLeft = expiry ? Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

  const buildMessage = () => {
    const icon = msgType === "success" ? "✅" : "❌";
    return `${icon} ${customMsg.replace(/[✅❌]/g, "").trim()}`;
  };

  return (
    <div style={{ background: status === "Banned" ? "rgba(239, 68, 68, 0.05)" : "rgba(15,15,20,0.8)", border: `1px solid ${status === "Banned" ? "#ef4444" : expanded ? "#6366f1" : "rgba(255,255,255,0.05)"}`, borderRadius: "16px", overflow: "hidden", transition: "all 0.3s ease" }}>
      
      {/* CARD HEADER */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "rgba(99,102,241,0.05)" : "transparent", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
              {user.name} 
              {status === "Active" && <span style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 8px #22c55e" }} title="Active"/>}
              {status === "Banned" && <span style={{ padding: "2px 8px", background: "#ef4444", color: "#FFF", fontSize: "0.7rem", borderRadius: "12px", fontWeight: "bold" }}>BANNED</span>}
              {status === "Suspended" && <span style={{ padding: "2px 8px", background: "#f59e0b", color: "#000", fontSize: "0.7rem", borderRadius: "12px", fontWeight: "bold" }}>REVIEW / PENDING</span>}
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>{user.email}</p>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {daysLeft !== null && status !== "Banned" && (
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
          
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.2)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#818cf8" }}>➕ Assign Ordered VPN Config</h4>
            <select value={selectedPkg} onChange={(e) => setSelectedPkg(e.target.value)} style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", marginBottom: "1rem", outline: "none" }}>
              {PACKAGE_LIST.map(pkg => <option key={pkg} value={pkg} style={{ background: "#0a0a0f" }}>{pkg}</option>)}
            </select>
            <textarea value={tempVless} onChange={(e) => setTempVless(e.target.value)} placeholder="vless://..." style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", minHeight: "60px", marginBottom: "1rem" }} />
            <button onClick={handleAddConfig} style={{ width: "100%", padding: "0.8rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>↓ Add to User ↓</button>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>🔒 Account Status (Verify & Ban)</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: status === "Banned" ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${status === "Banned" ? "#ef4444" : "rgba(255,255,255,0.1)"}`, color: status === "Banned" ? "#ef4444" : "#FFF", fontWeight: "bold", outline: "none" }}>
                <option value="Active" style={{ background: "#0a0a0f", color: "#22c55e" }}>🟢 Active (Approved)</option>
                <option value="Inactive" style={{ background: "#0a0a0f", color: "#FFF" }}>⚪ Inactive</option>
                <option value="Suspended" style={{ background: "#0a0a0f", color: "#f59e0b" }}>🟠 Suspended (Needs Review)</option>
                <option value="Banned" style={{ background: "#0a0a0f", color: "#ef4444" }}>🔴 BANNED</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>⏳ Subscription Expiry Date</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ flex: 1, padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", colorScheme: "dark" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => addDays(30)} style={{ flex: 1, padding: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>+ 30 Days</button>
                <button onClick={() => setExpiry("")} style={{ flex: 1, padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Clear Date</button>
              </div>
            </div>
            
            {/* 🚀 SEND LIVE MESSAGE WIDGET */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>💬 Send Live Pop-Up Message</label>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                 <button onClick={() => setMsgType("success")} style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", background: msgType === "success" ? "#22c55e" : "rgba(255,255,255,0.05)", border: "none", color: msgType === "success" ? "#000" : "#FFF", fontWeight: "bold", cursor: "pointer" }}>✅ Success Mark</button>
                 <button onClick={() => setMsgType("danger")} style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", background: msgType === "danger" ? "#ef4444" : "rgba(255,255,255,0.05)", border: "none", color: msgType === "danger" ? "#000" : "#FFF", fontWeight: "bold", cursor: "pointer" }}>❌ Danger Mark</button>
              </div>
              <input type="text" value={customMsg.replace(/[✅❌]/g, "").trim()} onChange={(e) => setCustomMsg(e.target.value)} placeholder="Type custom message to user..." style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
              <button onClick={() => setCustomMsg("")} style={{ marginTop: "10px", width: "100%", padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", cursor: "pointer" }}>Clear Message</button>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "1rem" }}>
             <h4 style={{ margin: 0, color: "#FFF", display: "flex", justifyContent: "space-between" }}>
               👁️ Assigned Configs (Raw Text)
             </h4>
             <textarea value={configText} onChange={(e) => setConfigText(e.target.value)} placeholder="No configs assigned yet..." style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#22c55e", minHeight: "100px", fontFamily: "monospace", fontSize: "0.9rem", whiteSpace: "pre-wrap" }} />
             
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
                <a href={`mailto:${user.email}`} style={{ color: "#818cf8", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>✉️ Send Email to Client</a>
                
                <button onClick={() => onSave(user.id, configText, status, expiry, customMsg ? buildMessage() : "")} style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", padding: "1rem 3rem", borderRadius: "30px", fontWeight: "bold", fontSize: "1.1rem", border: "none", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 5px 15px rgba(99,102,241,0.3)" }}>
                  💾 Sync & Save Live Profile
                </button>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
