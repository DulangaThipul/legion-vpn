"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GoogleSignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      // Send the token to the backend
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (res.ok) {
        // Trigger Loading Overlay before redirecting
        setIsLoading(true);
        // Force a hard redirect to ensure cookies are read by the server component
        window.location.href = "/dashboard";
      } else {
        console.error("Authentication failed");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  };

  return (
    <>
      {isLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(5, 5, 5, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          animation: "fadeIn 0.3s ease forwards"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#FFFFFF",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "1rem"
          }} />
          <h2 style={{ color: "#FFFFFF", fontSize: "1.2rem", letterSpacing: "2px" }}>AUTHENTICATING...</h2>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}

      <div className="google-auth-wrapper">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            console.error("Login Failed");
          }}
          theme="filled_black"
          shape="pill"
          size="large"
        />
      </div>
    </>
  );
}
