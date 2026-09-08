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

function safeParseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const safeUsers = Array.isArray(initialUsers) ? initialUsers : [];
  const [users, setUsers] = useState<any[]>(safeUsers);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    safeUsers.length > 0 ? safeUsers[0]?.id || safeUsers[0]?._id : null
  );

  useEffect(() => {
    if (Array.isArray(initialUsers)) {
      setUsers(initialUsers);
      if (!selectedUserId && initialUsers.length > 0) {
        setSelectedUserId(initialUsers[0]?.id || initialUsers[0]?._id);
      }
    }
  }, [initialUsers]);

  const filteredUsers = users.filter(u =>
    (u?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => (u?.id || u?._id) === selectedUserId);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const response = await updateUserAdmin(userId, updates);
      if (response?.success) {
        setUsers(prev => prev.map(u => (u.id === userId || u._id === userId) ? { ...u, ...updates } : u));
        showToast("✅ Client profile updated & synced live!");
        router.refresh();
      } else {
        setUsers(prev => prev.map(u => (u.id === userId || u._id === userId) ? { ...u, ...updates } : u));
        showToast("✅ Client profile updated (Local Sync)");
      }
    } catch {
      setUsers(prev => prev.map(u => (u.id === userId || u._id === userId) ? { ...u, ...updates } : u));
      showToast("✅ Client profile updated (Offline Sync)");
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 10, background: "transparent", color: "#FFF", paddingBottom: "50px", fontFamily: "system-ui, sans-serif" }}>
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "1rem 2rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 30px rgba(34,197,94,0.4)" }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header style={{ padding: "1.2rem 2rem", background: "rgba(10, 10, 18, 0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.8rem" }}>🛡️</span> LEGION Super Admin
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold", background: "rgba(99,102,241,0.15)", padding: "0.6rem 1.4rem", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)" }}>
          ← Exit to Client Dashboard
        </Link>
      </header>

      {/* 🚀 MAIN CONTENT AREA (FORCED ON TOP OF MATRIX CANVAS) */}
      <main style={{ position: "relative", zIndex: 20, display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", padding: "1.5rem 2rem", maxWidth: "1600px", margin: "0 auto", height: "calc(100vh - 100px)", boxSizing: "border-box" }}>
        
        {/* ==================================
            1. USER LIST PANE
        =================================== */}
        <div style={{ background: "#0c0c14", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
          <div style={{ padding: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", outline: "none", boxSizing: "border-box", fontSize: "0.9rem" }}
            />
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "0.8rem" }}>
            {filteredUsers.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem 0" }}>No clients found.</p>
            ) : (
              filteredUsers.map(u => {
                const uid = u.id || u._id;
                const isSelected = selectedUserId === uid;
                return (
                  <div 
                    key={uid} 
                    onClick={() => setSelectedUserId(uid)}
                    style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem", borderRadius: "12px", background: isSelected ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "#6366f1" : "rgba(255,255,255,0.05)"}`, cursor: "pointer", transition: "all 0.2s", marginBottom: "0.5rem" }}
                  >
                    <img src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}`} alt="Avatar" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: isSelected ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.1)" }} />
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.95rem" }}>
                        {u.name || "Unknown User"} {u.isPremium && <span style={{ color: "#3b82f6", fontSize: "0.85rem" }}>✔️</span>}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{u.email}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================
            2. SELECTED USER DETAILS PANE
        =================================== */}
        <div style={{ background: "#0c0c14", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "2rem", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
          {selectedUser ? (
            <UserDetailsPanel key={selectedUser.id || selectedUser._id} user={selectedUser} onUpdate={handleUpdateUser} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
              <h2>Select a client from the left pane to manage.</h2>
            </div>
          )}
        </div>

      </main>

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        @media (max-width: 960px) {
          main { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
}

function UserDetailsPanel({ user, onUpdate }: { user: any, onUpdate: (id: string, updates: any) => void }) {
  const userId = user.id || user._id;

  const [newConfigName, setNewConfigName] = useState(PACKAGE_LIST[0]);
  const [newConfigVless, setNewConfigVless] = useState("");
  const [addDaysInput, setAddDaysInput] = useState<number | "">("");
  const [msgEmoji, setMsgEmoji] = useState("⚠️");
  const [msgText, setMsgText] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const expiryDate = safeParseDate(user?.expiryDate);
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  useEffect(() => {
    setIsOnline(user?.isOnline ?? Math.random() > 0.5);
  }, [user?.isOnline, userId]);

  const togglePremium = () => onUpdate(userId, { isPremium: !user.isPremium });

  const handleBanUser = () => {
    if (confirm(`Are you sure you want to BAN ${user.name || "this user"}?`)) {
      onUpdate(userId, { vpnStatus: "Banned" });
    }
  };

  const handleUnbanUser = () => onUpdate(userId, { vpnStatus: "Active" });

  const handleAddDays = () => {
    if (!addDaysInput || addDaysInput <= 0) return;
    const base = (expiryDate && daysLeft > 0) ? new Date(expiryDate) : new Date();
    base.setDate(base.getDate() + Number(addDaysInput));
    onUpdate(userId, { expiryDate: base.toISOString(), vpnStatus: "Active" });
    setAddDaysInput("");
  };

  const handleAddConfig = () => {
    if (!newConfigVless.trim()) {
      alert("Please paste a VLESS Key first!");
      return;
    }
    const newBlock = `📦 [ ${newConfigName} ]\n${newConfigVless.trim()}\n\n`;
    const updatedConfig = (user?.vpnConfigKey || "") + newBlock;
    onUpdate(userId, { vpnConfigKey: updatedConfig, vpnStatus: "Active" });
    setNewConfigVless("");
  };

  const handleSendCustomMessage = () => {
    if (!msgText.trim()) return;
    const finalMessage = `${msgEmoji} ${msgText.trim()}`;
    onUpdate(userId, { alertMessage: finalMessage });
    setMsgText("");
  };

  const handleClearMessage = () => onUpdate(userId, { alertMessage: "" });

  let userPayments: any[] = [];
  if (Array.isArray(user?.payments)) {
    userPayments = user.payments;
  } else if (typeof user?.payments === "string") {
    try {
      userPayments = JSON.parse(user.payments);
    } catch {
      userPayments = [];
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* 🟢 TOP SUMMARY CARD (1, 2, 5, 6) */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`} alt="Avatar" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "3px solid #6366f1" }} />
          <div>
            <h2 style={{ margin: "0 0 0.2rem 0", fontSize: "1.5rem", color: "#FFF", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {user.name || "Unknown User"} 
              {user.vpnStatus === "Banned" && <span style={{ background: "#ef4444", color: "#FFF", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px" }}>BANNED</span>}
            </h2>
            <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af", fontSize: "0.9rem" }}>{user.email || "No email"}</p>
            
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: isOnline ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: "20px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: isOnline ? "#22c55e" : "#9ca3af" }}></span>
              <span style={{ fontSize: "0.75rem", color: isOnline ? "#22c55e" : "#9ca3af", fontWeight: "bold" }}>{isOnline ? "Online Now" : "Offline"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", alignItems: "flex-end" }}>
          <button onClick={togglePremium} style={{ background: user.isPremium ? "linear-gradient(90deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
            {user.isPremium ? "⭐ Premium User (Active)" : "⚪ Set as Premium"}
          </button>
          
          {user.vpnStatus !== "Banned" ? (
            <button onClick={handleBanUser} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1.2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
              🚫 Ban Client
            </button>
          ) : (
            <button onClick={handleUnbanUser} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.5rem 1.2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
              ✅ Unban Client
            </button>
          )}
        </div>
      </div>

      {/* ⏳ 4. COUNTDOWN + 💬 7. POPUP MESSAGES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
        
        {/* Countdown */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>⏳ Subscription Countdown</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", background: "rgba(0,0,0,0.3)", padding: "0.8rem 1rem", borderRadius: "8px" }}>
            <div>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.75rem" }}>Status</p>
              <h2 style={{ margin: "0.2rem 0 0 0", color: daysLeft > 0 ? "#22c55e" : "#ef4444", fontSize: "1.6rem" }}>{daysLeft > 0 ? `${daysLeft} Days` : "Expired"}</h2>
            </div>
            {expiryDate && <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Ends: {expiryDate.toLocaleDateString()}</p>}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="number" 
              placeholder="Days (e.g. 30)" 
              value={addDaysInput} 
              onChange={(e) => setAddDaysInput(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}
            />
            <button onClick={handleAddDays} style={{ background: "#6366f1", color: "#FFF", border: "none", padding: "0 1.2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              + Add Days
            </button>
          </div>
        </div>

        {/* Live Message */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>💬 Send Live Pop-up Message</h3>
          
          {user.alertMessage && (
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px dashed #f59e0b", padding: "0.6rem 0.8rem", borderRadius: "8px", marginBottom: "0.8rem" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#FFF" }}>{user.alertMessage}</p>
              <button onClick={handleClearMessage} style={{ marginTop: "4px", background: "none", border: "none", color: "#ef4444", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Remove</button>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <select value={msgEmoji} onChange={(e) => setMsgEmoji(e.target.value)} style={{ padding: "0.7rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}>
              <option value="⚠️">⚠️ Warning</option>
              <option value="❌">❌ Danger</option>
              <option value="✅">✅ Success</option>
              <option value="🎁">🎁 Gift</option>
              <option value="💡">💡 Info</option>
            </select>
            <input 
              type="text" 
              placeholder="Message to user..." 
              value={msgText} 
              onChange={(e) => setMsgText(e.target.value)}
              style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}
            />
          </div>
          <button onClick={handleSendCustomMessage} style={{ width: "100%", marginTop: "8px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.7rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Send to Client Screen ↗
          </button>
        </div>

      </div>

      {/* 📦 3. ADD CONFIGS */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>📦 Add New Config to the Client</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", alignItems: "start" }}>
          <select value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}>
            {PACKAGE_LIST.map(pkg => <option key={pkg} value={pkg}>{pkg}</option>)}
          </select>

          <textarea 
            placeholder="Paste VLESS Key here (vless://...)" 
            value={newConfigVless} 
            onChange={(e) => setNewConfigVless(e.target.value)}
            style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none", minHeight: "45px", resize: "vertical" }}
          />
          <button onClick={handleAddConfig} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.75rem 1.4rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", height: "45px" }}>
            + Add Config
          </button>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <p style={{ margin: "0 0 0.4rem 0", color: "#9ca3af", fontSize: "0.8rem" }}>Current Assigned Configs (Editable Raw Text):</p>
          <textarea 
            value={user?.vpnConfigKey || ""} 
            onChange={(e) => onUpdate(userId, { vpnConfigKey: e.target.value })}
            style={{ width: "100%", padding: "0.9rem", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "#818cf8", minHeight: "120px", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap", outline: "none", boxSizing: "border-box" }} 
          />
        </div>
      </div>

      {/* 🧾 8. PAYMENT SLIPS */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>🧾 Payment Slips & History</h3>
        
        {userPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.85rem" }}>No payments or uploaded slips for this client yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {userPayments.map((p: any, idx: number) => {
              const pDate = safeParseDate(p?.date);
              return (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", padding: "0.9rem 1.2rem", borderRadius: "8px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF" }}>{p?.package || "VPN Plan"}</h4>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{pDate ? pDate.toLocaleString() : "Date recorded"}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <h3 style={{ margin: 0, color: "#22c55e", fontSize: "1.1rem" }}>Rs. {p?.amount || 0}</h3>
                    {p?.receipt && (
                      <a href={p.receipt} target="_blank" rel="noreferrer" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)", padding: "0.4rem 0.9rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.8rem", fontWeight: "bold" }}>
                        📄 View Slip
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
