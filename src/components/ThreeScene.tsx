"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "https://files.catbox.moe/rnii1l.m4v";

// Add a real poster image at this path (public/hero-poster.jpg). A still
// frame pulled straight from the video works well, e.g.:
//   ffmpeg -i source.mp4 -ss 00:00:01 -vframes 1 -q:v 3 hero-poster.jpg
const POSTER_SRC = "/hero-poster.jpg";

// How far the mobile crop sits from the right edge, in pixels.
//   100  -> shifts the visible crop 100px toward the LEFT
//  -100  -> shifts the visible crop 100px toward the RIGHT (past the edge)
// This is the only number you need to touch to re-tune the mobile crop.
const MOBILE_CROP_OFFSET_PX = 300;

export default function ThreeScene() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canPlayVideo, setCanPlayVideo] = useState(false);
  // Desktop sees the full frame centered; mobile crops in near the right side
  // of the frame instead of the (less interesting) middle.
  const [objectPosition, setObjectPosition] = useState("center center");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as any).connection;
    const isDataConstrained =
      !!connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""));

    // The video is shown on mobile too now (just cropped differently) — only
    // skip it for accessibility (reduced motion) and genuinely constrained
    // connections.
    setCanPlayVideo(!prefersReducedMotion && !isDataConstrained);

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const updatePosition = () =>
      setObjectPosition(mobileQuery.matches ? `calc(100% + ${MOBILE_CROP_OFFSET_PX}px) center` : "center center");
    updatePosition();
    mobileQuery.addEventListener("change", updatePosition);
    return () => mobileQuery.removeEventListener("change", updatePosition);
  }, []);

  useEffect(() => {
    if (!canPlayVideo) return;
    const video = videoRef.current;
    if (!video) return;

    // Pause decode work the instant the tab isn't visible.
    const handleVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [canPlayVideo]);

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
      {canPlayVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER_SRC}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            transition: "object-position 0.2s ease",
            backfaceVisibility: "hidden",
            pointerEvents: "none",
          }}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={POSTER_SRC}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
          }}
        />
      )}

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
