"use client";

import { useEffect, useRef } from "react";

export default function DashboardMatrix() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    const isMobile = width < 768;
    const columns = Math.floor(width / (isMobile ? 24 : 18));
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);
    const speeds: number[] = Array.from({ length: columns }, () => 1.5 + Math.random() * 2.5);

    const draw = () => {
      ctx.fillStyle = "rgba(3, 3, 7, 0.2)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(99, 102, 241, 0.6)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#6366f1";

      for (let i = 0; i < drops.length; i++) {
        const x = i * (isMobile ? 24 : 18);
        const y = drops[i];

        // Draw packet streaks
        ctx.fillRect(x, y, 1.5, 14);

        drops[i] += speeds[i];
        if (drops[i] > height) {
          drops[i] = Math.random() * -50;
        }
      }
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
