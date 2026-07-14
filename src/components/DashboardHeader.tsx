"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateUserAvatar } from "@/lib/authActions";

const AVAILABLE_AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/avatar${i + 1}.gif`);

export default function DashboardHeaderClient({ user }: { user: any }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const avatar = user?.image;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAvatar = async (gifPath: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    const res = await updateUserAvatar(gifPath);
    if (res.success) {
      setDropdownOpen(false);
      router.refresh(); 
    }
    setIsUpdating(false);
  };

  return (
    <header style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1rem", position: "relative", zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative" }} ref={dropdownRef}>
        
        <span className="hidden md:block font-bold" style={{ fontSize: "1.1rem", color: "#FFFFFF" }}>
          {user?.name}
        </span>
        
        <div 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            width: "45px", height: "45px", borderRadius: "50%", border: "2px solid #FFFFFF", 
            background: "#333", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", overflow: "hidden", transition: "all 0.3s ease",
            boxShadow: dropdownOpen ? "0 0 20px rgba(255,255,255,0.4)" : "none",
            transform: dropdownOpen ? "scale(1.05)" : "scale(1)"
          }}
        >
          {avatar ? (
            <img src={avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "#FFF", fontWeight: "bold" }}>{user?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {dropdownOpen && (
          <div style={{
            position: "absolute", top: "130%", right: 0, width: "280px",
            background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(25px)", WebkitBackdropFilter: "blur(25px)",
            border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "20px", padding: "1.5rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)", animation: "popupModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards", transformOrigin: "top right"
          }}>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", color: "var(--muted-text)", textAlign: "center" }}>Select Avatar</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", justifyItems: "center", marginBottom: "1rem" }}>
              {AVAILABLE_AVATARS.map((gifPath) => (
                <div 
                  key={gifPath} onClick={() => handleSelectAvatar(gifPath)}
                  style={{
                    width: "55px", height: "55px", borderRadius: "50%", overflow: "hidden", cursor: isUpdating ? "not-allowed" : "pointer",
                    border: avatar === gifPath ? "2px solid #3b82f6" : "2px solid transparent", opacity: isUpdating && avatar !== gifPath ? 0.5 : 1
                  }}
                >
                  <img src={gifPath} alt="Avatar option" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleSelectAvatar("")} 
              style={{ width: "100%", padding: "0.5rem", background: "rgba(255,0,0,0.1)", color: "#ff4444", borderRadius: "8px", border: "1px solid rgba(255,0,0,0.2)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
            >
              Restore Google Image
            </button>

            <style>{`@keyframes popupModal { from { opacity: 0; transform: scale(0.9) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
          </div>
        )}
      </div>
    </header>
  );
}
