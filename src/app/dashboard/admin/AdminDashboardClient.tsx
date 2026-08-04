"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAdmin } from "@/lib/authActions";

// 🚀 ඔයාගේ සයිට් එකේ තියෙන Packages ලිස්ට් එක මෙතන තියෙනවා
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

  const handleSave = async (userId: string, newConfig: string, newLink: string) => {
    try {
      const response = await updateUserAdmin(userId, {
        vpnConfigKey: newConfig,
        subscriptionLink: newLink
      });

      if (response.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, vpnConfigKey: newConfig, subscriptionLink: newLink } : u));
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
          🛡️ Advanced Command Center
        </h1>
        <Link href="/dashboard" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold" }}>← Back to Dashboard</Link>
      </header>

      {toast && (
        <div style={{ position: "fixed", top: "2rem", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "1rem 2rem", borderRadius: "30px", fontWeight: "bold", zIndex: 1000, boxShadow: "0 10px 20px rgba(34,197,94,0.3)", animation: "fadeInDown 0.3s ease" }}>
          {toast}
        </div>
      )}

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

function UserAdvancedCard({ user, onSave }: { user: any, onSave: (id: string, config: string, link: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  
  // ඩේටාබේස් එකේ තියෙන දැනට තියෙන Config එක
  const [configText, setConfigText] = useState(user.vpnConfigKey || "");
  const [subLink, setSubLink] = useState(user.subscriptionLink || "");

  // අලුතින් Config එකක් හදන්න ගන්න Variables
  const [selectedPkg, setSelectedPkg] = useState(PACKAGE_LIST[0]);
  const [tempVless, setTempVless] = useState("");

  const handleAddConfig = () => {
    if (!tempVless) {
      alert("Please paste a VLESS key first!");
      return;
    }
    // 🚀 පට්ට ලස්සනට Config එක Format කරන තැන
    const newBlock = `📦 [ ${selectedPkg} ]\n${tempVless}\n\n`;
    setConfigText(prev => prev ? prev + newBlock : newBlock);
    setTempVless(""); // Input එක clear කරනවා
  };

  return (
    <div style={{ background: "rgba(15,15,20,0.8)", border: `1px solid ${expanded ? "#6366f1" : "rgba(255,255,255,0.05)"}`, borderRadius: "16px", overflow: "hidden", transition: "all 0.3s ease" }}>
      
      {/* CARD HEADER (Click to Expand) */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "rgba(99,102,241,0.05)" : "transparent" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem", color: "#FFF" }}>{user.name}</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-text)" }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {configText.includes("vless://") && <span style={{ background: "rgba(34, 197, 94, 0.2)", color: "#22c55e", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold" }}>Has Configs</span>}
          <div style={{ color: "var(--muted-text)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}>▼</div>
        </div>
      </div>

      {/* EXPANDED AREA */}
      {expanded && (
        <div style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          
          {/* LEFT SIDE: Config Generator */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.2)" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#818cf8", display: "flex", alignItems: "center", gap: "8px" }}>➕ Assign Ordered VPN Config</h4>
            
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>1. Select Ordered Package (from WhatsApp)</label>
            <select 
              value={selectedPkg} 
              onChange={(e) => setSelectedPkg(e.target.value)}
              style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", marginBottom: "1rem", outline: "none" }}
            >
              {PACKAGE_LIST.map(pkg => <option key={pkg} value={pkg} style={{ background: "#0a0a0f" }}>{pkg}</option>)}
            </select>

            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>2. Paste VLESS Key</label>
            <textarea 
              value={tempVless}
              onChange={(e) => setTempVless(e.target.value)}
              placeholder="vless://..."
              style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", minHeight: "80px", marginBottom: "1rem" }}
            />
            
            <button 
              onClick={handleAddConfig} 
              style={{ width: "100%", padding: "0.8rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }} 
              onMouseOver={e=>e.currentTarget.style.background="rgba(99,102,241,0.3)"} 
              onMouseOut={e=>e.currentTarget.style.background="rgba(99,102,241,0.2)"}
            >
              ↓ Format & Add to User's List ↓
            </button>
          </div>

          {/* RIGHT SIDE: Final Dashboard View & Save */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", flex: 1 }}>
              <h4 style={{ margin: "0 0 1rem 0", color: "#FFF" }}>👁️ User's Dashboard View</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--muted-text)", marginBottom: "0.8rem" }}>What the client will see. You can manually edit this text.</p>
              <textarea 
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                placeholder="No configs assigned yet..."
                style={{ width: "100%", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#22c55e", minHeight: "150px", fontFamily: "monospace", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}
              />
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
               <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--muted-text)" }}>📊 Subscription / Usage Link</label>
               <input 
                  type="text" 
                  value={subLink}
                  onChange={(e) => setSubLink(e.target.value)}
                  placeholder="https://legionvpn.com/my-usage/..."
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }}
                />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button 
              onClick={() => onSave(user.id, configText, subLink)}
              style={{ background: "#FFF", color: "#000", padding: "1rem 3rem", borderRadius: "30px", fontWeight: "bold", fontSize: "1.1rem", border: "none", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 5px 15px rgba(255,255,255,0.2)" }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
              💾 Save All Changes for {user.name.split(" ")[0]}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
