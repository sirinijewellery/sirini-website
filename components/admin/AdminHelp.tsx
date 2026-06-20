"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import type { HelpTopic } from "@/lib/adminHelp";

export function AdminHelp({ topics }: { topics: HelpTopic[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  // Match a topic if EVERY word in the query appears somewhere searchable.
  const filtered = useMemo(() => {
    if (!q) return topics;
    const words = q.split(/\s+/).filter(Boolean);
    return topics.filter((t) => {
      const hay = `${t.title} ${t.keywords} ${t.group} ${t.steps.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q, topics]);

  // Group for display when not searching.
  const groups = useMemo(() => {
    const map = new Map<string, HelpTopic[]>();
    for (const t of filtered) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const isOpen = (id: string) => (q ? true : openId === id);

  function TopicCard({ t }: { t: HelpTopic }) {
    const open = isOpen(t.id);
    return (
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenId(open && !q ? null : t.id)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span className="font-medium text-slate-900 text-sm">{t.title}</span>
          {!q && (
            <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </button>
        {open && (
          <div className="px-4 pb-4 pt-1">
            <ol className="space-y-2 list-decimal list-inside marker:text-slate-400 marker:font-medium">
              {t.steps.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 leading-relaxed pl-1">{s}</li>
              ))}
            </ol>
            <Link
              href={t.href}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Take me there →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search a task — e.g. "how to add a category", "add coupon", "out of stock"'
          className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No matching guide. Try simpler words like &ldquo;product&rdquo;, &ldquo;coupon&rdquo;, &ldquo;hero&rdquo;, or &ldquo;admin&rdquo;.
        </p>
      ) : q ? (
        // Searching → flat list, steps expanded
        <div className="space-y-3">
          {filtered.map((t) => <TopicCard key={t.id} t={t} />)}
        </div>
      ) : (
        // Browsing → grouped accordion
        <div className="space-y-6">
          {groups.map(([group, items]) => (
            <div key={group} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{group}</h2>
              <div className="space-y-2">
                {items.map((t) => <TopicCard key={t.id} t={t} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
