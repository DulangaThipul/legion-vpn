"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAdmin } from "@/lib/authActions";

const PACKAGE_LIST = [
  "Dialog Zoom Unlimited",
  "Dialog Social (20 GB)",
  "Dialog TikTok Unlimited",
  "Airtel TikTok Unlimited",
  "Airtel YouTube Unlimited",
  "Airtel Zoom (30 GB)",
  "Hutch Zoom (30 GB)",
  "SLT Fiber Zoom",
  "SLT Fiber Unlimited Entertainment",
  "SLT Router Zoom",
  "Custom / Special Package"
];

const AVAILABLE_RANKS = ["Auto", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];

function safeParseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
        Loading Admin CRM...
      </div>
    );
  }

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
        showToast("✅ Successfully saved to database!");
        router.refresh();
      } else {
        alert("Error saving: " + response?.error);
      }
    } catch {
      alert("Network error: Failed to update database.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 10, background: "transparent", color: "#FFF", paddingBottom: "50px" }}>
      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "1rem 2rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 30px rgba(34,197,94,0.4)" }}>
          {toast}
        </div>
      )}

      <header style={{ padding: "1.2rem 2rem", background: "rgba(10, 10, 18, 0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🛡️</span> LEGION Super Admin
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold", background: "rgba(99,102,241,0.15)", padding: "0.6rem 1.4rem", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)" }}>
          ← Exit to Dashboard
        </Link>
      </header>

      <main style={{ position: "relative", zIndex: 20, display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", padding: "1.5rem 2rem", maxWidth: "1600px", margin: "0 auto", height: "calc(100vh - 100px)", boxSizing: "border-box" }}>
        
        {/* USER LIST */}
        <div style={{ background: "#0c0c14", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "0.8rem" }}>
            {filteredUsers.map(u => {
              const uid = u.id || u._id;
              const isSelected = selectedUserId === uid;
              
              let isPrem = false;
              let uLastSeen = 0;
              let userRank = "Bronze";
              if (u.subscriptionLink) {
                try {
                  const meta = JSON.parse(u.subscriptionLink);
                  if (meta.isPremium) isPrem = true;
                  if (meta.lastSeen) uLastSeen = meta.lastSeen;
                  if (meta.customRank) userRank = meta.customRank;
                } catch {}
              }

              const displayTime = uLastSeen || (u.updatedAt ? new Date(u.updatedAt).getTime() : 0);

              return (
                <div 
                  key={uid} 
                  onClick={() => setSelectedUserId(uid)}
                  style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem", borderRadius: "12px", background: isSelected ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "#6366f1" : "rgba(255,255,255,0.05)"}`, cursor: "pointer", transition: "all 0.2s", marginBottom: "0.5rem" }}
                >
                  <img src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}`} alt="Avatar" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.95rem" }}>
                        {u.name || "Unknown User"} {isPrem && <span style={{ color: "#3b82f6" }}>✔️</span>}
                      </h4>
                      <span style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: "bold" }}>{userRank}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{u.email}</p>
                    
                    {displayTime ? (
                      <p style={{ margin: "3px 0 0 0", fontSize: "0.7rem", color: "#818cf8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                        🕒 {new Date(displayTime).toLocaleDateString()} · {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAILS PANE */}
        <div style={{ background: "#0c0c14", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "2rem", overflowY: "auto" }}>
          {selectedUser ? (
            <UserDetailsPanel key={selectedUser.id || selectedUser._id} user={selectedUser} onUpdate={handleUpdateUser} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
              <h2>Select a client from the left pane to manage.</h2>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function UserDetailsPanel({ user, onUpdate }: { user: any, onUpdate: (id: string, updates: any) => void }) {
  const userId = user.id || user._id;

  let metaData = { alert: "", isPremium: false, payments: [] as any[], lastSeen: 0, customRank: "", bonusPurchases: 0 };
  if (user?.subscriptionLink) {
    try {
      metaData = { ...metaData, ...JSON.parse(user.subscriptionLink) };
    } catch {
      metaData.alert = user.subscriptionLink;
    }
  }

  // 🚀 ONLINE STATUS TRACKER
  const [onlineText, setOnlineText] = useState("Offline");
  const [isClientOnline, setIsClientOnline] = useState(false);

  useEffect(() => {
    const updateTimeAgo = () => {
      const lastSeenTime = metaData.lastSeen || (user?.updatedAt ? new Date(user.updatedAt).getTime() : 0);
      if (!lastSeenTime) {
        setIsClientOnline(false);
        setOnlineText("Offline (Never Active)");
        return;
      }
      const diffSeconds = Math.floor((Date.now() - lastSeenTime) / 1000);
      const dateStr = new Date(lastSeenTime).toLocaleDateString();
      const timeStr = new Date(lastSeenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (diffSeconds < 45) {
        setIsClientOnline(true);
        setOnlineText(`Online Now · ${dateStr} at ${timeStr}`);
      } else {
        setIsClientOnline(false);
        const mins = Math.floor(diffSeconds / 60);
        if (mins < 60) {
          setOnlineText(`Offline (${mins}m ago) · ${dateStr} at ${timeStr}`);
        } else {
          setOnlineText(`Offline · ${dateStr} at ${timeStr}`);
        }
      }
    };
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 5000);
    return () => clearInterval(interval);
  }, [metaData.lastSeen, user?.updatedAt]);

  // 🏆 RANK CONTROLS
  const verifiedPaymentsCount = (metaData.payments || []).filter((p: any) => p?.status === "Verified").length;
  const [selectedRank, setSelectedRank] = useState(metaData.customRank || "Auto");
  const [bonusPurchasesInput, setBonusPurchasesInput] = useState<number>(Number(metaData.bonusPurchases) || 0);

  const handleSaveRankSettings = () => {
    const updatedMeta = {
      ...metaData,
      customRank: selectedRank === "Auto" ? "" : selectedRank,
      bonusPurchases: Number(bonusPurchasesInput) || 0
    };
    onUpdate(userId, { subscriptionLink: JSON.stringify(updatedMeta) });
  };

  // Dynamic Multi-Config Sections
  interface ConfigItem {
    id: string;
    name: string;
    code: string;
  }

  const parseRawConfigsToItems = (raw: string): ConfigItem[] => {
    if (!raw) return [];
    const regex = /(?:📦\s*)?\[(.*?)\]\s*([\s\S]*?)(?=(?:📦\s*)?\[|$)/g;
    const matches = [...raw.matchAll(regex)];
    if (matches.length > 0) {
      return matches.map((m, idx) => ({
        id: `${idx}-${Date.now()}`,
        name: m[1].trim(),
        code: m[2].trim(),
      }));
    }
    return [{ id: `0-${Date.now()}`, name: "Default Package", code: raw.trim() }];
  };

  const [configItems, setConfigItems] = useState<ConfigItem[]>(parseRawConfigsToItems(user?.vpnConfigKey || ""));

  useEffect(() => {
    setConfigItems(parseRawConfigsToItems(user?.vpnConfigKey || ""));
  }, [user?.vpnConfigKey, userId]);

  const serializeConfigItems = (items: ConfigItem[]): string => {
    return items.map(item => `📦 [ ${item.name} ]\n${item.code}`).join("\n\n");
  };

  const handleAddNewConfigSection = () => {
    const newItem: ConfigItem = {
      id: `${Date.now()}`,
      name: PACKAGE_LIST[0],
      code: ""
    };
    const updated = [...configItems, newItem];
    setConfigItems(updated);
    onUpdate(userId, { vpnConfigKey: serializeConfigItems(updated), vpnStatus: "Active" });
  };

  const handleRemoveConfigSection = (idToRemove: string) => {
    const updated = configItems.filter(item => item.id !== idToRemove);
    setConfigItems(updated);
    onUpdate(userId, { vpnConfigKey: serializeConfigItems(updated) });
  };

  const handleConfigChange = (id: string, field: "name" | "code", val: string) => {
    const updated = configItems.map(item => item.id === id ? { ...item, [field]: val } : item);
    setConfigItems(updated);
  };

  const handleSaveConfigs = () => {
    onUpdate(userId, { vpnConfigKey: serializeConfigItems(configItems), vpnStatus: "Active" });
  };

  // Days Adjustment
  const [daysAmount, setDaysAmount] = useState<number | "">("");
  const expiryDate = safeParseDate(user?.expiryDate);
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  const handleModifyDays = (add: boolean) => {
    if (!daysAmount || daysAmount <= 0) return;
    const base = (expiryDate && daysLeft > 0) ? new Date(expiryDate) : new Date();
    const multiplier = add ? 1 : -1;
    base.setDate(base.getDate() + (Number(daysAmount) * multiplier));
    onUpdate(userId, { expiryDate: base.toISOString(), vpnStatus: "Active" });
    setDaysAmount("");
  };

  // Message Handling
  const [msgEmoji, setMsgEmoji] = useState("⚠️");
  const [msgText, setMsgText] = useState("");

  const saveMeta = (alertVal: string, isPremVal: boolean) => {
    const payload = JSON.stringify({ ...metaData, alert: alertVal, isPremium: isPremVal });
    onUpdate(userId, { subscriptionLink: payload });
  };

  const togglePremium = () => saveMeta(metaData.alert, !metaData.isPremium);
  
  const handleBanUser = () => {
    if (confirm(`Are you sure you want to BAN ${user.name || "this user"}?`)) {
      onUpdate(userId, { vpnStatus: "Banned" });
    }
  };
  const handleUnbanUser = () => onUpdate(userId, { vpnStatus: "Active" });

  const handleSendMessage = () => {
    if (!msgText.trim()) return;
    saveMeta(`${msgEmoji} ${msgText.trim()}`, metaData.isPremium);
    setMsgText("");
  };
  const handleClearMessage = () => saveMeta("", metaData.isPremium);

  // VERIFY PAYMENT HANDLER
  const handleVerifyPayment = (paymentIdentifier: any) => {
    const updatedPayments = (metaData.payments || []).map((p: any) => {
      if (p.id === paymentIdentifier || p.date === paymentIdentifier) {
        return { ...p, status: "Verified" };
      }
      return p;
    });

    const updatedMeta = { ...metaData, payments: updatedPayments };
    onUpdate(userId, {
      subscriptionLink: JSON.stringify(updatedMeta),
      vpnStatus: "Active"
    });
  };

  // DELETE PAYMENT HANDLER
  const handleDeletePayment = (paymentIdentifier: any) => {
    if (!confirm("Are you sure you want to permanently delete this payment slip record?")) return;

    const updatedPayments = (metaData.payments || []).filter((p: any) => {
      return p.id !== paymentIdentifier && p.date !== paymentIdentifier;
    });

    const updatedPendingOrders = (metaData.pendingOrders || []).filter((po: any) => {
      return po.id !== paymentIdentifier && po.date !== paymentIdentifier;
    });

    const updatedMeta = { 
      ...metaData, 
      payments: updatedPayments, 
      pendingOrders: updatedPendingOrders 
    };

    onUpdate(userId, {
      subscriptionLink: JSON.stringify(updatedMeta),
    });
  };

  const userPayments = metaData.payments || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* HEADER CARD */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`} alt="Avatar" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "3px solid #6366f1" }} />
          <div>
            <h2 style={{ margin: "0 0 0.2rem 0", fontSize: "1.5rem", color: "#FFF", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {user.name || "Unknown User"} 
              {user.vpnStatus === "Banned" && <span style={{ background: "#ef4444", color: "#FFF", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px" }}>BANNED</span>}
            </h2>
            <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af", fontSize: "0.9rem" }}>{user.email || "No email"}</p>
            
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: isClientOnline ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: "20px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isClientOnline ? "#22c55e" : "#9ca3af", boxShadow: isClientOnline ? "0 0 8px #22c55e" : "none" }}></span>
              <span style={{ fontSize: "0.8rem", color: isClientOnline ? "#22c55e" : "#9ca3af", fontWeight: "bold" }}>{onlineText}</span>
            </div>

            <p style={{ margin: "0.4rem 0 0 0", color: "#9ca3af", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🕒</span>
              <span>Last Login / Active:</span>
              <strong style={{ color: "#FFF" }}>
                {metaData.lastSeen 
                  ? `${new Date(metaData.lastSeen).toLocaleDateString()} at ${new Date(metaData.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : user?.updatedAt 
                    ? `${new Date(user.updatedAt).toLocaleDateString()} at ${new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : "No record"}
              </strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", alignItems: "flex-end" }}>
          <button onClick={togglePremium} style={{ background: metaData.isPremium ? "linear-gradient(90deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
            {metaData.isPremium ? "⭐ Premium User (Active)" : "⚪ Set as Premium"}
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

      {/* 🏆 RANK & PURCHASES MANAGEMENT CARD (NEW) */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(234, 179, 8, 0.2)" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "#eab308", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🏆</span> Rank & Purchases Management
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
          <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Verified In-app Purchases</p>
            <h3 style={{ margin: "4px 0 0 0", color: "#22c55e", fontSize: "1.3rem" }}>{verifiedPaymentsCount} Purchases</h3>
          </div>

          <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Bonus Purchases Added</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <input 
                type="number" 
                value={bonusPurchasesInput} 
                onChange={(e) => setBonusPurchasesInput(Number(e.target.value))}
                style={{ width: "90px", padding: "0.4rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFF", fontWeight: "bold" }}
              />
              <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>bonus</span>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Override Client Rank</p>
            <select 
              value={selectedRank} 
              onChange={(e) => setSelectedRank(e.target.value)}
              style={{ marginTop: "4px", width: "100%", padding: "0.5rem", borderRadius: "6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "#eab308", fontWeight: "bold" }}
            >
              {AVAILABLE_RANKS.map(rk => (
                <option key={rk} value={rk}>{rk === "Auto" ? "Auto (Based on Purchases)" : rk}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleSaveRankSettings}
          style={{ background: "linear-gradient(90deg, #d97706, #eab308)", color: "#000", border: "none", padding: "0.6rem 1.6rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}
        >
          💾 Save Rank & Purchases
        </button>
      </div>

      {/* ⏳ COUNTDOWN + 💬 MESSAGE */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
        
        {/* Days Adjustment */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>⏳ Adjust Subscription Days</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", background: "rgba(0,0,0,0.3)", padding: "0.8rem 1rem", borderRadius: "8px" }}>
            <div>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.75rem" }}>Current Status</p>
              <h2 style={{ margin: "0.2rem 0 0 0", color: daysLeft > 0 ? "#22c55e" : "#ef4444", fontSize: "1.6rem" }}>{daysLeft > 0 ? `${daysLeft} Days Left` : "Expired"}</h2>
            </div>
            {expiryDate && <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Ends: {expiryDate.toLocaleDateString()}</p>}
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input 
              type="number" 
              placeholder="Days (e.g. 10)" 
              value={daysAmount} 
              onChange={(e) => setDaysAmount(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleModifyDays(true)} style={{ flex: 1, background: "#22c55e", color: "#000", border: "none", padding: "0.6rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              + Add Days
            </button>
            <button onClick={() => handleModifyDays(false)} style={{ flex: 1, background: "#ef4444", color: "#FFF", border: "none", padding: "0.6rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              - Deduct Days
            </button>
          </div>
        </div>

        {/* Message */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>💬 Send Live Pop-up Message</h3>
          {metaData.alert ? (
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px dashed #f59e0b", padding: "0.6rem 0.8rem", borderRadius: "8px", marginBottom: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#FFF" }}>{metaData.alert}</p>
              <button onClick={handleClearMessage} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}>Clear</button>
            </div>
          ) : (
            <p style={{ margin: "0 0 0.8rem 0", fontSize: "0.8rem", color: "#9ca3af" }}>No active message on client's screen.</p>
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
              placeholder="Message to client..." 
              value={msgText} 
              onChange={(e) => setMsgText(e.target.value)}
              style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", outline: "none" }}
            />
          </div>
          <button onClick={handleSendMessage} style={{ width: "100%", marginTop: "8px", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.7rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Send to Client Screen ↗
          </button>
        </div>

      </div>

      {/* 📦 ASSIGNED CONFIGURATIONS */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, color: "#FFF", fontSize: "1.1rem" }}>📦 Assigned Configurations</h3>
            <p style={{ margin: "0.2rem 0 0 0", color: "#9ca3af", fontSize: "0.8rem" }}>Add or remove individual config slots for this client.</p>
          </div>
          <button onClick={handleAddNewConfigSection} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}>
            + Add New Config Section
          </button>
        </div>

        {configItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", background: "rgba(0,0,0,0.3)", borderRadius: "10px", color: "#9ca3af" }}>
            No configs assigned. Click "+ Add New Config Section" to grant VPN access.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {configItems.map((item, idx) => (
              <div key={item.id} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
                    <span style={{ color: "#818cf8", fontWeight: "bold" }}>#{idx + 1}</span>
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => handleConfigChange(item.id, "name", e.target.value)}
                      placeholder="Package / Server Name"
                      style={{ flex: 1, padding: "0.5rem 0.8rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "0.85rem", outline: "none" }}
                    />
                  </div>
                  <button onClick={() => handleRemoveConfigSection(item.id)} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                    🗑️ Remove Config
                  </button>
                </div>

                <textarea 
                  value={item.code} 
                  onChange={(e) => handleConfigChange(item.id, "code", e.target.value)}
                  placeholder="Paste VLESS Key here (vless://...)"
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#22c55e", fontFamily: "monospace", fontSize: "0.8rem", minHeight: "65px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}

            <button onClick={handleSaveConfigs} style={{ alignSelf: "flex-end", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", color: "#FFF", border: "none", padding: "0.8rem 2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              💾 Save All Changes
            </button>
          </div>
        )}
      </div>

      {/* 🧾 PAYMENT SLIPS & VERIFICATION */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "#FFF", fontSize: "1.05rem" }}>🧾 Payment Slips & History</h3>
        
        {userPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.85rem" }}>No uploaded payment slips recorded for this client yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {userPayments.map((p: any, idx: number) => {
              const pDate = safeParseDate(p?.date);
              const isVerified = p?.status === "Verified";

              return (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem 1.2rem", borderRadius: "10px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF" }}>{p?.package || "VPN Plan"}</h4>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{pDate ? pDate.toLocaleString() : "Date recorded"}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, color: "#22c55e" }}>Rs. {p?.amount || 0}</h3>
                    {p?.receipt && (
                      <a href={p.receipt} target="_blank" rel="noreferrer" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)", padding: "0.45rem 0.9rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.8rem", fontWeight: "bold" }}>
                        📄 View Slip ↗
                      </a>
                    )}
                    
                    {isVerified ? (
                      <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", padding: "0.45rem 0.9rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                        ✅ Verified
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleVerifyPayment(p?.id || p?.date)} 
                        style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)", color: "#000", border: "none", padding: "0.45rem 1rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 8px rgba(34,197,94,0.3)" }}
                      >
                        ✓ Verify Payment
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePayment(p?.id || p?.date)}
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.45rem 0.9rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
                      title="Delete this payment record"
                    >
                      🗑️ Delete
                    </button>
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
