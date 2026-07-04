"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Info,
  Megaphone,
  ShieldCheck,
  LayoutList,
  BookOpen,
  Quote,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  PromoBanner,
  TrustBadge,
  TrustIconKey,
  HomeSection,
  HomeSectionKey,
  BrandStoryContent,
  PullQuoteContent,
} from "@/lib/queries/home";

// ---------------------------------------------------------------------------
// Admin manager for homepage storefront customization. Utilitarian UI matching
// BusinessDetailsManager / CommerceSettingsManager. Each group saves to its own
// home.* setting key via PATCH /api/admin/settings.
// ---------------------------------------------------------------------------

const TRUST_ICONS: { value: TrustIconKey; label: string }[] = [
  { value: "shield", label: "Shield (genuine / verified)" },
  { value: "truck", label: "Truck (shipping)" },
  { value: "exchange", label: "Exchange / return arrows" },
  { value: "lock", label: "Lock (secure payment)" },
  { value: "badge", label: "Badge check (trusted seller)" },
  { value: "gem", label: "Gem" },
  { value: "heart", label: "Heart" },
  { value: "award", label: "Award" },
  { value: "sparkles", label: "Sparkles" },
  { value: "gift", label: "Gift" },
];

// Friendly labels + descriptions for each configurable section key.
const SECTION_META: Record<HomeSectionKey, { label: string; desc: string }> = {
  categories: { label: "Shop by Category", desc: "Category cards grid (taxonomy mains)" },
  shopByOccasion: { label: "Shop by Occasion", desc: "Occasion cards (Bridal, Festive…)" },
  shopByCollection: { label: "Shop by Collection", desc: "Collection cards (curated edits)" },
  featuredProducts: { label: "Featured Products", desc: "New-arrivals rail" },
  bestsellers: { label: "Bestsellers", desc: "Most-reviewed products rail" },
  pullQuote: { label: "Pull Quote", desc: "Editorial customer quote" },
  brandStory: { label: "Brand Story", desc: "Crafted with Intention block" },
  testimonials: { label: "Testimonials", desc: "Voices of Sirini carousel" },
  instagram: { label: "Instagram Strip", desc: "Instagram highlight grid" },
  newsletter: { label: "Newsletter Signup", desc: "Email capture" },
  worldPortal: { label: "3D World Portal", desc: "Enter-the-world banner (/world)" },
  askAI: { label: "Ask AI About Us", desc: "AI concierge prompt" },
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/40";

async function patchSetting(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed");
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Failed to save");
    return false;
  }
}

function Card({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 text-slate-400">{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-1">
      <button
        onClick={onClick}
        disabled={saving}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export interface HomepageSettingsInitial {
  promo: PromoBanner;
  trustBadges: TrustBadge[];
  sections: HomeSection[];
  brandStory: BrandStoryContent;
  pullQuote: PullQuoteContent;
}

export function HomepageSettingsManager({ initial }: { initial: HomepageSettingsInitial }) {
  return (
    <div className="space-y-5">
      <PromoSection initial={initial.promo} />
      <TrustBadgesSection initial={initial.trustBadges} />
      <SectionsSection initial={initial.sections} />
      <BrandStorySection initial={initial.brandStory} />
      <PullQuoteSection initial={initial.pullQuote} />
      <AutoNotes />
    </div>
  );
}

/* ── Promo banner ──────────────────────────────────────────────── */

function PromoSection({ initial }: { initial: PromoBanner }) {
  const [v, setV] = useState<PromoBanner>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    if (await patchSetting("home.promo", v)) toast.success("Promo banner saved");
    setSaving(false);
  }

  return (
    <Card
      icon={<Megaphone className="h-4 w-4" />}
      title="Promo banner"
      hint="A thin announcement bar at the very top of the homepage. Off by default."
    >
      <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={v.enabled}
          onChange={(e) => setV({ ...v, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
        />
        <span className="text-sm font-medium text-slate-700">Show the promo banner</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-700">Banner text</span>
          <input
            type="text"
            value={v.text}
            placeholder="Free Pan-India shipping on all orders"
            onChange={(e) => setV({ ...v, text: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Button label</span>
          <input
            type="text"
            value={v.ctaLabel}
            placeholder="Shop now"
            onChange={(e) => setV({ ...v, ctaLabel: e.target.value })}
            className={inputCls}
          />
          <span className="text-[11px] text-slate-400 mt-0.5 block">Leave blank to hide the button.</span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Button link</span>
          <input
            type="text"
            value={v.ctaHref}
            placeholder="/shop"
            onChange={(e) => setV({ ...v, ctaHref: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Background colour</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(v.bg) ? v.bg : "#8a4853"}
              onChange={(e) => setV({ ...v, bg: e.target.value })}
              className="h-9 w-12 rounded border border-slate-300 cursor-pointer"
            />
            <input
              type="text"
              value={v.bg}
              placeholder="#8a4853"
              onChange={(e) => setV({ ...v, bg: e.target.value })}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-400/40"
            />
          </div>
        </label>
      </div>

      <div className="mt-3">
        <SaveButton onClick={save} saving={saving} />
      </div>
    </Card>
  );
}

/* ── Trust badges ──────────────────────────────────────────────── */

function TrustBadgesSection({ initial }: { initial: TrustBadge[] }) {
  const [badges, setBadges] = useState<TrustBadge[]>(initial);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<TrustBadge>) {
    setBadges((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function remove(i: number) {
    setBadges((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setBadges((prev) => [...prev, { icon: "shield", title: "", sub: "" }]);
  }

  async function save() {
    const clean = badges
      .map((b) => ({ icon: b.icon, title: b.title.trim(), sub: b.sub.trim() }))
      .filter((b) => b.title);
    if (clean.length === 0) {
      toast.error("Add at least one badge with a title");
      return;
    }
    setSaving(true);
    if (await patchSetting("home.trustBadges", clean)) toast.success("Trust badges saved");
    setSaving(false);
  }

  return (
    <Card
      icon={<ShieldCheck className="h-4 w-4" />}
      title="Trust badges"
      hint="The small reassurance strip under the hero. Pick an icon, a title and a sub-line for each."
    >
      <div className="space-y-3">
        {badges.map((b, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-[150px_1fr_1fr_auto] gap-2 items-start bg-slate-50 rounded-lg p-3"
          >
            <select
              value={b.icon}
              onChange={(e) => update(i, { icon: e.target.value as TrustIconKey })}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/40"
            >
              {TRUST_ICONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={b.title}
              placeholder="Title (e.g. Free Shipping)"
              onChange={(e) => update(i, { title: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
            />
            <input
              type="text"
              value={b.sub}
              placeholder="Sub-line (e.g. Pan-India on all orders)"
              onChange={(e) => update(i, { sub: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
            />
            <button
              onClick={() => remove(i)}
              aria-label="Remove badge"
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Add badge
      </button>

      <SaveButton onClick={save} saving={saving} />
    </Card>
  );
}

/* ── Section order & visibility ────────────────────────────────── */

function SectionsSection({ initial }: { initial: HomeSection[] }) {
  const [sections, setSections] = useState<HomeSection[]>(initial);
  const [saving, setSaving] = useState(false);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function toggle(i: number) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, enabled: !s.enabled } : s))
    );
  }

  async function save() {
    setSaving(true);
    if (await patchSetting("home.sections", sections))
      toast.success("Section order saved");
    setSaving(false);
  }

  return (
    <Card
      icon={<LayoutList className="h-4 w-4" />}
      title="Section order & visibility"
      hint="Drag-free reordering with the arrows. Toggle the eye to hide a section. (Hero + trust badges always stay at the top.)"
    >
      <ul className="space-y-2">
        {sections.map((s, i) => {
          const meta = SECTION_META[s.key];
          return (
            <li
              key={s.key}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                s.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-col">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  aria-label="Move down"
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    s.enabled ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {meta?.label ?? s.key}
                  {!s.enabled && (
                    <span className="ml-2 text-xs font-normal text-amber-600">(hidden)</span>
                  )}
                </p>
                {meta?.desc && <p className="text-xs text-slate-400">{meta.desc}</p>}
              </div>
              <button
                onClick={() => toggle(i)}
                aria-label={s.enabled ? "Hide section" : "Show section"}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                {s.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </li>
          );
        })}
      </ul>

      <SaveButton onClick={save} saving={saving} />
    </Card>
  );
}

/* ── Brand story ───────────────────────────────────────────────── */

function BrandStorySection({ initial }: { initial: BrandStoryContent }) {
  const [v, setV] = useState<BrandStoryContent>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    if (await patchSetting("home.brandStory", v)) toast.success("Brand story saved");
    setSaving(false);
  }

  return (
    <Card
      icon={<BookOpen className="h-4 w-4" />}
      title="Brand story"
      hint="The editorial 'Crafted with Intention' block in the warm-blush zone."
    >
      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Heading</span>
          <input
            type="text"
            value={v.heading}
            onChange={(e) => setV({ ...v, heading: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Body</span>
          <textarea
            value={v.body}
            rows={4}
            onChange={(e) => setV({ ...v, body: e.target.value })}
            className={inputCls}
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Button label</span>
            <input
              type="text"
              value={v.ctaLabel}
              onChange={(e) => setV({ ...v, ctaLabel: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Button link</span>
            <input
              type="text"
              value={v.ctaHref}
              onChange={(e) => setV({ ...v, ctaHref: e.target.value })}
              className={inputCls}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Image URL</span>
          <input
            type="text"
            value={v.image}
            onChange={(e) => setV({ ...v, image: e.target.value })}
            className={inputCls}
          />
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Paste a Cloudinary (or other) image URL.
          </span>
        </label>
      </div>
      <SaveButton onClick={save} saving={saving} />
    </Card>
  );
}

/* ── Pull quote ────────────────────────────────────────────────── */

function PullQuoteSection({ initial }: { initial: PullQuoteContent }) {
  const [v, setV] = useState<PullQuoteContent>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    if (await patchSetting("home.pullQuote", v)) toast.success("Pull quote saved");
    setSaving(false);
  }

  return (
    <Card
      icon={<Quote className="h-4 w-4" />}
      title="Pull quote"
      hint="A single editorial customer quote that breaks the product-scroll rhythm."
    >
      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Quote</span>
          <textarea
            value={v.text}
            rows={3}
            onChange={(e) => setV({ ...v, text: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Attribution</span>
          <input
            type="text"
            value={v.attribution}
            placeholder="Priya M., Mumbai"
            onChange={(e) => setV({ ...v, attribution: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>
      <SaveButton onClick={save} saving={saving} />
    </Card>
  );
}

/* ── Notes about auto-managed sections ─────────────────────────── */

function AutoNotes() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
      <div className="flex items-start gap-2.5">
        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600 space-y-1.5">
          <p>
            <span className="font-medium text-slate-800">Testimonials</span> populate
            automatically from your published reviews (newest first). If there are no
            published reviews yet, a built-in set of sample quotes shows so the section
            never looks empty.
          </p>
          <p>
            <span className="font-medium text-slate-800">Shop by Category / Occasion / Collection</span>{" "}
            cards are driven by your{" "}
            <a href="/admin/shop" className="underline hover:text-slate-900">
              Shop &amp; taxonomy
            </a>
            : the Category section shows the main category terms, and the Occasion
            and Collection sections show those groups&apos; terms — each in the order
            set there. Cards are imageless until a term gets a cover image.
          </p>
          <p>
            <span className="font-medium text-slate-800">Instagram</span> handle and follower
            label come from{" "}
            <a href="/admin/settings/business" className="underline hover:text-slate-900">
              Business details
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
