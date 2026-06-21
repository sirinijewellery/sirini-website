import { cache } from "react";
import { getSetting } from "@/lib/queries/site";

// ─────────────────────────────────────────────────────────────────────────
// Theme settings reader (server-side).
//
// Two owner-editable groups, each its own Setting key:
//   theme.colors → a few high-impact brand colour tokens
//   theme.font   → which curated display+body pairing to use
//
// GOLDEN RULE: every default below equals the value the site currently ships
// with (see app/globals.css @theme block + app/layout.tsx next/font setup), so
// an unset / unedited setting renders the site byte-for-byte identical.
//
// Values are SANITIZED here before they ever reach the injected <style> in the
// layout, so a malformed/hostile stored value can never break or inject CSS.
// `cache()` dedupes reads within a single render.
// ─────────────────────────────────────────────────────────────────────────

export const THEME_SETTING_KEYS = {
  colors: "theme.colors",
  font: "theme.font",
} as const;

// ── Colours ──────────────────────────────────────────────────────────────
// Maps a friendly setting field → the CSS custom property it overrides at
// :root. Only a handful of high-impact brand tokens are exposed; everything
// else continues to read from globals.css. Some tokens are duplicated under
// legacy aliases that older components still reference, so changing "primary"
// keeps the rose-gold aliases in sync too.
export interface ThemeColorTarget {
  /** Field key used in the setting + admin UI */
  field: ThemeColorField;
  /** Human label for the admin UI */
  label: string;
  /** One-line helper for the admin UI */
  help: string;
  /** Every :root CSS variable this field should write (kept in sync). */
  vars: string[];
  /** Current shipped value — the default. */
  default: string;
}

export type ThemeColorField =
  | "primary"
  | "primaryContainer"
  | "gold"
  | "background"
  | "foreground";

// Defaults mirror app/globals.css EXACTLY.
export const THEME_COLOR_TARGETS: ThemeColorTarget[] = [
  {
    field: "primary",
    label: "Primary (brand maroon)",
    help: "Main brand colour — buttons, links, accents.",
    vars: [
      "--color-primary",
      "--color-rose-gold",
      "--color-surface-tint",
      "--color-ring",
      "--color-sidebar-primary",
      "--color-sidebar-ring",
    ],
    default: "#8a4853",
  },
  {
    field: "primaryContainer",
    label: "Primary (light variant)",
    help: "Lighter shade of the brand colour used for hovers and fills.",
    vars: ["--color-primary-container", "--color-rose-gold-light"],
    default: "#a6606b",
  },
  {
    field: "gold",
    label: "Gold accent",
    help: "Warm gold used for rules, dividers and highlights.",
    vars: ["--color-tertiary-container"],
    default: "#cba72f",
  },
  {
    field: "background",
    label: "Page background (cream)",
    help: "The site's base background / surface colour.",
    vars: [
      "--color-background",
      "--color-surface",
      "--color-surface-bright",
      "--color-cream",
    ],
    default: "#fff8f5",
  },
  {
    field: "foreground",
    label: "Text colour",
    help: "Default body and heading text colour.",
    vars: [
      "--color-foreground",
      "--color-on-background",
      "--color-on-surface",
      "--color-charcoal-text",
      "--color-card-foreground",
      "--color-popover-foreground",
      "--color-accent-foreground",
    ],
    default: "#221a15",
  },
];

export const THEME_COLOR_DEFAULTS: Record<ThemeColorField, string> =
  Object.fromEntries(
    THEME_COLOR_TARGETS.map((t) => [t.field, t.default]),
  ) as Record<ThemeColorField, string>;

export type ThemeColors = Partial<Record<ThemeColorField, string>>;

// Strict colour syntax: #rgb / #rrggbb / #rrggbbaa, rgb()/rgba(), hsl()/hsla().
// Anything else is rejected so the injected CSS is always safe + well-formed.
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_RE = /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/;
const HSL_RE = /^hsla?\(\s*[\d.]+(?:deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+%?\s*)?\)$/;

export function isValidColor(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return HEX_RE.test(s) || RGB_RE.test(s) || HSL_RE.test(s);
}

// ── Fonts ────────────────────────────────────────────────────────────────
// next/font requires build-time declaration, so the full curated set is
// pre-registered in app/layout.tsx. Each pairing's `key` maps to the runtime
// CSS variable names declared there; the layout injects a :root override that
// points the base font variables at the chosen pairing. The DEFAULT pairing is
// the current EB Garamond / DM Sans and emits NO override (identical look).
export type ThemeFontKey =
  | "garamond-dmsans"
  | "playfair-inter"
  | "cormorant-jost"
  | "fraunces-nunito"
  | "marcellus-poppins";

export interface ThemeFontPairing {
  key: ThemeFontKey;
  label: string;
  /** CSS var (declared in layout) supplying the DISPLAY/heading family. */
  displayVar: string;
  /** CSS var (declared in layout) supplying the BODY/sans family. */
  bodyVar: string;
  /** Web-safe stack appended after the variable, for the live preview + fallback. */
  displayStack: string;
  bodyStack: string;
}

export const DEFAULT_FONT_KEY: ThemeFontKey = "garamond-dmsans";

export const THEME_FONT_PAIRINGS: ThemeFontPairing[] = [
  {
    key: "garamond-dmsans",
    label: "EB Garamond + DM Sans (current)",
    displayVar: "--font-eb-garamond",
    bodyVar: "--font-dm-sans",
    displayStack: '"EB Garamond", Georgia, serif',
    bodyStack: '"DM Sans", system-ui, sans-serif',
  },
  {
    key: "playfair-inter",
    label: "Playfair Display + Inter",
    displayVar: "--font-playfair",
    bodyVar: "--font-inter",
    displayStack: '"Playfair Display", Georgia, serif',
    bodyStack: '"Inter", system-ui, sans-serif',
  },
  {
    key: "cormorant-jost",
    label: "Cormorant Garamond + Jost",
    displayVar: "--font-cormorant",
    bodyVar: "--font-jost",
    displayStack: '"Cormorant Garamond", Georgia, serif',
    bodyStack: '"Jost", system-ui, sans-serif',
  },
  {
    key: "fraunces-nunito",
    label: "Fraunces + Nunito Sans",
    displayVar: "--font-fraunces",
    bodyVar: "--font-nunito",
    displayStack: '"Fraunces", Georgia, serif',
    bodyStack: '"Nunito Sans", system-ui, sans-serif',
  },
  {
    key: "marcellus-poppins",
    label: "Marcellus + Poppins",
    displayVar: "--font-marcellus",
    bodyVar: "--font-poppins",
    displayStack: '"Marcellus", Georgia, serif',
    bodyStack: '"Poppins", system-ui, sans-serif',
  },
];

export function getFontPairing(key: ThemeFontKey | string): ThemeFontPairing {
  return (
    THEME_FONT_PAIRINGS.find((p) => p.key === key) ?? THEME_FONT_PAIRINGS[0]
  );
}

// ── Readers ──────────────────────────────────────────────────────────────

export const getThemeColors = cache(async (): Promise<ThemeColors> => {
  const raw = await getSetting<unknown>(THEME_SETTING_KEYS.colors, null);
  const out: ThemeColors = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const t of THEME_COLOR_TARGETS) {
      const v = (raw as Record<string, unknown>)[t.field];
      // Only accept a sanitized colour that DIFFERS from the default; equal /
      // invalid / missing values emit nothing so the site stays identical.
      if (isValidColor(v) && v.trim().toLowerCase() !== t.default.toLowerCase()) {
        out[t.field] = v.trim();
      }
    }
  }
  return out;
});

export const getThemeFontKey = cache(async (): Promise<ThemeFontKey> => {
  const raw = await getSetting<unknown>(THEME_SETTING_KEYS.font, null);
  if (typeof raw === "string" && THEME_FONT_PAIRINGS.some((p) => p.key === raw)) {
    return raw as ThemeFontKey;
  }
  return DEFAULT_FONT_KEY;
});

export interface ThemeSettings {
  colors: ThemeColors;
  fontKey: ThemeFontKey;
}

export const getThemeSettings = cache(async (): Promise<ThemeSettings> => {
  const [colors, fontKey] = await Promise.all([
    getThemeColors(),
    getThemeFontKey(),
  ]);
  return { colors, fontKey };
});

// Builds the CSS injected into <style id="theme-overrides"> in the root layout.
// Returns "" when nothing was customized → no style tag content → identical look.
// Everything here is built from sanitized colours + a whitelisted font pairing,
// so the output is always safe to inline.
export function buildThemeOverrideCss(settings: ThemeSettings): string {
  const rules: string[] = [];

  // Colours — write every aliased var for each changed field.
  for (const t of THEME_COLOR_TARGETS) {
    const v = settings.colors[t.field];
    if (!v) continue;
    for (const cssVar of t.vars) {
      rules.push(`${cssVar}:${v};`);
    }
  }

  // Fonts — remap the base font variables to the chosen pairing. The whole
  // font-token chain in globals.css bottoms out at --font-eb-garamond /
  // --font-dm-sans, so overriding just those two swaps fonts site-wide.
  // Default pairing emits nothing.
  if (settings.fontKey !== DEFAULT_FONT_KEY) {
    const p = getFontPairing(settings.fontKey);
    rules.push(`--font-eb-garamond:${p.displayVar ? `var(${p.displayVar})` : ""};`);
    rules.push(`--font-dm-sans:${p.bodyVar ? `var(${p.bodyVar})` : ""};`);
  }

  if (!rules.length) return "";
  return `:root{${rules.join("")}}`;
}
