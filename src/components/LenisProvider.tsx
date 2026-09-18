"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    // Skip the smooth-scroll layer on touch devices and reduced-motion users.
    // Native scrolling is already smooth on phones, and Lenis's continuous
    // rAF loop just adds overhead on top of it — this alone is one of the
    // biggest low-end mobile wins available here.
    if (prefersReducedMotion || isTouchDevice) return;

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Pause the loop while the tab is in the background instead of letting
    // it keep ticking.
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
