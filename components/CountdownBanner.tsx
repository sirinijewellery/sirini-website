"use client";

import { useEffect, useState } from "react";
import { SALE } from "@/lib/saleConfig";

const DISMISS_KEY = `sirini_sale_dismissed_${SALE.endsAt}`;

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getRemaining(endMs: number): Remaining | null {
  const diff = endMs - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function CountdownBanner() {
  // `mounted` gates all time-dependent rendering so SSR output (a static
  // placeholder / null) matches the very first client render — no hydration
  // mismatch. Real countdown values only appear after the effect runs.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  const endMs = new Date(SALE.endsAt).getTime();

  useEffect(() => {
    setMounted(true);

    // Respect a previous dismissal for this specific sale.
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      // localStorage may be unavailable (private mode, etc.) — show banner.
    }

    setRemaining(getRemaining(endMs));
    const id = setInterval(() => {
      setRemaining(getRemaining(endMs));
    }, 1000);

    return () => clearInterval(id);
  }, [endMs]);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures — banner still hides for this session.
    }
  }

  // Owner disabled the sale entirely.
  if (!SALE.enabled) return null;

  // Sale already expired (checked on the server too, so SSR renders null).
  if (endMs <= Date.now()) return null;

  // Before mount we render nothing to keep SSR/client output identical.
  if (!mounted) return null;

  // Dismissed for this sale, or the countdown ran out while mounted.
  if (dismissed || remaining === null) return null;

  return (
    <div
      role="region"
      aria-label="Sale announcement"
      style={{ backgroundColor: "#5C1A24" }}
      className="font-[family-name:var(--font-dm-sans)] text-white"
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-1 px-10 py-2 text-center text-[11px] uppercase tracking-[0.12em] sm:text-xs">
        <span className="font-semibold">{SALE.label}</span>
        <span className="hidden text-white/80 sm:inline">{SALE.message}</span>

        <span
          className="flex items-center gap-1 font-semibold tabular-nums"
          style={{ color: "#C9A96E" }}
          aria-label={`Sale ends in ${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds`}
        >
          <span>{pad(remaining.days)}</span>
          <span aria-hidden="true" className="text-white/40">:</span>
          <span>{pad(remaining.hours)}</span>
          <span aria-hidden="true" className="text-white/40">:</span>
          <span>{pad(remaining.minutes)}</span>
          <span aria-hidden="true" className="text-white/40">:</span>
          <span>{pad(remaining.seconds)}</span>
        </span>

        {SALE.code ? (
          <span className="hidden text-white/80 md:inline">
            Use code{" "}
            <span className="font-semibold text-white">{SALE.code}</span>
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss sale banner"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none text-white/70 transition-colors hover:text-white"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
