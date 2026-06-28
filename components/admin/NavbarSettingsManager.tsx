"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const SETTING_KEY = "navbar.config";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

type LinkType = "link" | "megamenu" | "occasion" | "collection";

interface NavLink {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  type: LinkType;
}

interface NavbarConfig {
  announcementBg?: string;
  announcementText?: string;
  headerBg?: string;
  accentColor?: string;
  links: NavLink[];
}

const SPECIAL_TYPES: Record<string, string> = {
  megamenu: "Shop dropdown (categories)",
  occasion: "Occasion dropdown",
  collection: "Collection dropdown",
};

const COLOR_FIELDS: {
  field: keyof Pick<NavbarConfig, "announcementBg" | "announcementText" | "headerBg" | "accentColor">;
  label: string;
  help: string;
  placeholder: string;
}[] = [
  {
    field: "announcementBg",
    label: "Announcement bar background",
    help: "The top ribbon. Default: brand primary (maroon).",
    placeholder: "#8a4853",
  },
  {
    field: "announcementText",
    label: "Announcement bar text",
    help: "Text colour on the ribbon. Default: white/cream.",
    placeholder: "#fff8f5",
  },
  {
    field: "headerBg",
    label: "Header background",
    help: "The sticky nav bar. Default: page background.",
    placeholder: "#fff8f5",
  },
  {
    field: "accentColor",
    label: "Link underline accent",
    help: "Gold underline on hover/active. Default: #C9A96E.",
    placeholder: "#C9A96E",
  },
];

function normalizeHex(v: string): string {
  const s = v.trim();
  return s.startsWith("#") ? s : `#${s}`;
}

function isValidColor(v: string): boolean {
  if (!v.trim()) return true;
  const n = normalizeHex(v);
  return HEX_RE.test(n) || /^rgba?\(/i.test(v) || /^hsla?\(/i.test(v);
}

function ColorRow({
  label,
  help,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  help: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const swatch =
    value && HEX_RE.test(value) && value.length === 7 ? value : placeholder;
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
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
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
          placeholder={placeholder}
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm text-slate-900 placeholder:text-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="mt-0.5 block text-[11px] text-slate-400">{help}</span>
      </div>
    </div>
  );
}

export function NavbarSettingsManager({
  initialConfig,
}: {
  initialConfig: NavbarConfig;
}) {
  const [colors, setColors] = useState({
    announcementBg: initialConfig.announcementBg ?? "",
    announcementText: initialConfig.announcementText ?? "",
    headerBg: initialConfig.headerBg ?? "",
    accentColor: initialConfig.accentColor ?? "",
  });
  const [links, setLinks] = useState<NavLink[]>(initialConfig.links);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const setColor = useCallback(
    (field: keyof typeof colors, v: string) =>
      setColors((prev) => ({ ...prev, [field]: v })),
    [],
  );

  const updateLink = useCallback(
    (idx: number, patch: Partial<NavLink>) =>
      setLinks((prev) =>
        prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
      ),
    [],
  );

  const moveLink = useCallback((from: number, to: number) => {
    setLinks((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const removeLink = useCallback(
    (idx: number) => setLinks((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

  const addLink = useCallback(() => {
    const id = `custom-${Date.now()}`;
    setLinks((prev) => [
      ...prev,
      { id, label: "New Link", href: "/", visible: true, type: "link" as const },
    ]);
  }, []);

  // Drag-and-drop handlers
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveLink(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => setDragIdx(null);

  async function save() {
    for (const cf of COLOR_FIELDS) {
      const v = colors[cf.field];
      if (v && !isValidColor(v)) {
        toast.error(`"${cf.label}" must be a valid hex (#rrggbb), rgb() or hsl() colour`);
        return;
      }
    }
    for (const l of links) {
      if (!l.label.trim()) {
        toast.error("Every link needs a label");
        return;
      }
      if (l.type === "link" && !l.href.trim()) {
        toast.error(`Link "${l.label}" needs a URL`);
        return;
      }
    }

    const payload: Record<string, unknown> = { links };
    for (const cf of COLOR_FIELDS) {
      const v = colors[cf.field].trim();
      if (v) {
        payload[cf.field] = HEX_RE.test(normalizeHex(v)) ? normalizeHex(v) : v;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: SETTING_KEY, value: payload }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success("Navbar saved — refresh the storefront to see changes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Colours */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Colours</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Leave blank to keep the default. Pick a colour or type a hex value.
          </p>
        </div>
        <div className="space-y-4">
          {COLOR_FIELDS.map((cf) => (
            <ColorRow
              key={cf.field}
              label={cf.label}
              help={cf.help}
              placeholder={cf.placeholder}
              value={colors[cf.field]}
              onChange={(v) => setColor(cf.field, v)}
            />
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Navigation links</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag to reorder, toggle visibility, or edit labels and URLs. Special
            dropdowns (Shop, Occasion, Collection) can be renamed or hidden but
            their URL is handled automatically.
          </p>
        </div>

        <div className="space-y-2">
          {links.map((link, idx) => {
            const isSpecial = link.type !== "link";
            return (
              <div
                key={link.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                  dragIdx === idx
                    ? "border-primary/40 bg-primary/5"
                    : "border-slate-200 bg-slate-50"
                } ${!link.visible ? "opacity-50" : ""}`}
              >
                {/* Drag handle */}
                <span className="cursor-grab text-slate-400 hover:text-slate-600 shrink-0">
                  <GripVertical className="h-4 w-4" />
                </span>

                {/* Label */}
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(idx, { label: e.target.value })}
                  className="w-36 sm:w-44 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Label"
                />

                {/* URL or type badge */}
                {isSpecial ? (
                  <span className="flex-1 min-w-0 truncate text-xs text-slate-400 italic px-1">
                    {SPECIAL_TYPES[link.type]}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => updateLink(idx, { href: e.target.value })}
                    className="flex-1 min-w-0 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="/path"
                  />
                )}

                {/* Move up/down (mobile-friendly alternative to drag) */}
                <div className="hidden sm:flex flex-col -my-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLink(idx, idx - 1)}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer p-0.5"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === links.length - 1}
                    onClick={() => moveLink(idx, idx + 1)}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer p-0.5"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() => updateLink(idx, { visible: !link.visible })}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  aria-label={link.visible ? "Hide link" : "Show link"}
                >
                  {link.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>

                {/* Delete (custom links only) */}
                {!isSpecial ? (
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="w-[26px]" />
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addLink}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add link
        </button>
      </div>

      {/* Live preview strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Preview</h2>
        {/* Announcement bar preview */}
        <div
          className="rounded-t-lg px-4 py-2 text-center text-[10px] font-semibold tracking-[0.2em] uppercase"
          style={{
            backgroundColor: colors.announcementBg || "#8a4853",
            color: colors.announcementText || "#fff8f5",
          }}
        >
          Free Pan-India Shipping on All Orders
        </div>
        {/* Nav bar preview */}
        <div
          className="rounded-b-lg border-x border-b border-slate-200 px-4 py-3 flex items-center gap-4 overflow-x-auto"
          style={{
            backgroundColor: colors.headerBg || "#fff8f5",
          }}
        >
          {links
            .filter((l) => l.visible)
            .map((l) => (
              <span
                key={l.id}
                className="text-[11px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap"
                style={{
                  borderBottom: `2px solid ${colors.accentColor || "#C9A96E"}`,
                  paddingBottom: "2px",
                  color: "#221a15",
                }}
              >
                {l.label}
                {l.type !== "link" && " ▾"}
              </span>
            ))}
        </div>
      </div>

      {/* Save / reset */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setColors({ announcementBg: "", announcementText: "", headerBg: "", accentColor: "" });
          }}
          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          Reset colours to defaults
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
