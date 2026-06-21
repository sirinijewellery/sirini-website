"use client";

import { useState } from "react";
import { toast } from "sonner";

// ───────────────────────────────────────────────────────────────────────────
// Theme manager — owner-editable brand colours + font pairing.
//
// Setting keys mirror lib/queries/theme.ts (THEME_SETTING_KEYS):
//   theme.colors → { primary?, primaryContainer?, gold?, background?, foreground? }
//   theme.font   → one of the FONT_PAIRINGS keys
//
// Constants below are INLINED (not imported from the server query module) so
// this client file never pulls server code, matching CommerceSettingsManager.
// Defaults MUST equal lib/queries/theme.ts THEME_COLOR_TARGETS / DEFAULT_FONT_KEY.
// ───────────────────────────────────────────────────────────────────────────

const KEYS = {
  colors: "theme.colors",
  font: "theme.font",
} as const;

type ColorField =
  | "primary"
  | "primaryContainer"
  | "gold"
  | "background"
  | "foreground";

const COLOR_FIELDS: {
  field: ColorField;
  label: string;
  help: string;
  default: string;
}[] = [
  {
    field: "primary",
    label: "Primary (brand maroon)",
    help: "Main brand colour — buttons, links, accents.",
    default: "#8a4853",
  },
  {
    field: "primaryContainer",
    label: "Primary (light variant)",
    help: "Lighter shade used for hovers and fills.",
    default: "#a6606b",
  },
  {
    field: "gold",
    label: "Gold accent",
    help: "Warm gold for rules, dividers and highlights.",
    default: "#cba72f",
  },
  {
    field: "background",
    label: "Page background (cream)",
    help: "The site's base background / surface colour.",
    default: "#fff8f5",
  },
  {
    field: "foreground",
    label: "Text colour",
    help: "Default body and heading text colour.",
    default: "#221a15",
  },
];

type FontKey =
  | "garamond-dmsans"
  | "playfair-inter"
  | "cormorant-jost"
  | "fraunces-nunito"
  | "marcellus-poppins";

const DEFAULT_FONT_KEY: FontKey = "garamond-dmsans";

const FONT_PAIRINGS: {
  key: FontKey;
  label: string;
  // CSS font-family stacks for the live preview (web-safe fallbacks; the real
  // self-hosted fonts power the actual site once saved).
  displayStack: string;
  bodyStack: string;
}[] = [
  {
    key: "garamond-dmsans",
    label: "EB Garamond + DM Sans (current)",
    displayStack: '"EB Garamond", Georgia, serif',
    bodyStack: '"DM Sans", system-ui, sans-serif',
  },
  {
    key: "playfair-inter",
    label: "Playfair Display + Inter",
    displayStack: '"Playfair Display", Georgia, serif',
    bodyStack: '"Inter", system-ui, sans-serif',
  },
  {
    key: "cormorant-jost",
    label: "Cormorant Garamond + Jost",
    displayStack: '"Cormorant Garamond", Georgia, serif',
    bodyStack: '"Jost", system-ui, sans-serif',
  },
  {
    key: "fraunces-nunito",
    label: "Fraunces + Nunito Sans",
    displayStack: '"Fraunces", Georgia, serif',
    bodyStack: '"Nunito Sans", system-ui, sans-serif',
  },
  {
    key: "marcellus-poppins",
    label: "Marcellus + Poppins",
    displayStack: '"Marcellus", Georgia, serif',
    bodyStack: '"Poppins", system-ui, sans-serif',
  },
];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function normalizeHex(v: string): string {
  const s = v.trim();
  return s.startsWith("#") ? s : `#${s}`;
}

function ColorRow({
  label,
  help,
  value,
  defaultValue,
  onChange,
  onReset,
}: {
  label: string;
  help: string;
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const isDefault = value.toLowerCase() === defaultValue.toLowerCase();
  // <input type="color"> only accepts #rrggbb; fall back to the default for the
  // swatch when the text field holds a non-hex value (rgb/hsl typed manually).
  const swatch = HEX_RE.test(value) && value.length === 7 ? value : defaultValue;
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={swatch}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        aria-label={`${label} colour picker`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-700">{label}</span>
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-700 hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="mt-0.5 block text-[11px] text-slate-400">{help}</span>
      </div>
    </div>
  );
}

export function ThemeSettingsManager({
  initialColors,
  initialFontKey,
}: {
  initialColors: Partial<Record<ColorField, string>>;
  initialFontKey: FontKey;
}) {
  // Seed each colour from the saved value or its default.
  const [colors, setColors] = useState<Record<ColorField, string>>(() => {
    const seeded = {} as Record<ColorField, string>;
    for (const c of COLOR_FIELDS) {
      seeded[c.field] = initialColors[c.field] ?? c.default;
    }
    return seeded;
  });
  const [fontKey, setFontKey] = useState<FontKey>(initialFontKey ?? DEFAULT_FONT_KEY);
  const [saving, setSaving] = useState(false);

  const activePairing =
    FONT_PAIRINGS.find((p) => p.key === fontKey) ?? FONT_PAIRINGS[0];

  function setColor(field: ColorField, v: string) {
    setColors((prev) => ({ ...prev, [field]: v }));
  }
  function resetColor(field: ColorField, def: string) {
    setColors((prev) => ({ ...prev, [field]: def }));
  }

  async function save() {
    // Build theme.colors with ONLY the fields the owner actually changed, and
    // normalize bare hex. Invalid colours are rejected before saving.
    const out: Partial<Record<ColorField, string>> = {};
    for (const c of COLOR_FIELDS) {
      let v = colors[c.field].trim();
      if (HEX_RE.test(normalizeHex(v))) v = normalizeHex(v);
      if (v.toLowerCase() === c.default.toLowerCase()) continue; // unchanged
      // Light client-side guard; the server getter sanitizes strictly too.
      const ok =
        HEX_RE.test(v) ||
        /^rgba?\(/i.test(v) ||
        /^hsla?\(/i.test(v);
      if (!ok) {
        toast.error(`"${c.label}" must be a hex (#8a4853), rgb() or hsl() colour`);
        return;
      }
      out[c.field] = v;
    }

    setSaving(true);
    try {
      const results = await Promise.all([
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: KEYS.colors, value: out }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: KEYS.font, value: fontKey }),
        }),
      ]);
      const bad = results.find((r) => !r.ok);
      if (bad) throw new Error((await bad.json()).error || "Failed to save");
      toast.success("Theme saved — refresh the storefront to see changes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    const reset = {} as Record<ColorField, string>;
    for (const c of COLOR_FIELDS) reset[c.field] = c.default;
    setColors(reset);
    setFontKey(DEFAULT_FONT_KEY);
  }

  return (
    <div className="space-y-5">
      {/* Colours */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Brand colours</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            A few high-impact tokens. Pick a colour or type a hex / rgb() / hsl()
            value. Anything left at its default is untouched on the site.
          </p>
        </div>
        <div className="space-y-4">
          {COLOR_FIELDS.map((c) => (
            <ColorRow
              key={c.field}
              label={c.label}
              help={c.help}
              value={colors[c.field]}
              defaultValue={c.default}
              onChange={(v) => setColor(c.field, v)}
              onReset={() => resetColor(c.field, c.default)}
            />
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Font pairing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a display + body font pairing for the whole site.
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">Pairing</span>
          <select
            value={fontKey}
            onChange={(e) => setFontKey(e.target.value as FontKey)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {FONT_PAIRINGS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {/* Live preview — uses web-safe fallback names in the admin; the real
            self-hosted fonts render on the storefront after saving. */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div
            style={{ fontFamily: activePairing.displayStack }}
            className="text-2xl text-slate-900"
          >
            Sirini Jewellery
          </div>
          <div
            style={{ fontFamily: activePairing.bodyStack }}
            className="mt-1 text-sm text-slate-600"
          >
            Handcrafted Kundan &amp; Meenakari — timeless pieces for every occasion.
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Note: fonts are self-hosted at build time, so all pairings are
          pre-installed and switch instantly site-wide. The preview above uses
          system fallbacks until the page reloads with the real webfonts.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={resetAll}
          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          Reset all to defaults
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
