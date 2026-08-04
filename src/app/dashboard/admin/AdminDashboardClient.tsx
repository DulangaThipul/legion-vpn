"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header Area */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "600", color: "#FFF", display: "flex", alignItems: "center", gap: "10px" }}>
          🛡️ Admin Command Center
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

function UserAdvancedCard({ user }: { user: any }) {
  const [expanded, setExpanded] = useState(false);
  const [alertMsg, setAlertMsg] = useState(user.alertMessage || "");
  const [hiddenPkgs, setHiddenPkgs] = useState<string>(user.hiddenPackages?.join(", ") || "");

  const isOnline = new Date().getTime() - new Date(user.lastSeen || 0).getTime() < 5 * 60 * 1000;

  const handleSave = async () => {
    alert(`Saving changes for ${user.name}...`);
  };

  return (
    <div style={{ 
      background: "rgba(15,15,20,0.8)", 
      border: `1px solid ${expanded ? "#6366f1" : "rgba(255,255,255,0.05)"}`, 
      borderRadius: "16px", 
      overflow: "hidden",
      transition: "all 0.3s ease"
    }}>
      
      {/* Header (Accordion Toggle) */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "rgba(99,102,241,0.05)" : "transparent" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderRadius: "50%", background: isOnline ? "#22c55e" : "#ef4444", border: "2px solid #1a1a2e" }} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem", color: "#FFF" }}>{user.name}</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>{user.email}</p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {user.alertMessage && <span style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold" }}>Has Alert</span>}
          <div style={{ color: "var(--muted-text)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}>▼</div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#ef4444" }}>⚠️ Custom Alert / Warning</h4>
            <textarea 
              value={alertMsg}
              onChange={(e) => setAlertMsg(e.target.value)}
              placeholder="Type warning message here..."
              style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", minHeight: "80px" }}
            />
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#FFF" }}>🚫 Hide Packages</h4>
            <input 
              type="text" 
              value={hiddenPkgs}
              onChange={(e) => setHiddenPkgs(e.target.value)}
              placeholder="e.g. Dialog Router, SLT Fiber"
              style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button 
              onClick={handleSave}
              style={{ background: "#FFF", color: "#000", padding: "1rem 3rem", borderRadius: "30px", fontWeight: "bold", fontSize: "1.1rem", border: "none", cursor: "pointer" }}
            >
              Save Changes for {user.name.split(" ")[0]}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
