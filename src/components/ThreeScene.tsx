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
      }}
    >
      {/* 🚀 Optimized Video Background for Mobile & Desktop */}
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
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      >
        <source src="https://files.catbox.moe/w6juhp.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🚀 Dark Overlay to blend perfectly with the site theme */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.45)",
          zIndex: 1,
        }}
      />
    </div>
  );
}
