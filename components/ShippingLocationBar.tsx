"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "sirini_shipping_city";
const SESSION_DISMISSED = "sirini_shipping_city_dismissed";

export function ShippingLocationBar() {
  const [city, setCity] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if dismissed this session
    try {
      if (sessionStorage.getItem(SESSION_DISMISSED) === "1") {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }

    // Try cached city first
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        setCity(cached);
        return;
      }
    } catch { /* ignore */ }

    // Request geolocation
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!res.ok) return;
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.county ||
            data.address?.state_district;
          if (detectedCity) {
            setCity(detectedCity);
            try { sessionStorage.setItem(SESSION_KEY, detectedCity); } catch { /* ignore */ }
          }
        } catch { /* network error — silently skip */ }
      },
      () => { /* permission denied or error — silently skip */ },
      { timeout: 8000 }
    );
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(SESSION_DISMISSED, "1"); } catch { /* ignore */ }
  }

  if (!mounted || !city || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ backgroundColor: "#4A1520" }}
      className="font-[family-name:var(--font-dm-sans)] text-white"
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-center px-10 py-1.5 text-center text-[11px] tracking-[0.06em]">
        <span className="text-white/70">📦 Delivering to</span>
        <span className="ml-1.5 font-semibold text-white">{city}</span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss shipping location"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs leading-none text-white/50 transition-colors hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
