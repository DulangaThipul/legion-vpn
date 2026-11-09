"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAdmin, resetUserAccount } from "@/lib/authActions";

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

const DATA_PACKAGE_OPTIONS = [
  "20 GB",
  "30 GB",
  "40 GB",
  "50 GB",
  "60 GB",
  "75 GB",
  "80 GB",
  "100 GB",
  "120 GB",
  "150 GB",
  "200 GB",
  "250 GB",
  "300 GB",
  "500 GB",
  "Unlimited"
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
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncMsg, setBulkSyncMsg] = useState("");

  const handleBulkRefresh = async () => {
    if (!confirm("Fetch live 3x-ui usage for all clients with subscription links right now?")) return;
    setIsBulkSyncing(true);
    setBulkSyncMsg("Bulk syncing all clients...");
    try {
      const res = await fetch("/api/usage?bulk=true", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setBulkSyncMsg(`✓ Updated ${data.updatedCount} clients!`);
        showToast(`✅ Bulk sync: Updated ${data.updatedCount} clients!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBulkSyncMsg("⚠️ Bulk sync failed");
      }
    } catch {
      setBulkSyncMsg("⚠️ Bulk sync error");
    } finally {
      setIsBulkSyncing(false);
    }
  };
  
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
          <div style={{ padding: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: "0.75rem 0.9rem", borderRadius: "10px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", outline: "none", boxSizing: "border-box", fontSize: "0.85rem" }}
              />
              <button
                type="button"
                onClick={handleBulkRefresh}
                disabled={isBulkSyncing}
                title="Fetch live 3x-ui usage for all clients with subscription links right now"
                style={{ background: isBulkSyncing ? "rgba(59, 130, 246, 0.1)" : "linear-gradient(90deg, #2563eb, #3b82f6)", color: "#FFF", border: "none", borderRadius: "8px", padding: "0.75rem 0.9rem", cursor: isBulkSyncing ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: "bold", whiteSpace: "nowrap" }}
              >
                {isBulkSyncing ? "Syncing..." : "⚡ Sync All"}
              </button>
            </div>
            {bulkSyncMsg && (
              <span style={{ fontSize: "0.72rem", color: "#38bdf8", textAlign: "center" }}>{bulkSyncMsg}</span>
            )}
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "0.8rem" }}>
            {filteredUsers.map(u => {
              const uid = u.id || u._id;
              const isSelected = selectedUserId === uid;
              
              let isPrem = false;
              let uLastSeen = 0;
              let userRank = "Bronze";
              let uDataUsed = "0 GB";
              let uPrev = 0;
              if (u.subscriptionLink) {
                try {
                  const meta = JSON.parse(u.subscriptionLink);
                  if (meta.isPremium) isPrem = true;
                  if (meta.lastSeen) uLastSeen = meta.lastSeen;
                  if (meta.customRank) userRank = meta.customRank;
                  if (meta.lastRecordedUsage || meta.dataUsed) uDataUsed = meta.lastRecordedUsage || meta.dataUsed;
                  if (meta.previousUsage || meta.previousUsageGB) uPrev = Number(meta.previousUsage || meta.previousUsageGB);
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
                    
                    <p style={{ margin: "3px 0 0 0", fontSize: "0.72rem", color: "#38bdf8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "4px" }}>
                      📊 {uDataUsed} {uPrev > 0 ? `(Prev: ${uPrev} GB)` : ""}
                    </p>

                    {displayTime ? (
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.68rem", color: "#818cf8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
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

  let metaData = { 
    alert: "", 
    isPremium: false, 
    payments: [] as any[], 
    pendingOrders: [] as any[], 
    lastSeen: 0, 
    customRank: "", 
    bonusPurchases: 0,
    dataTotal: "Unlimited",
    dataUsed: "0 GB",
    lastRecordedUsage: "0 GB",
    subscriptionUrl: "",
    previousUsage: 0,
    previousUsageGB: 0,
    customVpnUserId: "",
    isRenewUnlocked: false,
    renewPopupMessage: "ඔබගේ පැකේජය අලුත් කිරීමට (Renew) දැනට අවසර ලබා දී නොමැත. කරුණාකර Admin අමතන්න.",
    forceShowGuide: false,
    showUsaUsage: false,
    usaSubscriptionUrl: "",
    usaDataTotal: "Unlimited",
    usaDataUsed: "0 GB",
    usaLastRecordedUsage: "0 GB",
    usaPreviousUsage: 0
  };

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

  // 🔑 EXTRACT VPN USER ID (UUID) FROM VLESS CONFIG
  const extractedVpnUserId = useMemo(() => {
    const raw = user?.vpnConfigKey || "";
    const match = raw.match(/vless:\/\/([a-f0-9\-]{36})/i);
    return match ? match[1] : "";
  }, [user?.vpnConfigKey]);

  // 📊 DATA USAGE CONTROLS (3x-ui Auto-Sync & Manual)
  const [selectedDataTotal, setSelectedDataTotal] = useState<string>(metaData.dataTotal || "Unlimited");
  const [dataUsedInput, setDataUsedInput] = useState<string>(metaData.lastRecordedUsage || metaData.dataUsed || "0 GB");
  const [subscriptionUrlInput, setSubscriptionUrlInput] = useState<string>(metaData.subscriptionUrl || "");
  const [previousUsageInput, setPreviousUsageInput] = useState<string | number>(metaData.previousUsage ?? metaData.previousUsageGB ?? 0);
  const [customVpnUserIdInput, setCustomVpnUserIdInput] = useState<string>(metaData.customVpnUserId || extractedVpnUserId || "");
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);
  const [liveRefreshMsg, setLiveRefreshMsg] = useState<string>("");

  // 🇺🇸 USA VPN STATE (PER-CLIENT)
  const [showUsaUsage, setShowUsaUsage] = useState<boolean>(Boolean(metaData.showUsaUsage));
  const [usaSubscriptionUrlInput, setUsaSubscriptionUrlInput] = useState<string>(metaData.usaSubscriptionUrl || "");
  const [usaSelectedDataTotal, setUsaSelectedDataTotal] = useState<string>(metaData.usaDataTotal || "Unlimited");
  const [usaDataUsedInput, setUsaDataUsedInput] = useState<string>(metaData.usaLastRecordedUsage || metaData.usaDataUsed || "0 GB");
  const [usaPreviousUsageInput, setUsaPreviousUsageInput] = useState<string | number>(metaData.usaPreviousUsage ?? 0);

  const handleRefreshSingleClient = async () => {
    setIsRefreshingLive(true);
    setLiveRefreshMsg("Connecting to 3x-ui...");
    try {
      const res = await fetch(`/api/usage?userId=${userId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setDataUsedInput(data.dataUsed);
        if (data.showUsaUsage && data.usaDataUsed) {
          setUsaDataUsedInput(data.usaDataUsed);
        }
        setLiveRefreshMsg(`✓ Live: Main: ${data.dataUsed} ${data.showUsaUsage ? `| USA: ${data.usaDataUsed}` : ""}`);
      } else {
        setLiveRefreshMsg(`⚠️ ${data.warning || data.message || "Failed to fetch live usage"}`);
      }
    } catch {
      setLiveRefreshMsg("⚠️ Connection error fetching 3x-ui data");
    } finally {
      setIsRefreshingLive(false);
    }
  };

  const handleSnapshotPreviousData = () => {
    const match = dataUsedInput.match(/([0-9]+(?:\.[0-9]+)?)/);
    const currentNum = match ? parseFloat(match[1]) : 0;
    
    if (!confirm(`Are you sure you want to LOCK current usage (${currentNum} GB) as Previous Server Data?\n\nWhen switching VPS, this preserves old usage so: Total = ${currentNum} GB + New Server Usage.`)) {
      return;
    }

    setPreviousUsageInput(currentNum);
    const updatedMeta = {
      ...metaData,
      previousUsage: currentNum,
      previousUsageGB: currentNum,
      dataTotal: selectedDataTotal,
      dataUsed: dataUsedInput,
      lastRecordedUsage: dataUsedInput,
      subscriptionUrl: subscriptionUrlInput.trim(),
      customVpnUserId: customVpnUserIdInput.trim(),
      showUsaUsage,
      usaSubscriptionUrl: usaSubscriptionUrlInput.trim(),
      usaDataTotal: usaSelectedDataTotal,
      usaDataUsed: usaDataUsedInput,
      usaLastRecordedUsage: usaDataUsedInput,
      usaPreviousUsage: parseFloat(String(usaPreviousUsageInput)) || 0
    };
    onUpdate(userId, { subscriptionLink: JSON.stringify(updatedMeta) });
    setLiveRefreshMsg(`🔒 Successfully locked ${currentNum} GB as Previous Usage!`);
  };

  const handleSaveDataUsage = () => {
    const rawVal = dataUsedInput.trim();
    let formattedUsed = rawVal ? (rawVal.toLowerCase().includes("gb") || rawVal.toLowerCase().includes("mb") ? rawVal : `${rawVal} GB`) : "0 GB";
    
    // If manual input is 0 or empty, save as "0 GB" so 3x-ui auto-sync takes priority
    if (!rawVal || rawVal === "0" || rawVal === "0 GB" || rawVal === "0GB" || rawVal.toLowerCase() === "0 gb") {
      formattedUsed = "0 GB";
    }

    const rawUsa = usaDataUsedInput.trim();
    let formattedUsa = rawUsa ? (rawUsa.toLowerCase().includes("gb") || rawUsa.toLowerCase().includes("mb") ? rawUsa : `${rawUsa} GB`) : "0 GB";
    if (!rawUsa || rawUsa === "0" || rawUsa === "0 GB" || rawUsa.toLowerCase() === "0 gb") {
      formattedUsa = "0 GB";
    }
    const usaOffset = parseFloat(String(usaPreviousUsageInput)) || 0;

    const offsetVal = parseFloat(String(previousUsageInput)) || 0;

    let finalDataTotal = selectedDataTotal.trim() || "Unlimited";
    if (finalDataTotal && !isNaN(Number(finalDataTotal))) {
      finalDataTotal = `${finalDataTotal} GB`;
    }

    let finalUsaDataTotal = usaSelectedDataTotal.trim() || "Unlimited";
    if (finalUsaDataTotal && !isNaN(Number(finalUsaDataTotal))) {
      finalUsaDataTotal = `${finalUsaDataTotal} GB`;
    }

    const updatedMeta = {
      ...metaData,
      dataTotal: finalDataTotal,
      dataUsed: formattedUsed,
      lastRecordedUsage: formattedUsed,
      subscriptionUrl: subscriptionUrlInput.trim(),
      previousUsage: offsetVal,
      previousUsageGB: offsetVal,
      customVpnUserId: customVpnUserIdInput.trim(),
      showUsaUsage,
      usaSubscriptionUrl: usaSubscriptionUrlInput.trim(),
      usaDataTotal: finalUsaDataTotal,
      usaDataUsed: formattedUsa,
      usaLastRecordedUsage: formattedUsa,
      usaPreviousUsage: usaOffset
    };
    onUpdate(userId, { 
      subscriptionLink: JSON.stringify(updatedMeta),
      ...(subscriptionUrlInput.trim() ? { vpnStatus: "Active" } : {})
    });
  };

  // 🧭 TOGGLE SWITCH FOR CLIENT USER GUIDE (ON / OFF SWITCH)
  const [guideSwitch, setGuideSwitch] = useState<boolean>(Boolean(metaData.forceShowGuide));

  const handleToggleGuideSwitch = () => {
    const newVal = !guideSwitch;
    setGuideSwitch(newVal);
    const updatedMeta = {
      ...metaData,
      forceShowGuide: newVal
    };
    onUpdate(userId, { subscriptionLink: JSON.stringify(updatedMeta) });
  };

  // 🔐 VPN RENEW CONTROLS & CUSTOM POPUP MESSAGE
  const [isRenewUnlocked, setIsRenewUnlocked] = useState<boolean>(Boolean(metaData.isRenewUnlocked));
  const [renewPopupMessageInput, setRenewPopupMessageInput] = useState<string>(
    metaData.renewPopupMessage || "ඔබගේ පැකේජය අලුත් කිරීමට (Renew) දැනට අවසර ලබා දී නොමැත. කරුණාකර Admin අමතන්න."
  );
  const [renewSaveMsg, setRenewSaveMsg] = useState<string>("");

  const handleSaveRenewSettings = () => {
    const updatedMeta = {
      ...metaData,
      isRenewUnlocked,
      renewPopupMessage: renewPopupMessageInput.trim()
    };
    onUpdate(userId, { subscriptionLink: JSON.stringify(updatedMeta) });
    setRenewSaveMsg("✓ Renew settings saved!");
    setTimeout(() => setRenewSaveMsg(""), 3000);
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
      return matches
        .filter(m => m[2] && m[2].trim().length > 0)
        .map((m, idx) => ({
          id: `${idx}-${Date.now()}`,
          name: (m[1] || "").replace(/^📦\s*/, "").replace(/[\[\]]/g, "").trim(),
          code: m[2].trim(),
        }));
    }
    if (raw.trim().length > 0) {
      return [{ id: `0-${Date.now()}`, name: "Default Package", code: raw.trim() }];
    }
    return [];
  };

  const [configItems, setConfigItems] = useState<ConfigItem[]>(parseRawConfigsToItems(user?.vpnConfigKey || ""));

  useEffect(() => {
    setConfigItems(parseRawConfigsToItems(user?.vpnConfigKey || ""));
  }, [user?.vpnConfigKey, userId]);

  const serializeConfigItems = (items: ConfigItem[]): string => {
    return items
      .filter(item => item && item.code && item.code.trim().length > 0)
      .map(item => `[ ${(item.name || "Default Package").replace(/^📦\s*/, "").replace(/[\[\]]/g, "").trim()} ]\n${item.code.trim()}`)
      .join("\n\n");
  };

  const handleAddNewConfigSection = () => {
    const newItem: ConfigItem = {
      id: `${Date.now()}`,
      name: PACKAGE_LIST[0],
      code: ""
    };
    setConfigItems(prev => [...prev, newItem]);
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

  const [isResetting, setIsResetting] = useState(false);
  const handleResetAccount = async () => {
    const confirmPrompt = window.confirm(
      `⚠️ WARNING: Are you sure you want to completely RESET ${user.name || user.email}'s account?\n\nThis will restore the account back to its initial state:\n- Clears all VPN configs\n- Clears Data Usage & 3x-ui links\n- Resets status to Inactive\n- Clears expiry dates\n- Clears custom alert messages\n\nClick OK to confirm reset.`
    );
    if (!confirmPrompt) return;

    try {
      setIsResetting(true);
      const res = await resetUserAccount(userId);
      if (res.success) {
        alert("Account has been reset to its initial state successfully!");
        window.location.reload();
      } else {
        alert(res.error || "Failed to reset account");
      }
    } catch (e: any) {
      alert("Error resetting account: " + (e?.message || e));
    } finally {
      setIsResetting(false);
    }
  };

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
          
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {user.vpnStatus !== "Banned" ? (
              <button onClick={handleBanUser} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 1.2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
                🚫 Ban Client
              </button>
            ) : (
              <button onClick={handleUnbanUser} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.5rem 1.2rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
                ✅ Unban Client
              </button>
            )}

            <button 
              onClick={handleResetAccount} 
              disabled={isResetting}
              title="Reset account to initial blank state (clears configs, usage, and dates)"
              style={{ 
                background: "rgba(239, 68, 68, 0.18)", 
                color: "#fca5a5", 
                border: "1px solid rgba(239, 68, 68, 0.45)", 
                padding: "0.5rem 1.1rem", 
                borderRadius: "8px", 
                fontWeight: "bold", 
                cursor: isResetting ? "not-allowed" : "pointer", 
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              🔄 {isResetting ? "Resetting..." : "Reset Account"}
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 USER GUIDE ON / OFF SWITCH CARD */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.2rem 1.5rem", borderRadius: "14px", border: `1px solid ${guideSwitch ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.08)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h4 style={{ margin: "0 0 0.3rem 0", color: guideSwitch ? "#22c55e" : "#FFF", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🧭</span> Client Interactive User Guide
          </h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
            User Guide Switch: <strong style={{ color: guideSwitch ? "#22c55e" : "#ef4444" }}>{guideSwitch ? "ON (Will prompt user next visit)" : "OFF (Disabled for this Client)"}</strong>
          </p>
        </div>

        {/* Real Toggle Switch */}
        <div 
          onClick={handleToggleGuideSwitch}
          style={{ 
            width: "64px", 
            height: "34px", 
            borderRadius: "20px", 
            background: guideSwitch ? "#22c55e" : "rgba(255,255,255,0.15)", 
            position: "relative", 
            cursor: "pointer", 
            transition: "all 0.25s ease",
            boxShadow: guideSwitch ? "0 0 15px rgba(34,197,94,0.4)" : "none" 
          }}
          title={guideSwitch ? "Click to turn OFF Guide" : "Click to turn ON Guide"}
        >
          <div 
            style={{ 
              width: "26px", 
              height: "26px", 
              borderRadius: "50%", 
              background: "#FFF", 
              position: "absolute", 
              top: "4px", 
              left: guideSwitch ? "34px" : "4px", 
              transition: "left 0.25s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)" 
            }} 
          />
        </div>
      </div>

      {/* 📊 DATA USAGE MANAGEMENT CARD */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0, color: "#3b82f6", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📊</span> Data Usage Management
          </h3>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {/* Refresh Live Usage Button */}
            <button
              type="button"
              onClick={handleRefreshSingleClient}
              disabled={isRefreshingLive}
              style={{
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: isRefreshingLive ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              {isRefreshingLive ? "Checking 3x-ui..." : "Refresh"}
            </button>

            {/* Snapshot / Lock Previous Data Button */}
            <button
              type="button"
              onClick={handleSnapshotPreviousData}
              title="Lock current usage into previousUsage before switching to a new VPS"
              style={{
                background: "rgba(234, 179, 8, 0.15)",
                color: "#facc15",
                border: "1px solid rgba(234, 179, 8, 0.4)",
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              🔒 Snapshot / Lock as Previous Data
            </button>
          </div>
        </div>

        {liveRefreshMsg && (
          <div style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#93c5fd", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {liveRefreshMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
          <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Package Total Data</p>
              <span style={{ fontSize: "0.68rem", color: "#60a5fa", background: "rgba(59,130,246,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Custom Typeable</span>
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              <input 
                type="text" 
                placeholder="e.g. 20 GB, 50 GB, Unlimited"
                value={selectedDataTotal} 
                onChange={(e) => setSelectedDataTotal(e.target.value)}
                style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(59,130,246,0.35)", color: "#3b82f6", fontWeight: "bold", fontSize: "0.95rem", outline: "none" }}
              />
              <select 
                value={DATA_PACKAGE_OPTIONS.includes(selectedDataTotal) ? selectedDataTotal : ""} 
                onChange={(e) => {
                  if (e.target.value) setSelectedDataTotal(e.target.value);
                }}
                style={{ width: "95px", padding: "0.6rem 0.3rem", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#9ca3af", fontSize: "0.8rem", outline: "none", cursor: "pointer" }}
                title="Quick preset select"
              >
                <option value="">Presets...</option>
                {DATA_PACKAGE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Data Used (Manual Input / Total)</p>
              <button
                type="button"
                onClick={() => setDataUsedInput("0 GB")}
                style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.4)", borderRadius: "4px", fontSize: "0.65rem", padding: "1px 6px", cursor: "pointer" }}
                title="Reset to 0 GB to enable 3x-ui Auto-Sync"
              >
                Reset to 0 GB
              </button>
            </div>
            <input 
              type="text" 
              placeholder="0 GB (Auto-Sync from Link)"
              value={dataUsedInput} 
              onChange={(e) => setDataUsedInput(e.target.value)}
              style={{ marginTop: "6px", width: "100%", padding: "0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFF", fontWeight: "bold", fontSize: "0.95rem", boxSizing: "border-box", outline: "none" }}
            />
            <span style={{ fontSize: "0.7rem", color: (!dataUsedInput || dataUsedInput === "0 GB" || dataUsedInput === "0") && subscriptionUrlInput ? "#10b981" : "#9ca3af", marginTop: "4px", display: "block" }}>
              {(!dataUsedInput || dataUsedInput === "0 GB" || dataUsedInput === "0") && subscriptionUrlInput
                ? "✓ 0 GB ඇත: Subscription Link එකෙන් Live Fetch වේ"
                : "Manual අගයක් ඇත (0 GB දැමූ විට Link එකෙන් Auto-Fetch වේ)"}
            </span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Previous Server Usage Offset (GB)</p>
            <input 
              type="number" 
              step="0.01"
              min="0"
              placeholder="0"
              value={previousUsageInput} 
              onChange={(e) => setPreviousUsageInput(e.target.value)}
              style={{ marginTop: "6px", width: "100%", padding: "0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#eab308", fontWeight: "bold", fontSize: "0.95rem", boxSizing: "border-box", outline: "none" }}
            />
            <span style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "4px", display: "block" }}>
              VPS මාරු කරන විට පරණ Server එකේ GB මෙතනට දමන්න (හෝ Snapshot click කරන්න)
            </span>
          </div>
        </div>

        {/* 3x-ui Subscription Link Input */}
        <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(59, 130, 246, 0.25)", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#60a5fa", fontWeight: "600" }}>
              🔗 3x-ui Subscription Link (Auto-Sync)
            </p>
            {subscriptionUrlInput ? (
              <span style={{ fontSize: "0.7rem", color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: "4px" }}>
                ● 100% Realtime Auto-Sync Active
              </span>
            ) : (
              <span style={{ fontSize: "0.7rem", color: "#9ca3af", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                Manual Mode (No Link)
              </span>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Paste 3x-ui subscription URL (e.g. https://your-vps.com:2096/sub/token...)"
            value={subscriptionUrlInput} 
            onChange={(e) => setSubscriptionUrlInput(e.target.value)}
            style={{ marginTop: "8px", width: "100%", padding: "0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#60a5fa", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
          />
        </div>

        {/* Custom VPN User ID (UUID) Input */}
        <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#a5b4fc", fontWeight: "600" }}>
              🔑 Custom VPN User ID (UUID)
            </p>
            <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
              {customVpnUserIdInput ? "Custom ID Configured" : "Auto-extracted from VLESS Key"}
            </span>
          </div>
          <input 
            type="text" 
            placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab (Empty = Auto from VLESS Key)"
            value={customVpnUserIdInput} 
            onChange={(e) => setCustomVpnUserIdInput(e.target.value)}
            style={{ marginTop: "8px", width: "100%", padding: "0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#a5b4fc", fontFamily: "monospace", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
          />
        </div>

        {/* 🇺🇸 USA VPN USAGE CONTROL (PER-CLIENT ON / OFF SWITCH & 3X-UI LINK) */}
        <div style={{ background: showUsaUsage ? "rgba(236, 72, 153, 0.08)" : "rgba(0,0,0,0.3)", padding: "1.2rem", borderRadius: "12px", border: `1px solid ${showUsaUsage ? "rgba(236, 72, 153, 0.35)" : "rgba(255,255,255,0.08)"}`, marginBottom: "1.2rem", transition: "all 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h4 style={{ margin: 0, color: showUsaUsage ? "#f472b6" : "#cbd5e1", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🇺🇸</span> USA VPN Usage Card (Bonus / Router Config)
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                {showUsaUsage ? "Client Dashboard එකේ USA VPN Usage Card එක පෙන්වයි." : "Off කර ඇති විට Client ට Main Usage Card එක පමණක් පෙන්වයි."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUsaUsage(!showUsaUsage)}
              style={{
                background: showUsaUsage ? "linear-gradient(90deg, #db2777, #ec4899)" : "rgba(255,255,255,0.08)",
                color: "#FFF",
                border: `1px solid ${showUsaUsage ? "#f472b6" : "rgba(255,255,255,0.15)"}`,
                padding: "0.45rem 1.1rem",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: showUsaUsage ? "0 2px 10px rgba(236,72,153,0.3)" : "none",
                transition: "all 0.2s"
              }}
            >
              {showUsaUsage ? "🇺🇸 USA VPN Card: ON" : "🇺🇸 USA VPN Card: OFF"}
            </button>
          </div>

          {showUsaUsage && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", borderTop: "1px solid rgba(236, 72, 153, 0.2)", paddingTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#f472b6" }}>USA VPN Total Quota</p>
                    <span style={{ fontSize: "0.68rem", color: "#f472b6", background: "rgba(244,114,182,0.15)", padding: "1px 6px", borderRadius: "4px" }}>Custom Typeable</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 200 GB, Unlimited"
                      value={usaSelectedDataTotal} 
                      onChange={(e) => setUsaSelectedDataTotal(e.target.value)}
                      style={{ flex: 1, padding: "0.55rem", borderRadius: "6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(244,114,182,0.35)", color: "#f472b6", fontWeight: "bold", outline: "none" }}
                    />
                    <select 
                      value={DATA_PACKAGE_OPTIONS.includes(usaSelectedDataTotal) ? usaSelectedDataTotal : ""} 
                      onChange={(e) => {
                        if (e.target.value) setUsaSelectedDataTotal(e.target.value);
                      }}
                      style={{ width: "90px", padding: "0.55rem 0.2rem", borderRadius: "6px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#9ca3af", fontSize: "0.75rem", outline: "none", cursor: "pointer" }}
                      title="Quick preset select"
                    >
                      <option value="">Presets...</option>
                      {DATA_PACKAGE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#f472b6" }}>USA Data Used (Manual / Auto)</p>
                    <button
                      type="button"
                      onClick={() => setUsaDataUsedInput("0 GB")}
                      style={{ background: "rgba(236, 72, 153, 0.2)", color: "#f472b6", border: "1px solid rgba(236, 72, 153, 0.4)", borderRadius: "4px", fontSize: "0.65rem", padding: "1px 6px", cursor: "pointer" }}
                    >
                      Reset 0 GB
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="0 GB"
                    value={usaDataUsedInput} 
                    onChange={(e) => setUsaDataUsedInput(e.target.value)}
                    style={{ marginTop: "6px", width: "100%", padding: "0.55rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFF", fontWeight: "bold", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#f472b6" }}>USA Previous Server Offset (GB)</p>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={usaPreviousUsageInput} 
                    onChange={(e) => setUsaPreviousUsageInput(e.target.value)}
                    style={{ marginTop: "6px", width: "100%", padding: "0.55rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#eab308", fontWeight: "bold", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* USA 3x-ui Link */}
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(236, 72, 153, 0.25)" }}>
                <p style={{ margin: "0 0 6px 0", fontSize: "0.75rem", color: "#f472b6", fontWeight: "bold" }}>
                  🔗 USA VPN 3x-ui Subscription Link
                </p>
                <input 
                  type="text" 
                  placeholder="Paste USA VPN 3x-ui subscription URL (e.g. https://usa-vps.com:2096/sub/...)"
                  value={usaSubscriptionUrlInput} 
                  onChange={(e) => setUsaSubscriptionUrlInput(e.target.value)}
                  style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#f472b6", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSaveDataUsage}
          style={{ background: "linear-gradient(90deg, #2563eb, #3b82f6)", color: "#FFF", border: "none", padding: "0.6rem 1.6rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
        >
          💾 Save Data Usage & ID Settings
        </button>
      </div>

      {/* 🏆 RANK & PURCHASES MANAGEMENT CARD */}
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

      {/* 🔐 VPN RENEW CONTROL & CUSTOM POPUP */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.4rem", borderRadius: "14px", border: `1px solid ${isRenewUnlocked ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, color: isRenewUnlocked ? "#4ade80" : "#f87171", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{isRenewUnlocked ? "🔓" : "🔐"}</span> VPN Renew Control & Custom Popup
            </h3>
            <p style={{ margin: "0.2rem 0 0 0", color: "#9ca3af", fontSize: "0.8rem" }}>Control renewal button access and configure the modal message shown to this client.</p>
          </div>

          {/* Toggle Lock / Unlock */}
          <button
            type="button"
            onClick={() => setIsRenewUnlocked(!isRenewUnlocked)}
            style={{
              background: isRenewUnlocked ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
              color: isRenewUnlocked ? "#22c55e" : "#ef4444",
              border: `1px solid ${isRenewUnlocked ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              padding: "0.45rem 1.1rem",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {isRenewUnlocked ? "🔓 Renew Unlocked" : "🔒 Renew Locked"} (Click to Toggle)
          </button>
        </div>

        <p style={{ margin: "0 0 0.6rem 0", color: "#cbd5e1", fontSize: "0.82rem" }}>
          Custom Popup Message (Client ගේ Renew Button එක ක්ලික් කළ විට පෙන්වන පණිවිඩය):
        </p>

        <textarea
          rows={3}
          value={renewPopupMessageInput}
          onChange={(e) => setRenewPopupMessageInput(e.target.value)}
          placeholder="Type custom renewal modal popup message here..."
          style={{
            width: "100%",
            padding: "0.8rem",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#FFF",
            fontSize: "0.85rem",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            marginBottom: "0.8rem"
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={handleSaveRenewSettings}
            style={{
              background: "linear-gradient(90deg, #10b981, #059669)",
              color: "#FFF",
              border: "none",
              padding: "0.6rem 1.6rem",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "0.9rem",
              boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
            }}
          >
            💾 Save Renew Settings
          </button>
          {renewSaveMsg && (
            <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: "bold" }}>{renewSaveMsg}</span>
          )}
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
