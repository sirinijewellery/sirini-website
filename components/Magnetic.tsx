"use client";

import { useRef } from "react";

// Reusable "magnetic" wrapper — its child gently drifts toward the cursor while
// hovered, then springs back. Wrap any CTA/button/icon. Disabled for touch
// (mousemove doesn't fire) and reduced-motion users.
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleMove(e: React.MouseEvent<HTMLSpanElement>) {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${(mx * strength).toFixed(1)}px, ${(my * strength).toFixed(1)}px)`;
  }

  function handleLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`inline-block [transition:transform_300ms_cubic-bezier(0.22,1,0.36,1)] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
