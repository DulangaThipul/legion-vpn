"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAdmin, resetUserAccount } from "@/lib/authActions";
import { DEFAULT_ISP_DOMAINS, DEFAULT_PACKAGE_SNIS, PACKAGE_ISP_PRICES, buildVlessLink, formatConfigSlotTitle } from "@/lib/vlessGenerator";

// ============================================================================
// THEMED SVG VECTOR ICONS (STRICT 100% NO-EMOJI POLICY)
// ============================================================================

const SvgShield = ({ size = 18, color = "#818cf8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SvgUsers = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SvgGlobe = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SvgServer = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const SvgSliders = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const SvgZap = ({ size = 16, color = "#38bdf8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SvgBarChart = ({ size = 16, color = "#38bdf8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const SvgClock = ({ size = 14, color = "#818cf8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SvgCheck = ({ size = 16, color = "#22c55e" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgKey = ({ size = 16, color = "#eab308" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-1.5 1.5L16 7l-2-2-1.5 1.5 2 2L13 10l-1.5-1.5-2 2 1.5 1.5L9.5 13.5l-2-2-1.5 1.5 2 2L6 17l-4 4v3h3l4-4 2 2 1.5-1.5-2-2L12 13l1.5-1.5-2-2 1.5-1.5 2 2L17 8l-1.5-1.5L17 5l2-2z" />
    <circle cx="7.5" cy="16.5" r="1.5" />
  </svg>
);

const SvgLock = ({ size = 16, color = "#ef4444" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SvgUnlock = ({ size = 16, color = "#22c55e" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const SvgRefresh = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const SvgCopy = ({ size = 15, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const SvgTrash = ({ size = 15, color = "#ef4444" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SvgPlus = ({ size = 15, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SvgAlertTriangle = ({ size = 16, color = "#f59e0b" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SvgCompass = ({ size = 16, color = "#818cf8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const SvgArrowLeft = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SvgReceipt = ({ size = 16, color = "#a855f7" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

const SvgLayers = ({ size = 16, color = "#6366f1" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const SvgTrophy = ({ size = 16, color = "#eab308" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
  </svg>
);

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

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

const DATA_PRESETS = [
  "20 GB",
  "25 GB",
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

// ============================================================================
// MAIN COMPONENT: ADMIN DASHBOARD CLIENT (4-TAB ARCHITECTURE)
// ============================================================================

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const safeUsers = Array.isArray(initialUsers) ? initialUsers : [];
  const [users, setUsers] = useState<any[]>(safeUsers);
  const [activeTab, setActiveTab] = useState<"crm" | "dns" | "server" | "automation">("crm");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncMsg, setBulkSyncMsg] = useState("");

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleBulkRefresh = async () => {
    if (!confirm("Fetch live 3x-ui usage for all clients with subscription links right now?")) return;
    setIsBulkSyncing(true);
    setBulkSyncMsg("Bulk syncing all clients...");
    try {
      const res = await fetch("/api/usage?bulk=true", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setBulkSyncMsg(`Updated ${data.updatedCount} clients!`);
        showToast(`Bulk sync: Updated ${data.updatedCount} clients!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBulkSyncMsg("Bulk sync failed");
      }
    } catch {
      setBulkSyncMsg("Bulk sync error");
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const response = await updateUserAdmin(userId, updates);
      if (response?.success) {
        setUsers(prev => prev.map(u => ((u.id === userId || u._id === userId) ? { ...u, ...updates } : u)));
        showToast("Successfully saved to database!");
        router.refresh();
      } else {
        alert("Error saving: " + response?.error);
      }
    } catch {
      alert("Network error: Failed to update database.");
    }
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
        Loading Admin Command Center...
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    (u?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => (u?.id || u?._id) === selectedUserId);

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 10, background: "transparent", color: "#FFF", paddingBottom: "50px" }}>
      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "rgba(34,197,94,0.9)", backdropFilter: "blur(12px)", color: "#000", padding: "0.85rem 1.8rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 30px rgba(34,197,94,0.4)", display: "flex", alignItems: "center", gap: "8px" }}>
          <SvgCheck size={18} color="#000" />
          <span>{toast}</span>
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <header style={{ padding: "1rem 2rem", background: "rgba(10, 10, 18, 0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SvgShield size={24} color="#818cf8" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "700", letterSpacing: "0.5px" }}>LEGION Command Center</h1>
            <span style={{ fontSize: "0.72rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase" }}>Enterprise VLESS &amp; Node Automation</span>
          </div>
        </div>

        {/* 4 TOP TABS SELECTOR */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "4px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("crm")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === "crm" ? "linear-gradient(90deg, #6366f1, #818cf8)" : "transparent",
              color: activeTab === "crm" ? "#FFF" : "#9ca3af"
            }}
          >
            <SvgUsers size={16} color={activeTab === "crm" ? "#FFF" : "#9ca3af"} />
            <span>Clients CRM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dns")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === "dns" ? "linear-gradient(90deg, #6366f1, #818cf8)" : "transparent",
              color: activeTab === "dns" ? "#FFF" : "#9ca3af"
            }}
          >
            <SvgGlobe size={16} color={activeTab === "dns" ? "#FFF" : "#9ca3af"} />
            <span>DNS &amp; SNI Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("server")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === "server" ? "linear-gradient(90deg, #6366f1, #818cf8)" : "transparent",
              color: activeTab === "server" ? "#FFF" : "#9ca3af"
            }}
          >
            <SvgServer size={16} color={activeTab === "server" ? "#FFF" : "#9ca3af"} />
            <span>3x-ui Server Node</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("automation")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === "automation" ? "linear-gradient(90deg, #6366f1, #818cf8)" : "transparent",
              color: activeTab === "automation" ? "#FFF" : "#9ca3af"
            }}
          >
            <SvgSliders size={16} color={activeTab === "automation" ? "#FFF" : "#9ca3af"} />
            <span>Automation &amp; Security</span>
          </button>
        </div>

        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#818cf8",
            textDecoration: "none",
            fontWeight: "bold",
            background: "rgba(99,102,241,0.15)",
            padding: "0.6rem 1.2rem",
            borderRadius: "8px",
            border: "1px solid rgba(99,102,241,0.3)",
            fontSize: "0.85rem"
          }}
        >
          <SvgArrowLeft size={15} color="#818cf8" />
          <span>Exit to Dashboard</span>
        </Link>
      </header>

      {/* TAB 1: CLIENTS CRM */}
      {activeTab === "crm" && (
        <main style={{ position: "relative", zIndex: 20, display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", padding: "1.5rem 2rem", maxWidth: "1600px", margin: "0 auto", height: "calc(100vh - 110px)", boxSizing: "border-box" }}>
          
          {/* USER LIST (LEFT PANE) */}
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
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: isBulkSyncing ? "rgba(59, 130, 246, 0.1)" : "linear-gradient(90deg, #2563eb, #3b82f6)", color: "#FFF", border: "none", borderRadius: "8px", padding: "0.75rem 0.9rem", cursor: isBulkSyncing ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: "bold", whiteSpace: "nowrap" }}
                >
                  <SvgZap size={14} color="#FFF" />
                  <span>{isBulkSyncing ? "Syncing..." : "Sync All"}</span>
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
                    <img src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=1e1e38&color=818cf8`} alt="Avatar" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h4 style={{ margin: "0 0 0.2rem 0", color: "#FFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.95rem" }}>
                          {u.name || "Unknown User"} {isPrem && <SvgCheck size={14} color="#38bdf8" />}
                        </h4>
                        <span style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: "bold" }}>{userRank}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{u.email}</p>
                      
                      <p style={{ margin: "3px 0 0 0", fontSize: "0.72rem", color: "#38bdf8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "4px" }}>
                        <SvgBarChart size={12} color="#38bdf8" />
                        <span>{uDataUsed} {uPrev > 0 ? `(Prev: ${uPrev} GB)` : ""}</span>
                      </p>

                      {displayTime ? (
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.68rem", color: "#818cf8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "flex", alignItems: "center", gap: "4px" }}>
                          <SvgClock size={11} color="#818cf8" />
                          <span>{new Date(displayTime).toLocaleDateString()} · {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* USER DETAILS PANE (RIGHT PANE) */}
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
      )}

      {/* TAB 2: DNS & SNI ENGINE */}
      {activeTab === "dns" && <DnsSniEngineTab showToast={showToast} />}

      {/* TAB 3: 3X-UI SERVER NODE */}
      {activeTab === "server" && <ServerNodeTab showToast={showToast} />}

      {/* TAB 4: AUTOMATION & SECURITY CONTROL */}
      {activeTab === "automation" && <AutomationSecurityTab showToast={showToast} />}

    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: USER DETAILS PANEL (CRM TAB)
// ============================================================================

function UserDetailsPanel({ user, onUpdate }: { user: any; onUpdate: (id: string, updates: any) => void }) {
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

  // ONLINE STATUS TRACKER
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

  // RANK CONTROLS
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

  // EXTRACT VPN USER ID (UUID) FROM VLESS CONFIG
  const extractedVpnUserId = useMemo(() => {
    const raw = user?.vpnConfigKey || "";
    const match = raw.match(/vless:\/\/([a-f0-9\-]{36})/i);
    return match ? match[1] : "";
  }, [user?.vpnConfigKey]);

  // DATA USAGE CONTROLS (Custom Typeable Input + Presets Dropdown)
  const [customDataTotalInput, setCustomDataTotalInput] = useState<string>(metaData.dataTotal || "25 GB");
  const [dataUsedInput, setDataUsedInput] = useState<string>(metaData.lastRecordedUsage || metaData.dataUsed || "0 GB");
  const [subscriptionUrlInput, setSubscriptionUrlInput] = useState<string>(metaData.subscriptionUrl || "");
  const [previousUsageInput, setPreviousUsageInput] = useState<string | number>(metaData.previousUsage ?? metaData.previousUsageGB ?? 0);
  const [customVpnUserIdInput, setCustomVpnUserIdInput] = useState<string>(metaData.customVpnUserId || extractedVpnUserId || "");
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);
  const [liveRefreshMsg, setLiveRefreshMsg] = useState<string>("");

  // USA VPN STATE
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
        setLiveRefreshMsg(`Live: Main: ${data.dataUsed} ${data.showUsaUsage ? `| USA: ${data.usaDataUsed}` : ""}`);
      } else {
        setLiveRefreshMsg(`${data.warning || data.message || "Failed to fetch live usage"}`);
      }
    } catch {
      setLiveRefreshMsg("Connection error fetching 3x-ui data");
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
      dataTotal: customDataTotalInput,
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
    setLiveRefreshMsg(`Successfully locked ${currentNum} GB as Previous Usage!`);
  };

  // CONFIGS MANAGEMENT (MOVED UP FOR ACCESS IN DATA USAGE HANDLER)
  interface ConfigItem {
    id: string;
    name: string;
    code: string;
  }

  const parseRawConfigsToItems = (raw: string): ConfigItem[] => {
    if (!raw) return [];
    const regex = /\[(.*?)\]\s*([\s\S]*?)(?=\[|$)/g;
    const matches = [...raw.matchAll(regex)];
    if (matches.length > 0) {
      return matches
        .filter(m => m[2] && m[2].trim().length > 0)
        .map((m, idx) => ({
          id: `${idx}-${Date.now()}`,
          name: (m[1] || "").replace(/[\[\]]/g, "").trim(),
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
      .map(item => `[ ${(item.name || "Default Package").replace(/[\[\]]/g, "").trim()} ]\n${item.code.trim()}`)
      .join("\n\n");
  };

  const handleSaveDataUsage = () => {
    let rawVal = dataUsedInput.trim();
    let offsetVal = parseFloat(String(previousUsageInput)) || 0;

    // FIX 6: Auto-rollover if subscriptionUrl changed and was not previously empty
    const oldSubUrl = (metaData.subscriptionUrl || "").trim();
    const newSubUrl = subscriptionUrlInput.trim();
    if (newSubUrl && oldSubUrl && newSubUrl !== oldSubUrl) {
      const currentUsageNum = parseFloat(rawVal) || 0;
      if (currentUsageNum > 0) {
        offsetVal = parseFloat((offsetVal + currentUsageNum).toFixed(3));
        setPreviousUsageInput(offsetVal);
        rawVal = "0 GB";
        setDataUsedInput("0 GB");
        setLiveRefreshMsg(`Auto-rolled over ${currentUsageNum} GB into Previous Usage!`);
      }
    }

    let formattedUsed = rawVal ? (rawVal.toLowerCase().includes("gb") || rawVal.toLowerCase().includes("mb") ? rawVal : `${rawVal} GB`) : "0 GB";
    if (!rawVal || rawVal === "0" || rawVal === "0 GB" || rawVal === "0GB" || rawVal.toLowerCase() === "0 gb") {
      formattedUsed = "0 GB";
    }

    const rawUsa = usaDataUsedInput.trim();
    let formattedUsa = rawUsa ? (rawUsa.toLowerCase().includes("gb") || rawUsa.toLowerCase().includes("mb") ? rawUsa : `${rawUsa} GB`) : "0 GB";
    if (!rawUsa || rawUsa === "0" || rawUsa === "0 GB" || rawUsa.toLowerCase() === "0 gb") {
      formattedUsa = "0 GB";
    }

    const usaOffset = parseFloat(String(usaPreviousUsageInput)) || 0;

    let finalDataTotal = customDataTotalInput.trim() || "Unlimited";
    if (finalDataTotal && !isNaN(Number(finalDataTotal))) {
      finalDataTotal = `${finalDataTotal} GB`;
    }

    let finalUsaDataTotal = usaSelectedDataTotal.trim() || "Unlimited";
    if (finalUsaDataTotal && !isNaN(Number(finalUsaDataTotal))) {
      finalUsaDataTotal = `${finalUsaDataTotal} GB`;
    }

    // FIX 6: UUID Sync across config slots if valid UUID entered
    const targetUuid = customVpnUserIdInput.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let serializedConfigs: string | undefined = undefined;
    if (targetUuid && uuidRegex.test(targetUuid) && configItems.length > 0) {
      let configsChanged = false;
      const updatedItems = configItems.map(item => {
        if (item.code && /vless:\/\/[a-f0-9\-]{36}/i.test(item.code)) {
          const newCode = item.code.replace(/vless:\/\/[a-f0-9\-]{36}/gi, `vless://${targetUuid}`);
          if (newCode !== item.code) {
            configsChanged = true;
            return { ...item, code: newCode };
          }
        }
        return item;
      });
      if (configsChanged) {
        setConfigItems(updatedItems);
        serializedConfigs = serializeConfigItems(updatedItems);
      }
    }

    const updatedMeta = {
      ...metaData,
      dataTotal: finalDataTotal,
      dataUsed: formattedUsed,
      lastRecordedUsage: formattedUsed,
      subscriptionUrl: newSubUrl,
      previousUsage: offsetVal,
      previousUsageGB: offsetVal,
      customVpnUserId: targetUuid,
      showUsaUsage,
      usaSubscriptionUrl: usaSubscriptionUrlInput.trim(),
      usaDataTotal: finalUsaDataTotal,
      usaDataUsed: formattedUsa,
      usaLastRecordedUsage: formattedUsa,
      usaPreviousUsage: usaOffset
    };

    onUpdate(userId, { 
      subscriptionLink: JSON.stringify(updatedMeta),
      ...(newSubUrl ? { vpnStatus: "Active" } : {}),
      ...(serializedConfigs ? { vpnConfigKey: serializedConfigs } : {})
    });
  };

  // CLIENT USER GUIDE SWITCH
  const [guideSwitch, setGuideSwitch] = useState<boolean>(Boolean(metaData.forceShowGuide));
  const handleToggleGuideSwitch = () => {
    const newVal = !guideSwitch;
    setGuideSwitch(newVal);
    onUpdate(userId, { subscriptionLink: JSON.stringify({ ...metaData, forceShowGuide: newVal }) });
  };

  // VPN RENEW CONTROLS
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
    setRenewSaveMsg("Renew settings saved!");
    setTimeout(() => setRenewSaveMsg(""), 3000);
  };

  const handleAddNewConfigSection = () => {
    const activeUuid = customVpnUserIdInput.trim() || extractedVpnUserId || "12345678-1234-1234-1234-1234567890ab";
    const templateLink = buildVlessLink({
      uuid: activeUuid,
      ispDomain: DEFAULT_ISP_DOMAINS["Dialog"],
      packageSni: DEFAULT_PACKAGE_SNIS["dialog-zoom"] || "aka.ms",
      ispName: "Dialog",
      ispPrice: PACKAGE_ISP_PRICES["dialog-zoom"]?.priceDigits || "724",
      clientEmail: user.email
    });

    const newItem: ConfigItem = {
      id: `${Date.now()}`,
      name: PACKAGE_LIST[0],
      code: templateLink
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

  // DAYS ADJUSTMENT
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

  // LIVE POPUP MESSAGE TO CLIENT (NO EMOJIS - CLEAN TEXT BADGES)
  const [msgBadge, setMsgBadge] = useState<string>("[WARNING]");
  const [msgText, setMsgText] = useState("");

  const saveMeta = (alertVal: string, isPremVal: boolean) => {
    const payload = JSON.stringify({ ...metaData, alert: alertVal, isPremium: isPremVal });
    onUpdate(userId, { subscriptionLink: payload });
  };

  const togglePremium = () => saveMeta(metaData.alert, !metaData.isPremium);

  const handleSendMessage = () => {
    if (!msgText.trim()) return;
    saveMeta(`${msgBadge} ${msgText.trim()}`, metaData.isPremium);
    setMsgText("");
  };

  const handleClearMessage = () => saveMeta("", metaData.isPremium);

  const handleBanUser = () => {
    if (confirm(`Are you sure you want to BAN ${user.name || "this user"}?`)) {
      onUpdate(userId, { vpnStatus: "Banned" });
    }
  };
  const handleUnbanUser = () => onUpdate(userId, { vpnStatus: "Active" });

  const [isResetting, setIsResetting] = useState(false);
  const handleResetAccount = async () => {
    const confirmPrompt = window.confirm(
      `WARNING: Are you sure you want to completely RESET ${user.name || user.email}'s account?\n\nThis will restore the account back to its initial state:\n- Clears all VPN configs\n- Clears Data Usage & 3x-ui links\n- Resets status to Inactive\n- Clears expiry dates\n- Clears custom alert messages\n\nClick OK to confirm reset.`
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

  const handleDeletePayment = (paymentIdentifier: any) => {
    if (!confirm("Are you sure you want to permanently delete this payment slip record?")) return;

    const updatedPayments = (metaData.payments || []).filter((p: any) => p.id !== paymentIdentifier && p.date !== paymentIdentifier);
    const updatedPendingOrders = (metaData.pendingOrders || []).filter((po: any) => po.id !== paymentIdentifier && po.date !== paymentIdentifier);

    const updatedMeta = { 
      ...metaData, 
      payments: updatedPayments, 
      pendingOrders: updatedPendingOrders 
    };

    onUpdate(userId, { subscriptionLink: JSON.stringify(updatedMeta) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* 1. CLIENT HEADER & QUICK CONTROLS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1e1e38&color=818cf8`} alt="Avatar" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${isClientOnline ? "#22c55e" : "rgba(255,255,255,0.1)"}` }} />
          <div>
            <h2 style={{ margin: "0 0 0.3rem 0", fontSize: "1.4rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{user.name || "Unknown User"}</span>
              {metaData.isPremium && <span style={{ fontSize: "0.75rem", background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59, 130, 246, 0.4)", color: "#60a5fa", padding: "2px 8px", borderRadius: "12px" }}>PRO</span>}
            </h2>
            <p style={{ margin: "0 0 0.4rem 0", color: "#9ca3af", fontSize: "0.85rem" }}>{user.email}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isClientOnline ? "#22c55e" : "#6b7280" }} />
              <span style={{ color: isClientOnline ? "#4ade80" : "#9ca3af" }}>{onlineText}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={togglePremium}
            style={{
              background: metaData.isPremium ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${metaData.isPremium ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.12)"}`,
              color: metaData.isPremium ? "#4ade80" : "#d1d5db",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: "600"
            }}
          >
            {metaData.isPremium ? "Revoke Premium" : "Set as Premium"}
          </button>

          {user.vpnStatus === "Banned" ? (
            <button type="button" onClick={handleUnbanUser} style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.6rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.82rem" }}>
              Unban Client
            </button>
          ) : (
            <button type="button" onClick={handleBanUser} style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", padding: "0.6rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.82rem" }}>
              Ban Client
            </button>
          )}

          <button
            type="button"
            onClick={handleResetAccount}
            disabled={isResetting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#fca5a5",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              cursor: isResetting ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "0.82rem"
            }}
          >
            <SvgRefresh size={14} color="#fca5a5" />
            <span>{isResetting ? "Resetting..." : "Reset Account"}</span>
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE USER GUIDE SWITCH */}
      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "1.2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SvgCompass size={20} color="#818cf8" />
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>Client Interactive User Guide</h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
              Switch: <strong style={{ color: guideSwitch ? "#4ade80" : "#f87171" }}>{guideSwitch ? "ON (Guide automatically shows)" : "OFF (Disabled for this client)"}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleGuideSwitch}
          style={{
            background: guideSwitch ? "linear-gradient(90deg, #10b981, #059669)" : "rgba(255,255,255,0.1)",
            color: "#FFF",
            border: "none",
            borderRadius: "20px",
            padding: "0.45rem 1.2rem",
            fontSize: "0.8rem",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {guideSwitch ? "ON" : "OFF"}
        </button>
      </div>

      {/* 2.5 RANK & PURCHASES MANAGEMENT */}
      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SvgTrophy size={20} color="#eab308" />
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>Rank &amp; Purchases Management</h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                Verified in-app orders: <strong style={{ color: "#4ade80" }}>{(metaData.payments || []).filter((p: any) => p?.status === "Verified").length}</strong> | Total Purchases Count: <strong style={{ color: "#eab308" }}>{(metaData.payments || []).filter((p: any) => p?.status === "Verified").length + (Number(bonusPurchasesInput) || 0)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveRankSettings}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(90deg, #eab308, #ca8a04)",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1.1rem",
              fontSize: "0.8rem",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            <SvgCheck size={14} color="#000" />
            <span>Save Rank &amp; Purchases</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.4rem", fontWeight: "600" }}>
              Rank Override
            </label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            >
              {AVAILABLE_RANKS.map((r) => (
                <option key={r} value={r} style={{ background: "#0c0c14", color: "#FFF" }}>
                  {r === "Auto" ? "Auto (Calculated from Purchases)" : `${r} Rank`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.4rem", fontWeight: "600" }}>
              Bonus / Offset Purchases
            </label>
            <input
              type="number"
              min="0"
              value={bonusPurchasesInput}
              onChange={(e) => setBonusPurchasesInput(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* 3. DATA USAGE MANAGEMENT (CUSTOM TYPEABLE + PRESETS) */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SvgBarChart size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Data Usage Management</h3>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleRefreshSingleClient}
              disabled={isRefreshingLive}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#60a5fa", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "bold", cursor: isRefreshingLive ? "not-allowed" : "pointer" }}
            >
              <SvgRefresh size={14} color="#60a5fa" />
              <span>{isRefreshingLive ? "Syncing..." : "Refresh"}</span>
            </button>
            <button
              type="button"
              onClick={handleSnapshotPreviousData}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(234, 179, 8, 0.15)", border: "1px solid rgba(234, 179, 8, 0.3)", color: "#facc15", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "bold", cursor: "pointer" }}
            >
              <SvgLock size={14} color="#facc15" />
              <span>Lock as Previous Data</span>
            </button>
          </div>
        </div>

        {liveRefreshMsg && (
          <div style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#38bdf8", padding: "0.6rem 1rem", borderRadius: "8px", fontSize: "0.8rem" }}>
            {liveRefreshMsg}
          </div>
        )}

        {/* DATA INPUTS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1rem" }}>
          
          {/* Custom Typeable Package Total Data */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.4rem", fontWeight: "600" }}>
              Package Total Data (Type or Select)
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={customDataTotalInput}
                onChange={(e) => setCustomDataTotalInput(e.target.value)}
                placeholder="e.g. 25 GB"
                style={{ flex: 1, padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.88rem", outline: "none" }}
              />
              <select
                onChange={(e) => {
                  if (e.target.value) setCustomDataTotalInput(e.target.value);
                }}
                style={{ padding: "0.7rem 0.6rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#9ca3af", fontSize: "0.82rem", outline: "none", cursor: "pointer" }}
              >
                <option value="">Presets...</option>
                {DATA_PRESETS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Used Manual Input */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <label style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: "600" }}>Data Used (Current)</label>
              <button
                type="button"
                onClick={() => setDataUsedInput("0 GB")}
                style={{ background: "none", border: "none", color: "#38bdf8", fontSize: "0.72rem", cursor: "pointer", padding: 0 }}
              >
                Reset to 0 GB
              </button>
            </div>
            <input
              type="text"
              value={dataUsedInput}
              onChange={(e) => setDataUsedInput(e.target.value)}
              placeholder="0 GB"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.88rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Previous Usage Offset */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.4rem", fontWeight: "600" }}>
              Previous Usage Offset (GB)
            </label>
            <input
              type="number"
              step="0.01"
              value={previousUsageInput}
              onChange={(e) => setPreviousUsageInput(e.target.value)}
              placeholder="0"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.88rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

        </div>

        {/* 3x-ui Subscription Link */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.4rem", fontWeight: "600" }}>
            3x-ui Subscription Link (Auto-Sync)
          </label>
          <input
            type="text"
            value={subscriptionUrlInput}
            onChange={(e) => setSubscriptionUrlInput(e.target.value)}
            placeholder="https://103.179.44.75:2096/sub/..."
            style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
          />
        </div>

        {/* Custom VPN User ID (UUID) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <label style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: "600" }}>Custom VPN User ID (UUID)</label>
            <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>Auto-extracted from VLESS Key</span>
          </div>
          <input
            type="text"
            value={customVpnUserIdInput}
            onChange={(e) => setCustomVpnUserIdInput(e.target.value)}
            placeholder="e.g. 6ae95403-c451-41c5-aeee-08144e0387a5"
            style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#38bdf8", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
          />
        </div>

        {/* USA VPN Bonus Usage Card Toggle */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showUsaUsage ? "1rem" : 0 }}>
            <div>
              <h5 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "600" }}>USA VPN Usage Card (Bonus / Router Config)</h5>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#6b7280" }}>Displays second dedicated USA node card on client dashboard</p>
            </div>
            <button
              type="button"
              onClick={() => setShowUsaUsage(!showUsaUsage)}
              style={{
                background: showUsaUsage ? "linear-gradient(90deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.1)",
                color: "#FFF",
                border: "none",
                borderRadius: "20px",
                padding: "0.4rem 1rem",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              {showUsaUsage ? "USA Card: ON" : "USA Card: OFF"}
            </button>
          </div>

          {showUsaUsage && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.8rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>USA 3x-ui Subscription Link</label>
                <input
                  type="text"
                  value={usaSubscriptionUrlInput}
                  onChange={(e) => setUsaSubscriptionUrlInput(e.target.value)}
                  placeholder="https://usa-vps.site:2096/sub/..."
                  style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem" }}>USA Data Used</label>
                <input
                  type="text"
                  value={usaDataUsedInput}
                  onChange={(e) => setUsaDataUsedInput(e.target.value)}
                  placeholder="0 GB"
                  style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveDataUsage}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "linear-gradient(90deg, #2563eb, #3b82f6)",
            color: "#FFF",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.6rem",
            fontWeight: "bold",
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)"
          }}
        >
          <SvgCheck size={16} color="#FFF" />
          <span>Save Data Usage &amp; ID Settings</span>
        </button>

      </div>

      {/* 4. VPN RENEW CONTROLS & CUSTOM POPUP MESSAGE */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0 0 0.3rem 0", fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <SvgRefresh size={18} color="#818cf8" />
              <span>VPN Renew Controls &amp; Modal Message</span>
            </h3>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>
              Controls whether the Renew VPN button on the client dashboard opens the Store or shows a custom lock popup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRenewUnlocked(!isRenewUnlocked)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: isRenewUnlocked ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              border: `1px solid ${isRenewUnlocked ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)"}`,
              color: isRenewUnlocked ? "#4ade80" : "#f87171",
              borderRadius: "20px",
              padding: "0.45rem 1.2rem",
              fontSize: "0.8rem",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {isRenewUnlocked ? <SvgUnlock size={14} color="#4ade80" /> : <SvgLock size={14} color="#f87171" />}
            <span>{isRenewUnlocked ? "Renew UNLOCKED (Goes to Store)" : "Renew LOCKED (Shows Custom Message)"}</span>
          </button>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.4rem", fontWeight: "600" }}>
            Custom Renew Popup Message (Shown when locked)
          </label>
          <textarea
            rows={2}
            value={renewPopupMessageInput}
            onChange={(e) => setRenewPopupMessageInput(e.target.value)}
            placeholder="ඔබගේ පැකේජය අලුත් කිරීමට (Renew) දැනට අවසර ලබා දී නොමැත..."
            style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleSaveRenewSettings}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(90deg, #6366f1, #818cf8)", color: "#FFF", border: "none", borderRadius: "8px", padding: "0.65rem 1.4rem", fontWeight: "bold", fontSize: "0.82rem", cursor: "pointer" }}
          >
            <SvgCheck size={15} color="#FFF" />
            <span>Save Renew Settings</span>
          </button>
          {renewSaveMsg && <span style={{ fontSize: "0.78rem", color: "#4ade80" }}>{renewSaveMsg}</span>}
        </div>
      </div>

      {/* 5. MULTI-CONFIG MANAGEMENT */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SvgLayers size={20} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Client VLESS Configurations</h3>
          </div>
          <button
            type="button"
            onClick={handleAddNewConfigSection}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
          >
            <SvgPlus size={15} color="#818cf8" />
            <span>Add Config Slot</span>
          </button>
        </div>

        {configItems.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280", background: "rgba(255,255,255,0.01)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)" }}>
            No configurations assigned yet. Click &quot;Add Config Slot&quot; to assign a VLESS config.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {configItems.map((item, idx) => (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: "bold" }}>#{idx + 1}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleConfigChange(item.id, "name", e.target.value)}
                      placeholder="e.g. Dialog Zoom Unlimited"
                      style={{ flex: 1, padding: "0.55rem 0.8rem", borderRadius: "6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "0.85rem", outline: "none" }}
                    />
                    <select
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (!selectedVal) return;
                        const activeUuid = customVpnUserIdInput.trim() || extractedVpnUserId || "12345678-1234-1234-1234-1234567890ab";

                        // Match against PACKAGE_ISP_PRICES to get exact ISP, Price, and SNI
                        let matchedPkgKey = "";
                        const lowerVal = selectedVal.toLowerCase();
                        for (const [key, info] of Object.entries(PACKAGE_ISP_PRICES)) {
                          const shortLower = info.shortName.toLowerCase();
                          const slugClean = key.replace(/-/g, " ").toLowerCase();
                          if (lowerVal.includes(shortLower) || lowerVal.includes(slugClean) || (key === "slt-fiber-ent" && lowerVal.includes("entertainment"))) {
                            matchedPkgKey = key;
                            break;
                          }
                        }

                        let targetIsp = "Dialog";
                        let price = "724";
                        let targetSni = "aka.ms";

                        if (matchedPkgKey) {
                          const meta = PACKAGE_ISP_PRICES[matchedPkgKey];
                          targetIsp = meta.isp;
                          price = meta.priceDigits;
                          targetSni = DEFAULT_PACKAGE_SNIS[matchedPkgKey] || "zoom.us";
                        } else {
                          if (lowerVal.includes("airtel")) targetIsp = "Airtel";
                          else if (lowerVal.includes("slt")) targetIsp = "SLT";
                          else if (lowerVal.includes("hutch")) targetIsp = "Hutch";
                        }

                        const targetDomain = DEFAULT_ISP_DOMAINS[targetIsp] || DEFAULT_ISP_DOMAINS["Dialog"];

                        const generatedLink = buildVlessLink({
                          uuid: activeUuid,
                          ispDomain: targetDomain,
                          packageSni: targetSni,
                          ispName: targetIsp,
                          ispPrice: price,
                          clientEmail: user.email
                        });

                        handleConfigChange(item.id, "name", selectedVal);
                        handleConfigChange(item.id, "code", generatedLink);
                      }}
                      style={{ padding: "0.55rem 0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: "0.8rem", outline: "none", cursor: "pointer" }}
                    >
                      <option value="">Quick Templates...</option>
                      {PACKAGE_LIST.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveConfigSection(item.id)}
                    style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", padding: "0.45rem 0.8rem", borderRadius: "6px", cursor: "pointer" }}
                  >
                    <SvgTrash size={14} color="#f87171" />
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={item.code}
                  onChange={(e) => handleConfigChange(item.id, "code", e.target.value)}
                  placeholder="vless://..."
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#a7f3d0", fontSize: "0.8rem", fontFamily: "monospace", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleSaveConfigs}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "#FFF",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.6rem",
            fontWeight: "bold",
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
          }}
        >
          <SvgCheck size={16} color="#FFF" />
          <span>Save All Configurations</span>
        </button>
      </div>

      {/* 6. DAYS & VALIDITY ADJUSTMENT */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <SvgClock size={18} color="#818cf8" />
          <span>Days &amp; Validity Adjustment</span>
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.6rem 1.2rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Days Remaining: </span>
            <strong style={{ color: daysLeft > 5 ? "#4ade80" : daysLeft > 0 ? "#facc15" : "#f87171", fontSize: "1.1rem" }}>
              {daysLeft > 0 ? `${daysLeft} Days` : "Expired / Inactive"}
            </strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="number"
              value={daysAmount}
              onChange={(e) => setDaysAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 30"
              style={{ width: "90px", padding: "0.6rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none" }}
            />
            <button
              type="button"
              onClick={() => handleModifyDays(true)}
              style={{ background: "#22c55e", color: "#000", border: "none", borderRadius: "8px", padding: "0.6rem 1rem", fontWeight: "bold", fontSize: "0.82rem", cursor: "pointer" }}
            >
              + Add Days
            </button>
            <button
              type="button"
              onClick={() => handleModifyDays(false)}
              style={{ background: "#ef4444", color: "#FFF", border: "none", borderRadius: "8px", padding: "0.6rem 1rem", fontWeight: "bold", fontSize: "0.82rem", cursor: "pointer" }}
            >
              - Deduct Days
            </button>
          </div>
        </div>
      </div>

      {/* 7. LIVE ALERT MESSAGE (TEXT BADGES - ZERO EMOJIS) */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <SvgAlertTriangle size={18} color="#f59e0b" />
          <span>Send Live Pop-up Message to Client</span>
        </h3>

        {metaData.alert && (
          <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: "bold" }}>ACTIVE MESSAGE:</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#FFF" }}>{metaData.alert}</p>
            </div>
            <button
              type="button"
              onClick={handleClearMessage}
              style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }}
            >
              Clear Message
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Category Badge:</span>
          {["[WARNING]", "[DANGER]", "[SUCCESS]", "[GIFT]", "[INFO]"].map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setMsgBadge(b)}
              style={{
                background: msgBadge === b ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${msgBadge === b ? "#818cf8" : "rgba(255,255,255,0.1)"}`,
                color: msgBadge === b ? "#FFF" : "#9ca3af",
                padding: "0.35rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              {b}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Type notification message here..."
            style={{ flex: 1, padding: "0.7rem 0.9rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none" }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            style={{ background: "linear-gradient(90deg, #6366f1, #818cf8)", color: "#FFF", border: "none", borderRadius: "8px", padding: "0.7rem 1.4rem", fontWeight: "bold", fontSize: "0.82rem", cursor: "pointer" }}
          >
            Send Pop-up
          </button>
        </div>
      </div>

      {/* 8. SLIPS & PAYMENT RECORDS */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <SvgReceipt size={18} color="#a855f7" />
          <span>Payment Slips &amp; Orders History</span>
        </h3>

        {(!metaData.payments || metaData.payments.length === 0) ? (
          <div style={{ padding: "1.2rem", textAlign: "center", color: "#6b7280", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.08)" }}>
            No payment slips uploaded by this user yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {metaData.payments.map((p: any, pIdx: number) => (
              <div key={p.id || pIdx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "#FFF", fontSize: "0.9rem" }}>{p.package || p.packageName || "VPN Package"}</strong>
                    <span style={{ fontSize: "0.72rem", background: p.status === "Verified" ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)", color: p.status === "Verified" ? "#4ade80" : "#facc15", border: `1px solid ${p.status === "Verified" ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)"}`, padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                      {p.status || "Pending"}
                    </span>
                    {p.autoVerified && (
                      <span style={{ fontSize: "0.68rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "2px 6px", borderRadius: "8px" }}>OCR Auto-Verified</span>
                    )}
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                    Amount: Rs. {p.amount || "N/A"} · {p.date ? new Date(p.date).toLocaleString() : "Date N/A"} {p.refNumber ? `· Ref #${p.refNumber}` : ""}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {(p.receipt || p.receiptUrl) && (
                    <a href={p.receipt || p.receiptUrl} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.78rem", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", padding: "0.4rem 0.8rem", borderRadius: "6px" }}>
                      View Slip
                    </a>
                  )}
                  {p.status !== "Verified" && (
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(p.id || p.date)}
                      style={{ background: "#22c55e", color: "#000", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "bold", cursor: "pointer" }}
                    >
                      Verify
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePayment(p.id || p.date)}
                    style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" }}
                  >
                    <SvgTrash size={14} color="#f87171" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: TAB 2 - DNS & SNI ENGINE
// ============================================================================

function DnsSniEngineTab({ showToast }: { showToast: (msg: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [ispDomains, setIspDomains] = useState<Record<string, string>>({ ...DEFAULT_ISP_DOMAINS });
  const [packageSnis, setPackageSnis] = useState<Record<string, string>>({ ...DEFAULT_PACKAGE_SNIS });
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/system-config");
        const json = await res.json();
        if (json.success && json.config) {
          if (json.config.ispDomains) setIspDomains(json.config.ispDomains);
          if (json.config.packageSnis) setPackageSnis(json.config.packageSnis);
        }
      } catch (err) {
        console.error("Failed to load system config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveDnsSni = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            ispDomains,
            packageSnis
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("DNS Domains & SNI settings saved successfully!");
      } else {
        alert("Error saving: " + data.error);
      }
    } catch {
      alert("Network error saving DNS settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkUpdateConfigs = async () => {
    if (!confirm("Re-generate VLESS configs for all existing clients with the current DNS domains & SNIs?\n\nThis will keep client UUIDs identical but seamlessly update domains and SNI tags across the entire system.")) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-update-configs" })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Synchronized ${data.updatedCount} client configurations!`);
      } else {
        alert("Failed to synchronize: " + data.error);
      }
    } catch {
      alert("Network error executing bulk update");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#6366f1" }}>Loading DNS &amp; SNI Engine...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "1.5rem auto", padding: "0 2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* HEADER CARD */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.4rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              <SvgGlobe size={24} color="#818cf8" />
              <span>DNS &amp; SNI Mapping Engine</span>
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              Configure ISP dedicated subdomains and package SNI masks used by the strict VLESS generator.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleBulkUpdateConfigs}
              disabled={isBulkUpdating}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59, 130, 246, 0.4)", color: "#60a5fa", padding: "0.65rem 1.2rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "bold", cursor: isBulkUpdating ? "not-allowed" : "pointer" }}
            >
              <SvgRefresh size={15} color="#60a5fa" />
              <span>{isBulkUpdating ? "Synchronizing..." : "Bulk Sync All Client Configs"}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDnsSni}
              disabled={isSaving}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(90deg, #6366f1, #818cf8)", color: "#FFF", border: "none", padding: "0.65rem 1.4rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "bold", cursor: isSaving ? "not-allowed" : "pointer" }}
            >
              <SvgCheck size={16} color="#FFF" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ISP DOMAINS SECTION */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <h3 style={{ margin: "0 0 1.2rem 0", fontSize: "1.1rem", fontWeight: "700" }}>Official ISP Domain Endpoints</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem" }}>
          {Object.entries(ispDomains).map(([isp, domain]) => (
            <div key={isp} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#818cf8", fontWeight: "bold", marginBottom: "0.4rem" }}>
                {isp} Subdomain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setIspDomains(prev => ({ ...prev, [isp]: e.target.value.trim() }))}
                placeholder="e.g. airtel.legiongraphics.site"
                style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* PACKAGE SNI TABLE */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Package SNI Masks</h3>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Applied to strict TLS query `sni=&lt;mask&gt;`</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {Object.entries(packageSnis).map(([pkg, sni]) => (
            <div key={pkg} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "0.9rem" }}>
              <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", fontWeight: "600", marginBottom: "0.3rem" }}>{pkg}</span>
              <input
                type="text"
                value={sni}
                onChange={(e) => setPackageSnis(prev => ({ ...prev, [pkg]: e.target.value.trim() }))}
                placeholder="e.g. zoom.us"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "#38bdf8", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: TAB 3 - 3X-UI SERVER NODE
// ============================================================================

function ServerNodeTab({ showToast }: { showToast: (msg: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [primaryNode, setPrimaryNode] = useState({
    baseUrl: "https://103.179.44.75:2096",
    username: "",
    password: "",
    inboundId: 1,
    port: 443,
    subBaseUrl: "https://103.179.44.75:2096/sub/"
  });

  const [bonusUsaNode, setBonusUsaNode] = useState({
    enabled: false,
    baseUrl: "",
    username: "",
    password: "",
    inboundId: 1
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; message?: string; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/system-config");
        const json = await res.json();
        if (json.success && json.config) {
          if (json.config.primary3xui) setPrimaryNode(json.config.primary3xui);
          if (json.config.bonusUsa3xui) setBonusUsaNode(json.config.bonusUsa3xui);
        }
      } catch (err) {
        console.error("Failed to load server node config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleTestConnection = async (nodeToTest?: any) => {
    setIsTesting(true);
    setTestResult(null);
    const target = nodeToTest && nodeToTest.baseUrl ? nodeToTest : primaryNode;
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-3xui",
          node: target
        })
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success && data.effectiveBaseUrl) {
        if (!nodeToTest || !nodeToTest.baseUrl) {
          setPrimaryNode(prev => ({ ...prev, baseUrl: data.effectiveBaseUrl }));
        }
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || "Connection failed" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveNode = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            primary3xui: primaryNode,
            bonusUsa3xui: bonusUsaNode
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Server Node credentials saved successfully!");
      } else {
        alert("Error saving: " + data.error);
      }
    } catch {
      alert("Network error saving node credentials");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#6366f1" }}>Loading Server Node Manager...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "1.5rem auto", padding: "0 2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* HEADER CARD */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.4rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              <SvgServer size={24} color="#818cf8" />
              <span>3x-ui Server Node Manager</span>
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              Connect your 3x-ui VPS API for automated client creation and realtime traffic sync.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid rgba(34, 197, 94, 0.4)", color: "#4ade80", padding: "0.65rem 1.2rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "bold", cursor: isTesting ? "not-allowed" : "pointer" }}
            >
              <SvgZap size={15} color="#4ade80" />
              <span>{isTesting ? "Testing Ping..." : "Test Connection & Ping"}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveNode}
              disabled={isSaving}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(90deg, #6366f1, #818cf8)", color: "#FFF", border: "none", padding: "0.65rem 1.4rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "bold", cursor: isSaving ? "not-allowed" : "pointer" }}
            >
              <SvgCheck size={16} color="#FFF" />
              <span>{isSaving ? "Saving..." : "Save Node Settings"}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div style={{ marginTop: "1.2rem", padding: "1rem 1.2rem", borderRadius: "10px", background: testResult.success ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${testResult.success ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {testResult.success ? <SvgCheck size={18} color="#4ade80" /> : <SvgAlertTriangle size={18} color="#f87171" />}
              <strong style={{ color: testResult.success ? "#4ade80" : "#f87171", fontSize: "0.9rem" }}>
                {testResult.success ? "3x-ui Connection Successful!" : "Connection Failed"}
              </strong>
              {testResult.latencyMs !== undefined && (
                <span style={{ fontSize: "0.78rem", color: "#38bdf8", marginLeft: "auto" }}>Latency: {testResult.latencyMs}ms</span>
              )}
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: testResult.success ? "#a7f3d0" : "#fca5a5" }}>
              {testResult.message || testResult.error}
            </p>
          </div>
        )}
      </div>

      {/* PRIMARY NODE SETTINGS */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <h3 style={{ margin: "0 0 1.2rem 0", fontSize: "1.1rem", fontWeight: "700" }}>Primary Singapore Node (Main 10Gbps Core)</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>3x-ui Base URL</label>
            <input
              type="text"
              value={primaryNode.baseUrl}
              onChange={(e) => setPrimaryNode(prev => ({ ...prev, baseUrl: e.target.value.trim() }))}
              placeholder="https://103.179.44.75:2096"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "3px", display: "block" }}>Tip: If SSL is enabled on your panel, use https:// (e.g. https://143.42.79.58:38887/tuycp9km2369ii/)</span>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Inbound ID</label>
            <input
              type="number"
              value={primaryNode.inboundId}
              onChange={(e) => setPrimaryNode(prev => ({ ...prev, inboundId: Number(e.target.value) || 1 }))}
              placeholder="1"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Port</label>
            <input
              type="number"
              value={primaryNode.port}
              onChange={(e) => setPrimaryNode(prev => ({ ...prev, port: Number(e.target.value) || 443 }))}
              placeholder="443"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Admin Username</label>
            <input
              type="text"
              value={primaryNode.username}
              onChange={(e) => setPrimaryNode(prev => ({ ...prev, username: e.target.value }))}
              placeholder="admin"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Admin Password</label>
            <input
              type="password"
              value={primaryNode.password}
              onChange={(e) => setPrimaryNode(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Subscription Base URL Prefix</label>
          <input
            type="text"
            value={primaryNode.subBaseUrl}
            onChange={(e) => setPrimaryNode(prev => ({ ...prev, subBaseUrl: e.target.value.trim() }))}
            placeholder="https://103.179.44.75:2096/sub/"
            style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
          />
        </div>
      </div>

      {/* BONUS USA NODE SETTINGS */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem", fontWeight: "700" }}>Bonus USA 3x-ui Server Node (Router / Bonus Configs)</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>Secondary VPS node used to automatically provision bonus USA configurations.</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleTestConnection(bonusUsaNode)}
              disabled={isTesting || !bonusUsaNode.baseUrl}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "0.45rem 1rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "bold", cursor: (isTesting || !bonusUsaNode.baseUrl) ? "not-allowed" : "pointer" }}
            >
              <SvgZap size={14} color="#38bdf8" />
              <span>Test USA Node</span>
            </button>
            <button
              type="button"
              onClick={() => setBonusUsaNode(prev => ({ ...prev, enabled: !prev.enabled }))}
              style={{
                background: bonusUsaNode.enabled ? "linear-gradient(90deg, #10b981, #059669)" : "rgba(255,255,255,0.1)",
                color: "#FFF",
                border: "none",
                borderRadius: "20px",
                padding: "0.45rem 1.2rem",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              {bonusUsaNode.enabled ? "BONUS NODE: ON" : "BONUS NODE: OFF"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>USA 3x-ui Base URL</label>
            <input
              type="text"
              value={bonusUsaNode.baseUrl}
              onChange={(e) => setBonusUsaNode(prev => ({ ...prev, baseUrl: e.target.value.trim() }))}
              placeholder="https://usa.legiongraphics.site:2096"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Inbound ID</label>
            <input
              type="number"
              value={bonusUsaNode.inboundId}
              onChange={(e) => setBonusUsaNode(prev => ({ ...prev, inboundId: Number(e.target.value) || 1 }))}
              placeholder="1"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Admin Username</label>
            <input
              type="text"
              value={bonusUsaNode.username}
              onChange={(e) => setBonusUsaNode(prev => ({ ...prev, username: e.target.value }))}
              placeholder="admin"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Admin Password</label>
            <input
              type="password"
              value={bonusUsaNode.password}
              onChange={(e) => setBonusUsaNode(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: TAB 4 - AUTOMATION & SECURITY CONTROL
// ============================================================================

function AutomationSecurityTab({ showToast }: { showToast: (msg: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [autoApproval, setAutoApproval] = useState(true);
  const [expectedAccount, setExpectedAccount] = useState("8029138148");
  const [timeWindowMins, setTimeWindowMins] = useState(120);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [ledger, setLedger] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Manual Ref Ledger Management (FIX 7)
  const [newRefNum, setNewRefNum] = useState("");
  const [newRefEmail, setNewRefEmail] = useState("");
  const [newRefPackage, setNewRefPackage] = useState("");
  const [newRefAmount, setNewRefAmount] = useState<number | "">("");
  const [isUpdatingLedger, setIsUpdatingLedger] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/system-config");
        const json = await res.json();
        if (json.success && json.config) {
          setAutoApproval(Boolean(json.config.autoApprovalEnabled));
          if (json.config.expectedBankAccount) setExpectedAccount(json.config.expectedBankAccount);
          if (json.config.allowedTimeWindowMinutes) setTimeWindowMins(Number(json.config.allowedTimeWindowMinutes));
          if (json.config.geminiApiKey) setGeminiKeyInput(json.config.geminiApiKey);
          if (json.config.groqApiKey) setGroqKeyInput(json.config.groqApiKey);
          if (Array.isArray(json.config.verifiedRefLedger)) setLedger(json.config.verifiedRefLedger);
        }
      } catch (err) {
        console.error("Failed to load automation config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-ai" })
      });
      const data = await res.json();
      setAiTestResult(data);
      if (data.success) {
        showToast(data.message || "Groq Qwen 3.8 Vision LPU Operational");
      }
    } catch (err: any) {
      setAiTestResult({
        success: false,
        error: err?.message || "Failed to contact AI testing endpoint"
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSaveAutomation = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            autoApprovalEnabled: autoApproval,
            expectedBankAccount: expectedAccount.trim(),
            allowedTimeWindowMinutes: Number(timeWindowMins) || 120,
            geminiApiKey: geminiKeyInput.trim(),
            groqApiKey: groqKeyInput.trim()
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Automation & Security settings saved!");
      } else {
        alert("Error saving: " + data.error);
      }
    } catch {
      alert("Network error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRef = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = newRefNum.trim();
    if (!cleanRef) {
      alert("Please enter a valid reference number");
      return;
    }
    if (ledger.some(entry => String(entry.refNumber).toLowerCase() === cleanRef.toLowerCase())) {
      alert("This reference number is already recorded in the ledger!");
      return;
    }

    const newEntry = {
      refNumber: cleanRef,
      email: newRefEmail.trim() || "manual-entry@legion.internal",
      packageName: newRefPackage.trim() || "Manual Ref Entry",
      amount: Number(newRefAmount) || 0,
      date: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };

    const updated = [newEntry, ...ledger];
    setLedger(updated);
    setNewRefNum("");
    setNewRefEmail("");
    setNewRefPackage("");
    setNewRefAmount("");

    try {
      setIsUpdatingLedger(true);
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { verifiedRefLedger: updated } })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Reference #${cleanRef} recorded into ledger!`);
      } else {
        alert("Failed to save ledger: " + data.error);
      }
    } catch {
      alert("Network error updating ledger");
    } finally {
      setIsUpdatingLedger(false);
    }
  };

  const handleRevokeRef = async (refNum: string) => {
    if (!confirm(`Are you sure you want to revoke/remove reference #${refNum} from the ledger?`)) return;
    const updated = ledger.filter(entry => String(entry.refNumber) !== String(refNum));
    setLedger(updated);

    try {
      setIsUpdatingLedger(true);
      const res = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { verifiedRefLedger: updated } })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Reference #${refNum} revoked from ledger!`);
      } else {
        alert("Failed to update ledger: " + data.error);
      }
    } catch {
      alert("Network error revoking reference");
    } finally {
      setIsUpdatingLedger(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#6366f1" }}>Loading Automation &amp; Security...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "1.5rem auto", padding: "0 2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* HEADER CARD */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.4rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              <SvgSliders size={24} color="#818cf8" />
              <span>Automation &amp; Security Control</span>
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              Configure Groq Qwen 3.8 Vision LPU auto-verification, duplicate slip protection, and bank settlement rules.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleTestAi}
              disabled={isTestingAi}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#f3f4f6",
                padding: "0.65rem 1.2rem",
                borderRadius: "8px",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: isTestingAi ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <SvgZap size={15} color="#eab308" />
              <span>{isTestingAi ? "Testing Model..." : "Test AI Vision Model"}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAutomation}
              disabled={isSaving}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(90deg, #6366f1, #818cf8)", color: "#FFF", border: "none", padding: "0.65rem 1.4rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "bold", cursor: isSaving ? "not-allowed" : "pointer" }}
            >
              <SvgCheck size={16} color="#FFF" />
              <span>{isSaving ? "Saving..." : "Save Automation Settings"}</span>
            </button>
          </div>
        </div>

        {/* AI TEST STATUS BADGE */}
        {aiTestResult && (
          <div style={{
            marginTop: "1.2rem",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: aiTestResult.success ? "rgba(34, 197, 94, 0.08)" : "rgba(245, 158, 11, 0.1)",
            border: `1px solid ${aiTestResult.success ? "rgba(34, 197, 94, 0.35)" : "rgba(245, 158, 11, 0.4)"}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem"
          }}>
            {aiTestResult.success ? (
              <SvgCheck size={18} color="#22c55e" />
            ) : (
              <SvgAlertTriangle size={18} color="#f59e0b" />
            )}
            <span style={{ color: aiTestResult.success ? "#86efac" : "#fcd34d", fontWeight: "600" }}>
              {aiTestResult.success
                ? (aiTestResult.message || `Groq Qwen 3.8 Vision LPU Operational (${aiTestResult.latencyMs}ms)`)
                : `AI Model Test Failed: ${aiTestResult.error || "Could not reach Groq API"}`}
            </span>
          </div>
        )}
      </div>

      {/* MASTER TOGGLE & RULES */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
        
        {/* MASTER SWITCH CARD */}
        <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Master Auto-Approval Switch</h3>
              <button
                type="button"
                onClick={() => setAutoApproval(!autoApproval)}
                style={{
                  background: autoApproval ? "linear-gradient(90deg, #10b981, #059669)" : "rgba(255,255,255,0.1)",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "20px",
                  padding: "0.5rem 1.4rem",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: autoApproval ? "0 4px 14px rgba(16,185,129,0.4)" : "none"
                }}
              >
                {autoApproval ? "AUTO-APPROVAL: ON" : "AUTO-APPROVAL: OFF"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.6 }}>
              When <strong>ON</strong>, payment slips submitted by clients are scanned via Gemini 1.5 Flash Vision. Valid transfers directly activate the VPN and provision configs instantly.
              <br /><br />
              When <strong>OFF</strong>, all orders are placed into manual admin review queue.
            </p>
          </div>

          <div style={{ marginTop: "1.5rem", padding: "0.9rem", borderRadius: "10px", background: autoApproval ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)", border: `1px solid ${autoApproval ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`, fontSize: "0.8rem", color: autoApproval ? "#86efac" : "#fca5a5" }}>
            Current State: <strong>{autoApproval ? "Instant Automated Provisioning Active" : "100% Manual Admin Review Fallback Mode"}</strong>
          </div>
        </div>

        {/* SECURITY PARAMETERS */}
        <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>Validation Guardrails</h3>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>
              Expected Beneficiary Bank Account No
            </label>
            <input
              type="text"
              value={expectedAccount}
              onChange={(e) => setExpectedAccount(e.target.value.trim())}
              placeholder="8029138148"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
            />
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "3px", display: "block" }}>Receipts to other accounts will fail OCR check</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>
              Slip Validity Time Window (Minutes)
            </label>
            <input
              type="number"
              value={timeWindowMins}
              onChange={(e) => setTimeWindowMins(Number(e.target.value) || 120)}
              placeholder="120"
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
            />
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "3px", display: "block" }}>Disallows receipts older than specified window</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>
              Groq API Key (qwen/qwen3.8-27b Vision LPU)
            </label>
            <input
              type="password"
              value={groqKeyInput}
              onChange={(e) => setGroqKeyInput(e.target.value.trim())}
              placeholder="gsk_..."
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#38bdf8", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
            />
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "3px", display: "block" }}>Powers instant Vision OCR via Groq. Or specify GROQ_API_KEY in .env / Vercel.</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.4rem" }}>
              Gemini Vision API Key (Secondary Fallback)
            </label>
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value.trim())}
              placeholder="AIzaSy..."
              style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#a78bfa", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
            />
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "3px", display: "block" }}>Saved securely in admin settings without requiring redeploy</span>
          </div>
        </div>

      </div>

      {/* VERIFIED REFERENCE LEDGER (DOUBLE-SPEND PREVENTION) */}
      <div style={{ background: "rgba(12, 12, 20, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem", fontWeight: "700" }}>Verified Reference Ledger (Anti-Replay)</h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af" }}>
              Stored transaction sequence numbers. Repeated submission of any recorded reference number is blocked.
            </p>
          </div>
          <span style={{ fontSize: "0.8rem", color: "#818cf8", fontWeight: "bold" }}>{ledger.length} Verified Transactions</span>
        </div>

        {/* MANUAL ADD TO LEDGER FORM */}
        <form onSubmit={handleAddRef} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.2fr 1fr auto", gap: "0.8rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem", fontWeight: "600" }}>Reference Number *</label>
            <input
              type="text"
              required
              value={newRefNum}
              onChange={(e) => setNewRefNum(e.target.value)}
              placeholder="e.g. 26030953"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem", fontWeight: "600" }}>Client Email</label>
            <input
              type="email"
              value={newRefEmail}
              onChange={(e) => setNewRefEmail(e.target.value)}
              placeholder="client@gmail.com"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem", fontWeight: "600" }}>Package Name</label>
            <input
              type="text"
              value={newRefPackage}
              onChange={(e) => setNewRefPackage(e.target.value)}
              placeholder="Dialog Zoom (200GB)"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.3rem", fontWeight: "600" }}>Amount (Rs.)</label>
            <input
              type="number"
              min="0"
              value={newRefAmount}
              onChange={(e) => setNewRefAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="400"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isUpdatingLedger || !newRefNum.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(90deg, #6366f1, #818cf8)",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1.1rem",
                fontWeight: "bold",
                fontSize: "0.82rem",
                cursor: isUpdatingLedger || !newRefNum.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <SvgPlus size={14} color="#FFF" />
              <span>{isUpdatingLedger ? "Adding..." : "+ Add to Ledger"}</span>
            </button>
          </div>
        </form>

        {ledger.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280", background: "rgba(255,255,255,0.01)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.08)" }}>
            No transaction reference records yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", textAlign: "left" }}>
                  <th style={{ padding: "0.7rem" }}>Ref Number</th>
                  <th style={{ padding: "0.7rem" }}>Client Email</th>
                  <th style={{ padding: "0.7rem" }}>Package</th>
                  <th style={{ padding: "0.7rem" }}>Amount</th>
                  <th style={{ padding: "0.7rem" }}>Verified At</th>
                  <th style={{ padding: "0.7rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice().reverse().map((entry, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.7rem", fontFamily: "monospace", color: "#38bdf8", fontWeight: "bold" }}>#{entry.refNumber}</td>
                    <td style={{ padding: "0.7rem", color: "#FFF" }}>{entry.email}</td>
                    <td style={{ padding: "0.7rem", color: "#d1d5db" }}>{entry.packageName}</td>
                    <td style={{ padding: "0.7rem", color: "#4ade80", fontWeight: "bold" }}>Rs. {entry.amount}</td>
                    <td style={{ padding: "0.7rem", color: "#6b7280" }}>{entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleString() : "N/A"}</td>
                    <td style={{ padding: "0.7rem", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleRevokeRef(entry.refNumber)}
                        disabled={isUpdatingLedger}
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171",
                          padding: "0.35rem 0.7rem",
                          borderRadius: "6px",
                          cursor: isUpdatingLedger ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "600"
                        }}
                        title="Revoke / Remove Reference"
                      >
                        <SvgTrash size={13} color="#f87171" />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
