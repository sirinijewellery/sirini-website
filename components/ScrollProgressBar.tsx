"use client";

import { useEffect, useRef } from "react";

/**
 * Thin gold reading-progress bar fixed to the very top of the viewport.
 * Scales horizontally with scroll position. Purely a position indicator,
 * so it stays active even for reduced-motion users (no decorative motion).
 * Hidden on pages too short to meaningfully scroll.
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const bar = barRef.current;
        if (!bar) return;
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        // Short pages: keep the bar invisible rather than instantly full.
        if (max < 400) {
          bar.style.transform = "scaleX(0)";
          return;
        }
        const progress = Math.min(1, Math.max(0, window.scrollY / max));
        bar.style.transform = `scaleX(${progress.toFixed(4)})`;
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}
