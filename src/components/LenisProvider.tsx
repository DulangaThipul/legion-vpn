"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Check if device is touch-enabled (smartphones, tablets) or prefers reduced motion
    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Heavily low-end optimized Lenis configuration:
    // - On touch/mobile: let native GPU momentum scrolling run without software interference.
    // - On desktop: snappy lerp (0.1) and responsive wheel multiplier for zero FPS drop.
    const lenis = new Lenis({
      lerp: 0.1,
      duration: isTouchDevice ? 0 : 0.85,
      smoothWheel: !isTouchDevice && !prefersReducedMotion,
      syncTouch: false,
      touchMultiplier: 1.0,
      wheelMultiplier: 0.95,
      prevent: (node) => {
        if (!node) return false;
        const el = node as HTMLElement;
        return (
          el.tagName === "CODE" ||
          el.tagName === "PRE" ||
          el.classList?.contains("no-lenis") ||
          el.getAttribute?.("role") === "dialog"
        );
      },
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
