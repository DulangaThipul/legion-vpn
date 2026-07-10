"use client";

import { useState, useEffect } from "react";

export default function PortfolioAdPopup() {
  const [showAd, setShowAd] = useState(false);
  const [adDismissed, setAdDismissed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!adDismissed) setShowAd(true);
    }, 8000); // 4s for loading screen + 4s wait
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
        background: "linear-gradient(135deg, rgba(30, 10, 60, 0.9) 0%, rgba(10, 5, 20, 0.95) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(150, 50, 255, 0.4)",
        borderRadius: "16px",
        padding: "1.5rem",
        zIndex: 1000,
        boxShadow: "0 10px 40px rgba(150, 50, 255, 0.2)",
        animation: isExiting ? "slideOutRight 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards" : "slideInRight 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards"
      }}>
        <button 
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setAdDismissed(true);
              setShowAd(false);
            }, 500);
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
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#bd00ff", boxShadow: "0 0 10px #bd00ff" }}></span>
          <span style={{ background: "linear-gradient(90deg, #bd00ff, #00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Legion Graphics</span>
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
            background: "linear-gradient(90deg, #bd00ff, #00d4ff)",
            color: "#FFFFFF",
            textDecoration: "none",
            fontWeight: "bold",
            borderRadius: "8px",
            fontSize: "0.95rem",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 0 20px rgba(189, 0, 255, 0.6)";
            e.currentTarget.style.transform = "scale(1.05)";
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
          from { opacity: 0; transform: translateX(120%) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(120%) scale(0.9); }
        }
      `}</style>
    </>
  );
}
