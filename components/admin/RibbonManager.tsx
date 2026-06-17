"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export function RibbonManager({ initialMessages }: { initialMessages: string[] }) {
  const [messages, setMessages] = useState<string[]>(initialMessages.length ? initialMessages : [""]);
  const [saving, setSaving] = useState(false);

  function update(i: number, v: string) {
    setMessages((m) => m.map((x, idx) => (idx === i ? v : x)));
  }
  function add() {
    if (messages.length >= 8) { toast.error("Up to 8 messages"); return; }
    setMessages((m) => [...m, ""]);
  }
  function remove(i: number) {
    setMessages((m) => (m.length === 1 ? m : m.filter((_, idx) => idx !== i)));
  }

  async function save() {
    const clean = messages.map((s) => s.trim()).filter(Boolean);
    if (!clean.length) { toast.error("Add at least one message"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ribbonMessages: clean }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Ribbon messages saved");
      setMessages(clean);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Announcement messages</h2>
        <p className="text-xs text-slate-500 mt-0.5">These rotate across the maroon ribbon at the very top of every page.</p>
      </div>

      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-5 shrink-0">{i + 1}.</span>
            <input
              type="text"
              value={msg}
              maxLength={160}
              onChange={(e) => update(i, e.target.value)}
              placeholder="e.g. Free Pan-India Shipping on All Orders"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <button onClick={() => remove(i)} disabled={messages.length === 1} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 cursor-pointer" aria-label="Remove message">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={add} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 cursor-pointer">
          <Plus className="h-4 w-4" /> Add message
        </button>
        <button onClick={save} disabled={saving} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
