"use client";

import { useState, useEffect } from "react";
import ThreeScene from "./ThreeScene";
import GoogleSignIn from "./GoogleSignIn";

const ubuntuLogs = [
  "Linux version 5.15.0-101-generic (buildd@lcy02-amd64) (gcc 11.4.0)",
  "Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0-101-generic root=UUID=8b3e-4f ro quiet",
  "secureboot: Secure boot enabled",
  "smpboot: CPU0: Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz",
  "ACPI: Core revision 20210604",
  "systemd[1]: Inserted module 'autofs4'",
  "systemd[1]: Starting systemd-journald.service...",
  "systemd[1]: Started systemd-journald.service.",
  "systemd[1]: Starting Network Configuration...",
  "systemd-networkd[420]: eth0: Gained IPv6LL",
  "systemd-networkd[420]: eth0: IPv4 address 104.18.23.4/24",
  "systemd[1]: Started Network Configuration.",
  "systemd[1]: Reached target Network is Online.",
  "systemd[1]: Starting OpenSSH server daemon...",
  "sshd[521]: Server listening on 0.0.0.0 port 22.",
  "systemd[1]: Started OpenSSH server daemon.",
  "systemd[1]: Starting 3x-ui Management Panel...",
  "3x-ui[580]: Server running at 127.0.0.1:2053",
  "3x-ui[580]: Database loaded successfully.",
  "systemd[1]: Started 3x-ui Management Panel.",
  "systemd[1]: Starting Xray/V2Ray Core Service...",
  "xray[601]: Xray 1.8.3 (Xray, Penetrates Everything.) Custom",
  "xray[601]: Loading config from /usr/local/etc/xray/config.json",
  "xray[601]: Inbound XTLS-Reality started on port 443",
  "xray[601]: Encryption module ChaCha20-Poly1305 initialized",
  "xray[601]: Stealth & SNI Sniffing active on node-sg-01.legionvpn.com",
  "systemd[1]: Started Xray/V2Ray Core Service.",
  "ufw[620]: Firewall active and enabled on system startup",
  "iptables[625]: Enforcing Strict No-Logs policy routing...",
  "systemd[1]: Reached target Multi-User System.",
  "Welcome to LEGION VPN [Your Connection is SECURED]"
];

export default function HeroSection() {
  const [renderedLogs, setRenderedLogs] = useState<string[]>([]);
  const [slashes, setSlashes] = useState("");
  const [exit, setExit] = useState(false);
  
  // Wait for fade out transition before removing from DOM
  const [unmountOverlay, setUnmountOverlay] = useState(false);

  useEffect(() => {
    let index = 0;
    const logInterval = setInterval(() => {
      if (index < ubuntuLogs.length) {
        setRenderedLogs(prev => {
          if (prev.length === ubuntuLogs.length) return prev;
          return [...prev, ubuntuLogs[prev.length]];
        });
        index++;
      } else {
        clearInterval(logInterval);
        
        // Start adding slashes next to the final message
        let slashCount = 0;
        const slashInterval = setInterval(() => {
          if (slashCount < 3) {
            setSlashes(prev => prev + "/");
            slashCount++;
          } else {
            clearInterval(slashInterval);
            
            // Hold before fading out (Total duration ~ 4s)
            setTimeout(() => {
              setExit(true);
              setTimeout(() => setUnmountOverlay(true), 500); // 0.5s transition wait
            }, 1200);
          }
        }, 200);
      }
    }, 70); // Adjusted for a 4-second total duration

    return () => clearInterval(logInterval);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <ThreeScene />
      
      {/* Ubuntu Terminal Boot Overlay */}
      {!unmountOverlay && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#000000",
          color: "#FFFFFF",
          fontFamily: "'Courier New', Courier, monospace",
          zIndex: 9999,
          transition: "opacity 0.5s ease-in-out",
          opacity: exit ? 0 : 1,
          overflow: "hidden",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{ 
            width: "100%",
            maxWidth: "900px", 
            display: "flex", 
            flexDirection: "column", 
            gap: "2px", 
            fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
            textShadow: "0 0 2px rgba(255,255,255,0.8)",
            padding: "1.5rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}>
            {renderedLogs.map((log, i) => {
              const isLastLine = i === ubuntuLogs.length - 1;
              return (
                <div key={i} style={{ 
                  fontWeight: isLastLine ? "bold" : "normal",
                  fontSize: isLastLine ? "clamp(0.85rem, 1.8vw, 1.1rem)" : "inherit",
                  marginTop: isLastLine ? "1rem" : "0" // Give a little space before climax message
                }}>
                  {log}
                  {isLastLine && (
                    <span style={{ marginLeft: "10px", animation: "blink 1s step-end infinite" }}>
                      {slashes}<span style={{ opacity: exit ? 0 : 1 }}>_</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
        </div>
      )}

      {/* Main Content with Full Screen Radial Gradient Behind */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      <div className="container text-center" style={{ 
        position: "relative", 
        zIndex: 2, 
        transition: "opacity 0.5s ease-in-out", 
        opacity: unmountOverlay ? 1 : (exit ? 1 : 0),
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h1 style={{ 
          fontSize: "5rem", 
          marginBottom: "1rem", 
          textShadow: "0 5px 30px rgba(0,0,0,1), 0 0 20px rgba(255,255,255,0.4)" 
        }}>
          LEGION VPN
        </h1>
        <p style={{ 
          fontSize: "1.5rem", 
          color: "#e0e0e0", 
          maxWidth: "600px", 
          margin: "0 auto 3rem auto",
          textShadow: "0 2px 10px rgba(0,0,0,1)" 
        }}>
          Uncompromising speed. Unbreakable security. Total privacy.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", minHeight: "44px", minWidth: "250px" }}>
          <GoogleSignIn />
        </div>

        <div style={{ position: "absolute", bottom: "-100px", left: "50%", transform: "translateX(-50%)", animation: "bounce 2s infinite" }}>
          <p style={{ color: "var(--muted-text)", fontSize: "0.9rem", textShadow: "0 2px 5px rgba(0,0,0,0.8)" }}>Scroll to explore</p>
          <div style={{ width: "2px", height: "40px", background: "linear-gradient(to bottom, var(--text-color), transparent)", margin: "10px auto 0 auto" }} />
        </div>
        <style>{`@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); } 40% { transform: translateY(-10px) translateX(-50%); } 60% { transform: translateY(-5px) translateX(-50%); } }`}</style>
      </div>
    </section>
  );
}
