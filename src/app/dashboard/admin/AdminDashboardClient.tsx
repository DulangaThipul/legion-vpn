"use client";

import { useState } from "react";
import Link from "next/link";
import { updateUserAdmin } from "@/app/actions/admin";

export default function AdminDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = async (userId: string, newConfig: string, newLink: string) => {
    try {
      const response = await updateUserAdmin(userId, newConfig, newLink);
      if (response.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, vpnConfigKey: newConfig, subscriptionLink: newLink } : u));
        setToast("Changes saved to Database!");
      }
    } catch (error) {
      alert("Failed to save changes: " + (error as Error).message);
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <main style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", flexWrap: "wrap", gap: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "300", display: "flex", alignItems: "center", gap: "1rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Admin Command Center
        </h1>
        <Link href="/dashboard" style={{
          color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.3s ease"
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.textShadow = "0 0 10px rgba(255,255,255,0.5)"; }}
        onMouseOut={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.textShadow = "none"; }}
        >
          ← Back to Dashboard
        </Link>
      </header>

      {toast && (
        <div style={{
          position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "#FFFFFF", color: "#000000", padding: "1rem 2rem", borderRadius: "30px",
          fontWeight: "bold", boxShadow: "0 0 20px rgba(255,255,255,0.5)", zIndex: 1000,
          animation: "fadeInDown 0.3s ease"
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {users.map(user => (
          <UserAdminCard key={user.id} user={user} onSave={handleSave} />
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

function UserAdminCard({ user, onSave }: { user: any, onSave: (id: string, config: string, link: string) => void }) {
  const [config, setConfig] = useState(user.vpnConfigKey);
  const [link, setLink] = useState(user.subscriptionLink);

  return (
    <div className="glass-panel animate-fade-in" style={{ 
      padding: "2rem", borderLeft: "4px solid #FFFFFF", display: "flex", gap: "3rem", flexWrap: "wrap",
      background: "rgba(5,5,5,0.8)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)"
    }}>
      <div style={{ flex: "1 1 250px", minWidth: "250px", borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: "2rem" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>{user.name}</h3>
        <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "1rem" }}>{user.email}</p>
        <span style={{ 
          display: "inline-block", marginTop: "1.5rem", padding: "0.4rem 1rem", 
          background: "rgba(255,255,255,0.1)", borderRadius: "30px", fontSize: "0.8rem", 
          border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", fontFamily: "'Courier New', Courier, monospace"
        }}>
          {user.id}
        </span>
      </div>

      <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.8rem", color: "var(--muted-text)", fontSize: "0.95rem" }}>VLESS Configuration Key</label>
          <textarea 
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            style={{ 
              width: "100%", padding: "1rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#FFFFFF", borderRadius: "8px", fontSize: "0.95rem", minHeight: "100px",
              fontFamily: "'Courier New', Courier, monospace", resize: "vertical",
              transition: "border 0.3s ease"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#FFFFFF"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
            placeholder="Paste VLESS Key here..."
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "0.8rem", color: "var(--muted-text)", fontSize: "0.95rem" }}>Subscription / Usage Link</label>
          <input 
            type="text" 
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={{ 
              width: "100%", padding: "1rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#FFFFFF", borderRadius: "8px", fontSize: "1rem",
              transition: "border 0.3s ease"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#FFFFFF"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
            placeholder="https://legionvpn.com/my-usage/..."
          />
        </div>
        
        <button 
          onClick={() => onSave(user.id, config, link)}
          style={{ 
            alignSelf: "flex-end", padding: "0.8rem 2.5rem", background: "#FFFFFF", color: "#000000",
            fontWeight: "bold", fontSize: "1.1rem", border: "none", borderRadius: "30px", cursor: "pointer",
            transition: "all 0.3s ease", boxShadow: "0 0 15px rgba(255,255,255,0.2)", marginTop: "0.5rem"
          }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 0 25px rgba(255,255,255,0.6)"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
