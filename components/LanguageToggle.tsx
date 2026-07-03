"use client";

import { useEffect, useCallback, useSyncExternalStore } from "react";

// One-click EN ⇄ हिंदी toggle for the announcement ribbon.
// Drives the Google Website Translate widget via the `googtrans` cookie:
// set it, reload, and the widget translates the entire page (UI + the 160+
// DB-driven product names/descriptions) on load. No per-product data needed.

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (opts: Record<string, unknown>, el: string) => void;
      };
    };
  }
}

const GT_COOKIE = "googtrans";

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const row = document.cookie.split("; ").find((r) => r.startsWith(name + "="));
  return row ? decodeURIComponent(row.split("=").slice(1).join("=")) : "";
}

/** Set or clear the googtrans cookie across every scope Google may use. */
function writeGoogtrans(toHindi: boolean) {
  const host = window.location.hostname;
  const base = host.replace(/^www\./, "");
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";
  for (const d of ["", `;domain=${host}`, `;domain=.${base}`]) {
    document.cookie = `${GT_COOKIE}=;expires=${past};path=/${d}`;
  }
  if (toHindi) {
    document.cookie = `${GT_COOKIE}=/en/hi;path=/`;
    if (base.includes(".")) {
      document.cookie = `${GT_COOKIE}=/en/hi;path=/;domain=.${base}`;
    }
  }
}

const noopSubscribe = () => () => {};

export function LanguageToggle() {
  // Cookie-backed value read via useSyncExternalStore: SSR renders the
  // English default, the client snapshot supplies the real cookie state —
  // no hydration mismatch and no setState-in-effect.
  const hindi = useSyncExternalStore(
    noopSubscribe,
    () => readCookie(GT_COOKIE).endsWith("/hi"),
    () => false
  );

  useEffect(() => {
    // Inject the Google Translate widget once (it reads the cookie on load).
    if (document.getElementById("google-translate-script")) return;
    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", includedLanguages: "en,hi", autoDisplay: false },
          "google_translate_element",
        );
      }
    };
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
  }, []);

  const toggle = useCallback(() => {
    writeGoogtrans(!hindi);
    window.location.reload();
  }, [hindi]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={hindi ? "Switch to English" : "हिंदी में देखें — switch to Hindi"}
        className="notranslate inline-flex items-center gap-1 rounded-full border border-on-primary/45 bg-on-primary/10 px-2.5 py-1 font-label-caps text-[10px] md:text-[11px] font-semibold tracking-[0.08em] uppercase text-on-primary hover:bg-on-primary/20 hover:border-on-primary/80 transition-colors cursor-pointer"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {hindi ? "English" : "हिंदी"}
      </button>
      {/* Hidden widget host — kept in the DOM (off-screen via CSS) so the
          translation engine can initialise. We drive it from the button above. */}
      <div id="google_translate_element" aria-hidden="true" />
    </>
  );
}
