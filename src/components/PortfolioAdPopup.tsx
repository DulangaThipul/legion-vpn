"use client";

import { useState, useEffect } from "react";

export default function PortfolioAdPopup() {
  const [showAd, setShowAd] = useState(false);
  const [adDismissed, setAdDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!adDismissed) setShowAd(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [adDismissed]);

  if (!showAd || adDismissed) return null;

  return (
    <>
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "320px",
        background: "rgba(5, 5, 5, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "16px",
        padding: "1.5rem",
        zIndex: 1000,
        boxShadow: "0 0 30px rgba(255, 255, 255, 0.1)",
        animation: "slideInRight 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards"
      }}>
        <button 
          onClick={() => {
            setAdDismissed(true);
            setShowAd(false);
          }}
          style={{
            position: "absolute",
            top: "0.8rem",
            right: "1rem",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            fontSize: "1.2rem",
            cursor: "pointer",
            transition: "color 0.3s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "#FFFFFF"}
          onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
        >
          ✕
        </button>
        
        <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1.2rem", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 10px #FFFFFF" }}></span>
          Legion Graphics
        </h3>
        <p style={{ margin: "0 0 1.2rem 0", fontSize: "0.9rem", color: "var(--muted-text)", lineHeight: 1.5 }}>
          Need professional freelance Graphic Design or Creative Video Production? We bring visions to life.
        </p>
        <a 
          href="https://www.legiongraphics.site" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.8rem 1rem",
            background: "#FFFFFF",
            color: "#000000",
            textDecoration: "none",
            fontWeight: "bold",
            borderRadius: "8px",
            fontSize: "0.9rem",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.6)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Visit Portfolio
        </a>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
