"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardMatrix from "@/components/DashboardMatrix";

// Make sure your GIFs are placed in the "public/avatars/" directory
const AVAILABLE_AVATARS = [
  "/avatars/avatar1.gif",
  "/avatars/avatar2.gif",
  "/avatars/avatar3.gif",
  "/avatars/avatar4.gif"
];

export default function ProfileAvatarSelector() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleSave = () => {
    if (!selectedAvatar) return;
    
    // Here you can add your Server Action or API call to save it to Prisma DB
    // e.g. updateProfileAvatar(selectedAvatar);
    
    alert(`Avatar saved successfully! (Mocked): ${selectedAvatar}`);
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", color: "#FFFFFF", zIndex: 1 }}>
      <DashboardMatrix />
      
      <main style={{ padding: "4rem 1.5rem", maxWidth: "800px", margin: "0 auto", position: "relative" }}>
        
        {/* Back Navigation */}
        <Link 
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--muted-text)",
            textDecoration: "none",
            marginBottom: "2rem",
            fontWeight: "bold",
            transition: "color 0.3s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "#FFFFFF"}
          onMouseOut={(e) => e.currentTarget.style.color = "var(--muted-text)"}
        >
          ← Back to Dashboard
        </Link>

        <div className="glass-panel" style={{ padding: "4rem 3rem", textAlign: "center", animation: "fadeInUp 0.5s ease forwards" }}>
          <h1 style={{ fontSize: "2.5rem", margin: "0 0 1rem 0", fontWeight: "300" }}>Select Your Avatar</h1>
          <p style={{ color: "var(--muted-text)", marginBottom: "3rem", fontSize: "1.1rem" }}>
            Choose a dynamic GIF avatar to represent you in the Legion Network.
          </p>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
            gap: "2rem",
            marginBottom: "3rem",
            justifyItems: "center"
          }}>
            {AVAILABLE_AVATARS.map((gifPath, index) => (
              <div 
                key={index}
                onClick={() => setSelectedAvatar(gifPath)}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  border: selectedAvatar === gifPath ? "4px solid #FFFFFF" : "2px solid rgba(255,255,255,0.2)",
                  boxShadow: selectedAvatar === gifPath ? "0 0 25px rgba(255,255,255,0.5)" : "none",
                  transform: selectedAvatar === gifPath ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)"
                }}
                onMouseOver={(e) => {
                  if (selectedAvatar !== gifPath) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedAvatar !== gifPath) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                <img 
                  src={gifPath} 
                  alt={`Avatar ${index + 1}`} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={!selectedAvatar}
            className="btn hover:scale-105"
            style={{ 
              padding: "1.2rem 3rem", 
              background: selectedAvatar ? "#FFFFFF" : "rgba(255,255,255,0.1)", 
              color: selectedAvatar ? "#000000" : "rgba(255,255,255,0.4)",
              fontWeight: "bold",
              fontSize: "1.1rem",
              border: "none",
              borderRadius: "30px",
              cursor: selectedAvatar ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              boxShadow: selectedAvatar ? "0 0 20px rgba(255,255,255,0.3)" : "none"
            }}
          >
            Save Avatar
          </button>
        </div>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}