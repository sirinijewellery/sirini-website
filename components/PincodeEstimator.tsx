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
  pincode: string;
  range: string;
}

export function PincodeEstimator() {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  function handleCheck() {
    const trimmed = pincode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter a valid 6-digit pincode");
      setEstimate(null);
      return;
    }

    setError(null);
    const today = new Date();
    const start = addDays(today, 4);
    const end = addDays(today, 7);
    setEstimate({
      pincode: trimmed,
      range: `${formatDate(start)} – ${formatDate(end)}`,
    });
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
          className="shrink-0 rounded-lg border border-[#C9A96E] bg-[#C9A96E] px-5 py-2.5 text-xs font-sans font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#b8975c] hover:border-[#b8975c] transition-colors cursor-pointer"
        >
          Check
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
                Delivers to <span className="font-semibold">{estimate.pincode}</span> by{" "}
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
