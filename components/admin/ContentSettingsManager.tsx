"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type {
  PageContent,
  ContentSection,
  FaqItem,
  ShippingTime,
} from "@/lib/queries/content";

// Setting keys mirror the getters in lib/queries/content.ts.
// (Inlined here so this client file never imports the server query module's
// data-access internals — only the shared types.)
const KEYS = {
  about: "content.about",
  shipping: "content.shipping",
  privacy: "content.privacy",
  terms: "content.terms",
  faq: "content.faq",
  shippingTime: "content.shippingTime",
} as const;

export interface ContentSettingsInitial {
  about: PageContent;
  shipping: PageContent;
  privacy: PageContent;
  terms: PageContent;
  faq: FaqItem[];
  shippingTime: ShippingTime;
}

type PageKey = "about" | "shipping" | "privacy" | "terms";

const TABS: { id: PageKey | "faq"; label: string }[] = [
  { id: "about", label: "About" },
  { id: "shipping", label: "Shipping & Returns" },
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "faq", label: "FAQ" },
];

async function patch(key: string, value: unknown): Promise<void> {
  const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
}

// ── Small inputs ──────────────────────────────────────────────────────────
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
      />
      {help && <span className="text-[11px] text-slate-400 mt-0.5 block">{help}</span>}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 leading-relaxed"
      />
      {help && <span className="text-[11px] text-slate-400 mt-0.5 block">{help}</span>}
    </label>
  );
}

// ── Sections editor (heading + body, add/remove/reorder) ──────────────────
function SectionsEditor({
  sections,
  onChange,
}: {
  sections: ContentSection[];
  onChange: (next: ContentSection[]) => void;
}) {
  function update(i: number, patch: Partial<ContentSection>) {
    onChange(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function add() {
    onChange([...sections, { heading: "", body: "" }]);
  }
  function remove(i: number) {
    onChange(sections.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Section {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                aria-label="Move section up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === sections.length - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                aria-label="Move section down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(i)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                aria-label="Remove section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <TextInput
            label="Heading"
            value={section.heading}
            onChange={(v) => update(i, { heading: v })}
          />
          <TextArea
            label="Body"
            value={section.body}
            rows={5}
            onChange={(v) => update(i, { body: v })}
            help="Leave a blank line between paragraphs."
          />
        </div>
      ))}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Add section
      </button>
    </div>
  );
}

// ── Page editor (title + optional intro/updated + sections) ───────────────
function PageEditor({
  pageKey,
  initial,
  withIntro,
  withUpdated,
  shippingTimeNote,
}: {
  pageKey: PageKey;
  initial: PageContent;
  withIntro?: boolean;
  withUpdated?: boolean;
  shippingTimeNote?: boolean;
}) {
  const [title, setTitle] = useState(initial.title);
  const [intro, setIntro] = useState(initial.intro ?? "");
  const [updated, setUpdated] = useState(initial.updated ?? "");
  const [sections, setSections] = useState<ContentSection[]>(initial.sections);
  const [saving, setSaving] = useState(false);

  async function save() {
    const cleanSections = sections
      .map((s) => ({ heading: s.heading.trim(), body: s.body.trim() }))
      .filter((s) => s.heading || s.body);
    if (!title.trim()) {
      toast.error("Add a page title");
      return;
    }
    if (!cleanSections.length) {
      toast.error("Add at least one section");
      return;
    }
    const value: PageContent = {
      title: title.trim(),
      sections: cleanSections,
    };
    if (withIntro) value.intro = intro.trim();
    if (withUpdated) value.updated = updated.trim();

    setSaving(true);
    try {
      await patch(KEYS[pageKey], value);
      toast.success("Saved");
      setSections(cleanSections);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <TextInput label="Page title" value={title} onChange={setTitle} />
        {withIntro && (
          <TextArea
            label="Intro"
            value={intro}
            rows={5}
            onChange={setIntro}
            help="Opening paragraphs. Leave a blank line between paragraphs."
          />
        )}
        {withUpdated && (
          <TextInput
            label="Last updated"
            value={updated}
            onChange={setUpdated}
            placeholder="e.g. June 2026"
            help="Shown under the title. Leave blank to hide."
          />
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Sections</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each section is a heading and a body. Reorder with the arrows.
          </p>
        </div>
        <SectionsEditor sections={sections} onChange={setSections} />
      </div>

      {shippingTimeNote && (
        <p className="text-xs text-slate-500">
          Delivery, refund and return time windows are set once in the{" "}
          <strong className="text-slate-700">Shipping times</strong> box below and
          appear automatically on this page.
        </p>
      )}

      <div className="flex justify-end">
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

// ── Shipping times (single source of truth) ───────────────────────────────
function ShippingTimeEditor({ initial }: { initial: ShippingTime }) {
  const [deliveryDays, setDeliveryDays] = useState(initial.deliveryDays);
  const [refundDays, setRefundDays] = useState(initial.refundDays);
  const [returnDays, setReturnDays] = useState(initial.returnDays);
  const [saving, setSaving] = useState(false);

  async function save() {
    const value: ShippingTime = {
      deliveryDays: deliveryDays.trim(),
      refundDays: refundDays.trim(),
      returnDays: returnDays.trim(),
    };
    if (!value.deliveryDays || !value.refundDays || !value.returnDays) {
      toast.error("Fill in all three windows");
      return;
    }
    setSaving(true);
    try {
      await patch(KEYS.shippingTime, value);
      toast.success("Shipping times saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Shipping times</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          One source of truth for delivery, refund and return windows — used on
          the Shipping &amp; Returns page, the Terms page and the FAQ. The word
          &ldquo;days&rdquo; is added automatically.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextInput
          label="Delivery window"
          value={deliveryDays}
          onChange={setDeliveryDays}
          placeholder="3–7"
          help="e.g. 3–7 (business days)"
        />
        <TextInput
          label="Refund window"
          value={refundDays}
          onChange={setRefundDays}
          placeholder="5–7"
          help="e.g. 5–7 (business days)"
        />
        <TextInput
          label="Return window"
          value={returnDays}
          onChange={setReturnDays}
          placeholder="7"
          help="e.g. 7 (days)"
        />
      </div>
      <div className="flex justify-end">
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

// ── FAQ editor (question + answer rows, add/remove/reorder) ───────────────
function FaqEditor({ initial }: { initial: FaqItem[] }) {
  const [items, setItems] = useState<FaqItem[]>(initial.length ? initial : [{ q: "", a: "" }]);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<FaqItem>) {
    setItems((m) => m.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function add() {
    setItems((m) => [...m, { q: "", a: "" }]);
  }
  function remove(i: number) {
    setItems((m) => (m.length === 1 ? m : m.filter((_, idx) => idx !== i)));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }

  async function save() {
    const clean = items
      .map((x) => ({ q: x.q.trim(), a: x.a.trim() }))
      .filter((x) => x.q && x.a);
    if (!clean.length) {
      toast.error("Add at least one complete question and answer");
      return;
    }
    setSaving(true);
    try {
      await patch(KEYS.faq, clean);
      toast.success("FAQ saved");
      setItems(clean);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Questions &amp; answers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            These power the FAQ page and the Google rich-results data — both read
            this single list.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Q{i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                    aria-label="Move question up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                    aria-label="Move question down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(i)}
                    disabled={items.length === 1}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                    aria-label="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <TextInput
                label="Question"
                value={item.q}
                onChange={(v) => update(i, { q: v })}
              />
              <TextArea
                label="Answer"
                value={item.a}
                rows={4}
                onChange={(v) => update(i, { a: v })}
              />
            </div>
          ))}
        </div>

        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add question
        </button>
      </div>

      <div className="flex justify-end">
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

// ── Top-level tabbed manager ──────────────────────────────────────────────
export function ContentSettingsManager({ initial }: { initial: ContentSettingsInitial }) {
  const [tab, setTab] = useState<PageKey | "faq">("about");

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "px-3 py-2 text-sm font-medium -mb-px border-b-2 cursor-pointer transition-colors",
              tab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <PageEditor pageKey="about" initial={initial.about} withIntro />
      )}

      {tab === "shipping" && (
        <div className="space-y-5">
          <PageEditor pageKey="shipping" initial={initial.shipping} shippingTimeNote />
          <ShippingTimeEditor initial={initial.shippingTime} />
        </div>
      )}

      {tab === "privacy" && (
        <PageEditor pageKey="privacy" initial={initial.privacy} withUpdated />
      )}

      {tab === "terms" && (
        <PageEditor pageKey="terms" initial={initial.terms} withUpdated shippingTimeNote />
      )}

      {tab === "faq" && <FaqEditor initial={initial.faq} />}
    </div>
  );
}
