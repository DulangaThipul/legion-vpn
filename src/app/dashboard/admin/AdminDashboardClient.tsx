"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { updateAdvancedUserAdmin } from "@/lib/authActions"; // මේක අපි ඊළඟට හදනවා

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Search Filter
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header Area */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "600", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
          🛡️ Advanced Command Center
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold" }}>← Back to Dashboard</Link>
      </header>

      {/* Search Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <input 
          type="text" 
          placeholder="Search users by name or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "1rem 1.5rem", borderRadius: "12px", background: "rgba(15,15,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "1rem" }}
        />
      </div>

      {/* Users List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredUsers.map(user => (
          <UserAdvancedCard key={user.id} user={user} />
        ))}
      </div>

    </main>
  );
}

// 🚀 Individual User Card Component
function UserAdvancedCard({ user }: { user: any }) {
  const [expanded, setExpanded] = useState(false);
  const [alertMsg, setAlertMsg] = useState(user.alertMessage || "");
  const [hiddenPkgs, setHiddenPkgs] = useState<string>(user.hiddenPackages?.join(", ") || "");

  // Online Status Logic (Last 5 mins = Online)
  const isOnline = new Date().getTime() - new Date(user.lastSeen || 0).getTime() < 5 * 60 * 1000;

  const handleSave = async () => {
    alert("Sending data to DB... (We will connect server action next!)");
    // await updateAdvancedUserAdmin(user.id, { alertMessage: alertMsg, hiddenPackages: hiddenPkgs.split(",") });
  };

  return (
    <div style={{ 
      background: "rgba(15,15,20,0.8)", 
      border: `1px solid ${expanded ? "#6366f1" : "rgba(255,255,255,0.05)"}`, 
      borderRadius: "16px", 
      overflow: "hidden",
      transition: "all 0.3s ease"
    }}>
      
      {/* 🟢 CARD HEADER (Click to Expand) */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "rgba(99,102,241,0.05)" : "transparent" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Avatar & Online Dot */}
          <div style={{ position: "relative" }}>
            <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderRadius: "50%", background: isOnline ? "#22c55e" : "#ef4444", border: "2px solid #1a1a2e" }} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem", color: "#FFF" }}>{user.name}</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>{user.email}</p>
          </div>
        </div>
        
        {/* Badges (Mobile Friendly) */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {user.alertMessage && <span style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold" }}>Has Alert</span>}
          <div style={{ color: "var(--muted-text)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}>▼</div>
        </div>
      </div>

      {/* 🟡 EXPANDED CONTENT AREA */}
      {expanded && (
        <div style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          
          {/* SECTION 1: Warning & Alerts */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>⚠️ Custom Alert / Warning</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--muted-text)", marginBottom: "1rem" }}>Show a red warning message on Kusal's dashboard (e.g. "Payment Due!").</p>
            <textarea 
              value={alertMsg}
              onChange={(e) => setAlertMsg(e.target.value)}
              placeholder="Type warning message here..."
              style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", minHeight: "80px", marginBottom: "1rem" }}
            />
          </div>

          {/* SECTION 2: Package Restrictions */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#FFF" }}>🚫 Hide Packages</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--muted-text)", marginBottom: "1rem" }}>Enter package names separated by commas to hide them from this user.</p>
            <input 
              type="text" 
              value={hiddenPkgs}
              onChange={(e) => setHiddenPkgs(e.target.value)}
              placeholder="e.g. Dialog Router, SLT Fiber"
              style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }}
            />
          </div>

          {/* SECTION 3: Multiple VPN Configs (Preview) */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.2)", gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, color: "#818cf8" }}>🔗 User's VPN Configs</h4>
              <button style={{ background: "#6366f1", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>+ Add New Config</button>
            </div>
            
            {/* Mock Display of Multiple Configs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: "bold" }}>ROUTER VPN</span>
                <p style={{ margin: "5px 0", fontFamily: "monospace", color: "#FFF" }}>vless://6a71ee8a...</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a855f7", fontWeight: "bold" }}>MOBILE VPN</span>
                <p style={{ margin: "5px 0", fontFamily: "monospace", color: "#FFF" }}>vless://mobile-code...</p>
              </div>
            </div>
          </div>

          {/* Save Button for this User */}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button 
              onClick={handleSave}
              style={{ background: "#FFF", color: "#000", padding: "1rem 3rem", borderRadius: "30px", fontWeight: "bold", fontSize: "1.1rem", border: "none", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Save Changes for {user.name.split(" ")[0]}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
