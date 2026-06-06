"use client";

import { useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

interface Estimate {
  place: string; // "City, State" or just the pincode on fallback
  range: string;
}

export function PincodeEstimator() {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    const trimmed = pincode.trim();
    // Indian pincodes are 6 digits and never start with 0.
    if (!/^[1-9]\d{5}$/.test(trimmed)) {
      setError("Enter a valid 6-digit pincode");
      setEstimate(null);
      return;
    }

    setError(null);
    setEstimate(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/pincode?code=${trimmed}`);
      const data = await res.json();

      if (data.valid) {
        const today = new Date();
        const start = addDays(today, data.minDays);
        const end = addDays(today, data.maxDays);
        const place =
          data.city && data.state ? `${data.city}, ${data.state}` : trimmed;
        setEstimate({ place, range: `${formatDate(start)} – ${formatDate(end)}` });
      } else if (data.error === "lookup_failed") {
        // API unreachable — don't block the shopper, show a generic estimate.
        setEstimate({
          place: trimmed,
          range: "5–7 business days across India",
        });
      } else {
        setError(
          "Sorry, we couldn't find that pincode. Please check and try again.",
        );
      }
    } catch {
      setEstimate({ place: trimmed, range: "5–7 business days across India" });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleCheck();
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="pincode-estimator"
        className="flex items-center gap-1.5 text-[10px] font-sans tracking-[0.12em] uppercase text-on-surface-variant"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 shrink-0 text-[#C9A96E]"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Check Delivery Date
      </label>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="pincode-estimator"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (error) setError(null);
          }}
          placeholder="Enter 6-digit pincode"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "pincode-estimator-error" : undefined}
          className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#C9A96E] focus:ring-1 focus:ring-[#C9A96E] transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg border border-[#C9A96E] bg-[#C9A96E] px-5 py-2.5 text-xs font-sans font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#b8975c] hover:border-[#b8975c] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {error && (
          <p
            id="pincode-estimator-error"
            className="text-[13px] font-sans text-rose-600"
          >
            {error}
          </p>
        )}

        {estimate && !error && (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[13px] font-sans text-on-surface">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>
                Delivers to <span className="font-semibold">{estimate.place}</span> by{" "}
                <span className="font-semibold">{estimate.range}</span>
              </span>
            </p>
            <p className="flex items-center gap-1.5 pl-[1.375rem] text-[12px] font-sans text-on-surface-variant">
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 shrink-0 text-[#C9A96E]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              Free shipping · Cash on Delivery available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
