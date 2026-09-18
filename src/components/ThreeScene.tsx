"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "https://files.catbox.moe/w6juhp.mp4";

// Add a real poster image at this path (public/hero-poster.jpg). A still
// frame pulled straight from the video works well, e.g.:
//   ffmpeg -i source.mp4 -ss 00:00:01 -vframes 1 -q:v 3 hero-poster.jpg
const POSTER_SRC = "/hero-poster.jpg";

export default function ThreeScene() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canPlayVideo, setCanPlayVideo] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    const connection = (navigator as any).connection;
    const isDataConstrained =
      !!connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""));

    // An autoplaying full-screen video is one of the heaviest things a phone
    // can be asked to decode, and it burns real mobile data. Serve a static
    // poster instead on small screens, reduced-motion, and slow connections.
    setCanPlayVideo(!prefersReducedMotion && !isSmallScreen && !isDataConstrained);
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
            top: "50%",
            left: "50%",
            minWidth: "100%",
            minHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "cover",
            transform: "translate3d(-50%, -50%, 0)",
            willChange: "transform",
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
