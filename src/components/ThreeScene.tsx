"use client";

export default function ThreeScene() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#000000",
        transform: "translateZ(0)", // GPU Layer Promotion
        backfaceVisibility: "hidden",
      }}
    >
      {/* 🚀 GPU Accelerated Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          minWidth: "100%",
          minHeight: "100%",
          width: "auto",
          height: "auto",
          objectFit: "cover",
          transform: "translate3d(-50%, -50%, 0)", // Hardware accelerated movement
          willChange: "transform",
          backfaceVisibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <source src="https://files.catbox.moe/w6juhp.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.45)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
