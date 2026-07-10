"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true, // Let Lenis handle requestAnimationFrame automatically in version 1.1+
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
