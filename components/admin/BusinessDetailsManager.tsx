"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { BusinessDetails } from "@/lib/settings";

const FIELDS: {
  group: string;
  hint?: string;
  items: { key: keyof BusinessDetails; label: string; placeholder: string; help?: string }[];
}[] = [
  {
    group: "Contact",
    hint: "Used on the contact page, footer, order emails and the floating WhatsApp button.",
    items: [
      { key: "email", label: "Email", placeholder: "sirinijewellery@gmail.com" },
      { key: "phone", label: "Phone", placeholder: "+91-9322222216", help: "Shown to search engines (with country code)." },
      { key: "whatsapp", label: "WhatsApp number", placeholder: "919322222216", help: "Digits only, with country code, no + or spaces." },
    ],
  },
  {
    group: "Social",
    hint: "Powers the homepage Instagram strip, footer icon and structured data.",
    items: [
      { key: "instagramUrl", label: "Instagram URL", placeholder: "https://www.instagram.com/yourhandle" },
      { key: "instagramHandle", label: "Instagram handle", placeholder: "yourhandle", help: "Without the @." },
      { key: "followerText", label: "Follower label", placeholder: "1.9k followers", help: "Free text shown under the handle." },
      { key: "justdialUrl", label: "JustDial URL", placeholder: "https://www.justdial.com/..." },
    ],
  },
  {
    group: "Address & hours",
    hint: "Appears in the footer and in search-engine business listings.",
    items: [
      { key: "addressLine", label: "Address line", placeholder: "Mumbai, Maharashtra, India" },
      { key: "city", label: "City", placeholder: "Mumbai" },
      { key: "region", label: "State / region", placeholder: "Maharashtra" },
      { key: "postalCode", label: "Postal code", placeholder: "400001" },
      { key: "country", label: "Country code", placeholder: "IN", help: "2-letter ISO code, e.g. IN." },
      { key: "openingHours", label: "Opening hours", placeholder: "Mo-Sa 10:00-19:00", help: "schema.org format." },
    ],
  },
];

export function BusinessDetailsManager({ initial }: { initial: BusinessDetails }) {
  const [values, setValues] = useState<BusinessDetails>(initial);
  const [saving, setSaving] = useState(false);

  function update(key: keyof BusinessDetails, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "business.details", value: values }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Business details saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {FIELDS.map((section) => (
        <div key={section.group} className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">{section.group}</h2>
            {section.hint && <p className="text-xs text-slate-500 mt-0.5">{section.hint}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.items.map((f) => (
              <label key={f.key} className="block">
                <span className="text-xs font-medium text-slate-700">{f.label}</span>
                <input
                  type="text"
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
                {f.help && <span className="text-[11px] text-slate-400 mt-0.5 block">{f.help}</span>}
              </label>
            ))}
          </div>
        </div>
      ))}

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
