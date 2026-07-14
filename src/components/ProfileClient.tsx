"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserAvatar } from "@/lib/authActions";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

export default function ProfileClient({ user }: { user: any }) {
  const router = useRouter();
  
  const [avatar, setAvatar] = useState(user?.image || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");

  const handleAvatarSelect = async (gifPath: string) => {
    if (isUpdating) return;
    
    setAvatar(gifPath);
    setIsUpdating(true);
    
    const res = await updateUserAvatar(gifPath);
    if (res.success) {
      router.refresh(); 
    } else {
      alert("Failed to update avatar in database.");
    }
    
    setIsUpdating(false);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Profile info saved!");
  };

  return (
    <div className="glass-panel hover:scale-[1.01] transition-transform duration-300" style={{ padding: "3rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "2rem", textAlign: "center", color: "#FFFFFF" }}>Edit Profile</h2>
      
      <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Main Profile Picture */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ width: "120px", height: "120px", borderRadius: "50%", overflow: "hidden", border: "2px solid #FFFFFF", background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {avatar ? (
              <img src={avatar} alt="Current Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "2.5rem", color: "#FFF" }}>{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Dynamic 9-Grid Avatar Selector */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ textAlign: "center", color: "var(--muted-text)", marginBottom: "1.2rem", fontSize: "0.95rem" }}>Choose your Avatar</h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", 
            gap: "1rem", 
            justifyItems: "center",
            padding: "1.5rem",
            background: "rgba(0,0,0,0.4)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {AVAILABLE_AVATARS.map((gifPath) => (
              <div 
                key={gifPath}
                onClick={() => handleAvatarSelect(gifPath)}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  position: "relative",
                  overflow: "hidden",
                  border: avatar === gifPath ? "3px solid #3b82f6" : "2px solid transparent",
                  boxShadow: avatar === gifPath ? "0 0 20px rgba(59, 130, 246, 0.6)" : "none",
                  transform: avatar === gifPath ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
                  opacity: isUpdating && avatar !== gifPath ? 0.5 : 1
                }}
              >
                <img src={gifPath} alt="Avatar option" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Input Fields */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted-text)" }}>Full Name</label>
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "8px", fontSize: "1rem" }} 
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted-text)" }}>Email Address</label>
          <input 
            type="email" 
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "8px", fontSize: "1rem" }} 
          />
        </div>
        
        <button type="submit" style={{ background: "#FFFFFF", color: "#000000", fontWeight: "bold", padding: "1rem", marginTop: "1rem", fontSize: "1.1rem", borderRadius: "30px", transition: "transform 0.2s ease" }}>
          Save Changes
        </button>
      </form>
    </div>
  );
}
