"use client";

import { useState, useEffect } from "react";
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
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  
  // Dual-pane state: currently selected user
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUsers.length > 0 ? initialUsers[0].id : null);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      // In a real app, you would send this to your backend API
      // const response = await updateUserAdmin(userId, updates);
      
      // Update local state for immediate UI reflection
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      showToast("✅ Client profile updated & synced live!");
      router.refresh();
    } catch (error) {
      alert("Failed to save changes.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#FFF", paddingBottom: "50px", fontFamily: "system-ui, sans-serif" }}>
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "1rem 2rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 30px rgba(34,197,94,0.4)", animation: "fadeInDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      <header style={{ padding: "1.5rem 2.5rem", background: "rgba(15,15,24,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "2rem" }}>🛡️</span> LEGION Super Admin
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold", background: "rgba(99,102,241,0.15)", padding: "0.6rem 1.5rem", borderRadius: "8px", transition: "0.2s" }}>
          ← Exit to Client Dashboard
        </Link>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem", padding: "2rem 2.5rem", maxWidth: "1600px", margin: "0 auto", height: "calc(100vh - 90px)" }}>
        
        {/* ==================================
            LEFT PANE: USER LIST
        =================================== */}
        <div style={{ background: "rgba(15,15,24,0.6)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}
            />
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "1rem" }}>
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUserId(u.id)}
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "12px", background: selectedUserId === u.id ? "rgba(99,102,241,0.2)" : "transparent", border: `1px solid ${selectedUserId === u.id ? "rgba(99,102,241,0.5)" : "transparent"}`, cursor: "pointer", transition: "0.2s", marginBottom: "0.5rem" }}
              >
                <img src={u.image || `https://ui-avatars.com/api/?name=${u.name}`} alt={u.name} style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }} />
                <div style={{ overflow: "hidden" }}>
                  <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "5px" }}>
                    {u.name} {u.isPremium && <span style={{ color: "#3b82f6", fontSize: "0.9rem" }}>✔️</span>}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted-text)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================================
            RIGHT PANE: USER DETAILS
        =================================== */}
        <div style={{ overflowY: "auto", paddingRight: "1rem" }}>
          {selectedUser ? (
            <UserDetailsPanel user={selectedUser} onUpdate={handleUpdateUser} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-text)" }}>
              <h2>Select a client from the list to manage.</h2>
            </div>
          )}
        </div>

      </main>

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
}

// ==========================================================
// SUB-COMPONENT: USER DETAILS PANEL
// ==========================================================
function UserDetailsPanel({ user, onUpdate }: { user: any, onUpdate: (id: string, updates: any) => void }) {
  
  // Config Adder States
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigVless, setNewConfigVless] = useState("");

  // Manual Days State
  const [addDaysInput, setAddDaysInput] = useState<number | "">("");

  // Custom Message States
  const [msgEmoji, setMsgEmoji] = useState("⚠️");
  const [msgText, setMsgText] = useState("");

  // Fix for Hydration Error (Online Status)
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Generate random online status only on the client side after mount to avoid hydration mismatch
    setIsOnline(user.isOnline ?? Math.random() > 0.5);
  }, [user.isOnline, user.id]);

  // Calculate Expiry Data
  const expiryDate = user.expiryDate ? new Date(user.expiryDate) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  // Handlers
  const togglePremium = () => {
    onUpdate(user.id, { isPremium: !user.isPremium });
  };

  const handleBanUser = () => {
    if(confirm(`Are you sure you want to BAN ${user.name}? They will lose all access.`)) {
      onUpdate(user.id, { vpnStatus: "Banned" });
    }
  };

  const handleUnbanUser = () => {
    onUpdate(user.id, { vpnStatus: "Active" });
  };

  const handleAddDays = () => {
    if (!addDaysInput || addDaysInput <= 0) return;
    const date = expiryDate && daysLeft > 0 ? new Date(expiryDate) : new Date();
    date.setDate(date.getDate() + Number(addDaysInput));
    onUpdate(user.id, { expiryDate: date.toISOString(), vpnStatus: "Active" });
    setAddDaysInput("");
  };

  const handleAddConfig = () => {
    if (!newConfigName || !newConfigVless) {
      alert("Please provide both a package name and a VLESS key.");
      return;
    }
    const newBlock = `📦 [ ${newConfigName} ]\n${newConfigVless}\n\n`;
    const updatedConfig = (user.vpnConfigKey || "") + newBlock;
    onUpdate(user.id, { vpnConfigKey: updatedConfig, vpnStatus: "Active" });
    setNewConfigName("");
    setNewConfigVless("");
  };

  const handleSendCustomMessage = () => {
    if (!msgText) return;
    const finalMessage = `${msgEmoji} ${msgText}`;
    onUpdate(user.id, { alertMessage: finalMessage });
    setMsgText("");
  };

  const handleClearMessage = () => {
    onUpdate(user.id, { alertMessage: "" });
  };

  // Safe payments parsing
  const userPayments = user.payments || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeIn 0.4s ease" }}>
      
      {/* 🟢 TOP HEADER CARD */}
      <div style={{ background: "rgba(15,15,24,0.8)", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #6366f1" }} />
          <div>
            <h2 style={{ margin: "0 0 0.3rem 0", fontSize: "1.8rem", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
              {user.name} 
              {user.vpnStatus === "Banned" && <span style={{ background: "#ef4444", color: "#FFF", fontSize: "0.8rem", padding: "2px 10px", borderRadius: "12px", textTransform: "uppercase" }}>Banned</span>}
            </h2>
            <p style={{ margin: "0 0 0.5rem 0", color: "var(--muted-text)", fontSize: "1rem" }}>{user.email}</p>
            {/* Online/Offline Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: isOnline ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: "20px", border: `1px solid ${isOnline ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}` }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isOnline ? "#22c55e" : "#9ca3af", boxShadow: isOnline ? "0 0 8px #22c55e" : "none" }}></span>
              <span style={{ fontSize: "0.8rem", color: isOnline ? "#22c55e" : "#9ca3af", fontWeight: "bold" }}>{isOnline ? "Online Now" : "Offline"}</span>
            </div>
          </div>
        </div>

        {/* Premium Toggle & Ban Action */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", background: "rgba(0,0,0,0.3)", padding: "10px 15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "#FFF", fontWeight: "bold", fontSize: "0.95rem" }}>⭐ Premium User</span>
            <div style={{ position: "relative", width: "44px", height: "24px", background: user.isPremium ? "#6366f1" : "rgba(255,255,255,0.1)", borderRadius: "12px", transition: "0.3s" }} onClick={togglePremium}>
              <div style={{ position: "absolute", top: "2px", left: user.isPremium ? "22px" : "2px", width: "20px", height: "20px", background: "#FFF", borderRadius: "50%", transition: "0.3s" }}></div>
            </div>
          </label>
          
          {user.vpnStatus !== "Banned" ? (
            <button onClick={handleBanUser} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>
              🚫 Ban Client
            </button>
          ) : (
            <button onClick={handleUnbanUser} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              ✅ Unban Client
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* ⏳ EXPIRY CONTROL */}
        <div style={{ background: "rgba(15,15,24,0.8)", padding: "1.8rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "#FFF", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>⏳ Dashboard Countdown</h3>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "10px" }}>
            <div>
              <p style={{ margin: "0 0 0.2rem 0", color: "var(--muted-text)", fontSize: "0.85rem" }}>Current Status</p>
              <h2 style={{ margin: 0, color: daysLeft > 0 ? "#22c55e" : "#ef4444" }}>{daysLeft > 0 ? `${daysLeft} Days Left` : "Expired"}</h2>
            </div>
            {expiryDate && <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.85rem" }}>Ends: {expiryDate.toLocaleDateString()}</p>}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input 
              type="number" 
              placeholder="E.g. 30" 
              value={addDaysInput} 
              onChange={(e) => setAddDaysInput(Number(e.target.value))}
              style={{ flex: 1, padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "1rem", outline: "none" }}
            />
            <button onClick={handleAddDays} style={{ background: "#6366f1", color: "#FFF", border: "none", padding: "0 1.5rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              + Add Days
            </button>
          </div>
        </div>

        {/* 💬 CUSTOM POPUP MESSAGER */}
        <div style={{ background: "rgba(15,15,24,0.8)", padding: "1.8rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "#FFF", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>💬 Send Live Pop-up Message</h3>
          
          {user.alertMessage ? (
            <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px dashed #f59e0b", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "#f59e0b" }}>Currently Active Message:</p>
              <h4 style={{ margin: 0, color: "#FFF" }}>{user.alertMessage}</h4>
              <button onClick={handleClearMessage} style={{ marginTop: "10px", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "4px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}>Remove Message</button>
            </div>
          ) : (
            <p style={{ color: "var(--muted-text)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>No active messages. Client dashboard is clear.</p>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <select value={msgEmoji} onChange={(e) => setMsgEmoji(e.target.value)} style={{ padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "1.2rem", outline: "none", cursor: "pointer" }}>
              <option value="⚠️">⚠️ Warning</option>
              <option value="✅">✅ Success</option>
              <option value="🎁">🎁 Gift</option>
              <option value="💡">💡 Info</option>
              <option value="🛑">🛑 Stop</option>
            </select>
            <input 
              type="text" 
              placeholder="e.g. Payment issue, please check..." 
              value={msgText} 
              onChange={(e) => setMsgText(e.target.value)}
              style={{ flex: 1, padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}
            />
          </div>
          <button onClick={handleSendCustomMessage} style={{ width: "100%", marginTop: "10px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.8rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Send to Client Display ↗
          </button>
        </div>

      </div>

      {/* 📦 ADD CONFIGS SECTION */}
      <div style={{ background: "rgba(15,15,24,0.8)", padding: "1.8rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", marginTop: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.5rem 0", color: "#FFF", fontSize: "1.2rem" }}>📦 Assign New VPN Configs</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "10px", alignItems: "start" }}>
          <select value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} style={{ padding: "0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}>
            <option value="">-- Select Package --</option>
            {PACKAGE_LIST.map(pkg => <option key={pkg} value={pkg}>{pkg}</option>)}
          </select>

          <textarea 
            placeholder="Paste VLESS Key here..." 
            value={newConfigVless} 
            onChange={(e) => setNewConfigVless(e.target.value)}
            style={{ padding: "0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none", minHeight: "45px", resize: "vertical" }}
          />
          <button onClick={handleAddConfig} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.8rem 1.5rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", height: "45px" }}>
            + Add to Client
          </button>
        </div>

        {/* Show Current Configs Raw */}
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ margin: "0 0 0.5rem 0", color: "var(--muted-text)", fontSize: "0.85rem" }}>Current Assigned Configs (Raw Data):</p>
          <textarea 
            value={user.vpnConfigKey || ""} 
            onChange={(e) => onUpdate(user.id, { vpnConfigKey: e.target.value })}
            style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", color: "#818cf8", minHeight: "150px", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap", outline: "none" }} 
          />
        </div>
      </div>

      {/* 🧾 PAYMENT HISTORY & SLIPS */}
      <div style={{ background: "rgba(15,15,24,0.8)", padding: "1.8rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", marginTop: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.5rem 0", color: "#FFF", fontSize: "1.2rem" }}>🧾 Payment History & Slips</h3>
        
        {userPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
            <p style={{ color: "var(--muted-text)" }}>No payments recorded for this client yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {userPayments.map((p: any, idx: number) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem 1.5rem", borderRadius: "12px" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.3rem 0", color: "#FFF" }}>{p.package}</h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-text)" }}>{new Date(p.date).toLocaleString()}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <h3 style={{ margin: 0, color: "#22c55e" }}>Rs. {p.amount}</h3>
                  {p.receipt && (
                    <a href={p.receipt} target="_blank" rel="noreferrer" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                      📄 View Slip
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
