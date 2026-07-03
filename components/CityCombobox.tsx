"use client";

import { useState, useEffect, useRef } from "react";
import { INDIAN_CITIES, closestCity } from "@/lib/cities";

/* ── CityCombobox ───────────────────────────────────────────────────────────────
   Shared city autocomplete used by CheckoutForm and AddressManager.

   Autocorrect policy (fix for silent destructive snap):
   - Exact case-insensitive match → normalise case (closestCity handles this).
   - Edit distance ≤ 1 (single-character typo) → snap to corrected city.
   - Edit distance 2-3 → do NOT autocorrect; leave the user's typed value as-is.
     This prevents legitimate small Indian towns (e.g. "Sangola") from being
     silently replaced with a listed city ("Sangli").
   ─────────────────────────────────────────────────────────────────────────────── */

interface CityComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  /** Custom input class for the text field. Falls back to the default
   *  Shadcn Input-style class when omitted (used by CheckoutForm). */
  inputClass?: string;
}

const DEFAULT_INPUT_CLASS =
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-sans transition-colors";

export function CityCombobox({ value, onChange, error, inputClass }: CityComboboxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep inputValue in sync when an external value change arrives
  // (e.g. selectSavedAddress sets the RHF value, which flows in as `value`).
  // Adjusted during render (React's documented "previous render" pattern) —
  // avoids the extra stale-frame an effect-based sync would paint.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  // Clean up the blur timer on unmount to prevent state updates on
  // an already-unmounted component.
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const filtered =
    inputValue.trim() === ""
      ? INDIAN_CITIES
      : INDIAN_CITIES.filter((c) =>
          c.toLowerCase().includes(inputValue.trim().toLowerCase())
        );

  function handleSelect(city: string) {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    onChange(e.target.value); // keep RHF in sync while typing
    setIsOpen(true);
  }

  function handleBlur() {
    // Delay so a click on a list item fires before the dropdown closes.
    blurTimerRef.current = setTimeout(() => {
      const typed = inputValue.trim();
      if (typed !== "") {
        const match = closestCity(typed);
        if (match && match !== typed) {
          // Only snap for exact case-insensitive matches OR single-character typos
          // (edit distance ≤ 1). For distance 2–3 we skip the correction so that
          // real cities not in our list (e.g. "Sangola") are not silently replaced.
          const dist = levenshteinDistance(typed.toLowerCase(), match.toLowerCase());
          if (dist <= 1) {
            setInputValue(match);
            onChange(match);
          }
          // distance 2-3: leave typed value untouched
        }
      }
      setIsOpen(false);
    }, 150);
  }

  function handleFocus() {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setIsOpen(true);
  }

  // Compute the resolved input class: use the caller-supplied class or the
  // default Shadcn Input style with error-aware border colour.
  const resolvedClass =
    inputClass ??
    `${DEFAULT_INPUT_CLASS} ${error ? "border-destructive" : "border-input"}`;

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Mumbai"
        autoComplete="off"
        aria-invalid={!!error}
        aria-autocomplete="list"
        className={resolvedClass}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-52 overflow-y-auto"
          role="listbox"
        >
          {filtered.map((city) => (
            <li
              key={city}
              role="option"
              aria-selected={city === value}
              onMouseDown={() => handleSelect(city)}
              className={`cursor-pointer px-3 py-2 font-sans text-sm text-foreground hover:bg-primary/10 transition-colors ${
                city === value ? "bg-primary/10 font-medium" : ""
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Levenshtein distance (local copy used only for the ≤1 threshold check) ────
// We deliberately keep lib/cities.ts unchanged and use this private copy so the
// threshold logic lives entirely in this component.

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}
