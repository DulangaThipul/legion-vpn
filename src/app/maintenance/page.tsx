export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#030303",
      color: "#FFFFFF",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      textAlign: "center",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "rgba(15, 15, 20, 0.8)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "24px",
        padding: "3.5rem 2rem",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 50px rgba(0,0,0,0.9)"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛠️</div>
        
        <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "1rem", color: "#FFFFFF" }}>
          System Under Maintenance
        </h1>
        
        <p style={{ color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.6", marginBottom: "2rem", fontSize: "1rem" }}>
          LEGION VPN පද්ධතියේ වැඩිදියුණු කිරීමේ කටයුත්තක් (Maintenance) සිදුවෙමින් පවතින බැවින් තාවකාලිකව අක්‍රිය කර ඇත. කෙටි වේලාවකින් නැවත පැමිණෙන්න!
        </p>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(99, 102, 241, 0.15)",
          color: "#818cf8",
          padding: "0.6rem 1.2rem",
          borderRadius: "30px",
          fontSize: "0.85rem",
          fontWeight: "bold",
          border: "1px solid rgba(99, 102, 241, 0.3)"
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#818cf8",
            boxShadow: "0 0 10px #818cf8"
          }} />
          Status: Upgrading Core Infrastructure
        </div>
      </div>
    </div>
  );
}