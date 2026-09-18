"use client";

import { useEffect, useRef, useState } from "react";

export default function DashboardMatrix() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    const isLowEndCpu = (navigator.hardwareConcurrency ?? 8) <= 4;

    // Skip the decorative rain entirely on phones, reduced-motion users, and
    // low-core devices. It's pure decoration and it's one of the heaviest
    // things on this page — a continuous canvas draw loop plus a shadowBlur
    // filter, which is expensive on weak GPUs.
    setEnabled(!prefersReducedMotion && !isSmallScreen && !isLowEndCpu);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const columns = Math.floor(width / 18);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);
    const speeds: number[] = Array.from({ length: columns }, () => 1.5 + Math.random() * 2.5);

    // Cap the draw loop to ~30fps instead of matching the display's full
    // refresh rate. It's purely decorative, so there's no reason to redraw
    // it 120 times a second on a 120Hz panel.
    const FRAME_INTERVAL = 1000 / 30;
    let lastFrameTime = 0;
    let isTabVisible = true;

    const draw = (time: number) => {
      animationFrameId = requestAnimationFrame(draw);
      if (!isTabVisible) return;
      if (time - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = time;

      ctx.fillStyle = "rgba(3, 3, 7, 0.2)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(99, 102, 241, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#6366f1";

      for (let i = 0; i < drops.length; i++) {
        const x = i * 18;
        const y = drops[i];

        ctx.fillRect(x, y, 1.5, 14);

        drops[i] += speeds[i];
        if (drops[i] > height) {
          drops[i] = Math.random() * -50;
        }
      }
      ctx.shadowBlur = 0;
    };

    // Pause the whole loop when the tab isn't visible — no point burning
    // battery drawing to a canvas nobody can see.
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  // Still render the dark background even when the animation is skipped,
  // so disabling it on mobile doesn't leave a flash of unstyled white.
  if (!enabled) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          background: "#030307",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background: "#030307",
      }}
    />
  );
}
