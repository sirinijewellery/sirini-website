"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// Quick "tell me what you want to do" launcher for the admin sidebar.
const DESTINATIONS: { label: string; href: string; keywords: string }[] = [
  { label: "Dashboard", href: "/admin", keywords: "home overview" },
  { label: "Orders", href: "/admin/orders", keywords: "sales purchases" },
  { label: "Messages (contact form)", href: "/admin/messages", keywords: "messages contact enquiries inbox mail customer questions" },
  { label: "Products", href: "/admin/products", keywords: "catalog items list" },
  { label: "Add a product", href: "/admin/products/new", keywords: "new create add product" },
  { label: "Categories", href: "/admin/categories", keywords: "category image" },
  { label: "Shop (categories & filters)", href: "/admin/shop", keywords: "shop by look collection stone colour occasion category subcategory taxonomy dimension necklace earrings bangles accessories" },
  { label: "Pending tasks", href: "/admin/pending", keywords: "todo pending untagged" },
  { label: "Coupons", href: "/admin/coupons", keywords: "discount promo code" },
  { label: "Hero section", href: "/admin/hero", keywords: "banner slideshow homepage hero" },
  { label: "Header ribbon", href: "/admin/ribbons", keywords: "announcement bar ribbon" },
  { label: "Blog / Journal", href: "/admin/blog", keywords: "articles posts journal write" },
  { label: "Business details", href: "/admin/settings/business", keywords: "contact email phone whatsapp instagram address settings" },
  { label: "Homepage settings", href: "/admin/settings/homepage", keywords: "promo banner trust badges sections testimonials brand story settings" },
  { label: "Pricing & shipping", href: "/admin/settings/commerce", keywords: "gst shipping gift wrap cod price settings" },
  { label: "Products & catalog settings", href: "/admin/settings/catalog", keywords: "badges low stock sold out sort seo settings" },
  { label: "Pages & FAQ", href: "/admin/settings/content", keywords: "about privacy terms shipping faq pages settings" },
  { label: "Theme & fonts", href: "/admin/settings/theme", keywords: "colours colors fonts theme brand settings" },
  { label: "Admins", href: "/admin/admins", keywords: "users staff admin" },
  { label: "Help", href: "/admin/help", keywords: "how to guide help tell me" },
  { label: "My account", href: "/admin/account", keywords: "profile password username account" },
];

export function AdminQuickNav({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return DESTINATIONS.filter(
      (d) => d.label.toLowerCase().includes(s) || d.keywords.includes(s)
    ).slice(0, 6);
  }, [q]);

  function go(href: string) {
    setQ("");
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  return (
    <div className="relative px-3 pt-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) {
              e.preventDefault();
              go(matches[0].href);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Tell me what you want to do…"
          aria-label="Tell me what you want to do"
          className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute left-3 right-3 mt-1 z-50 rounded-lg border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
          {matches.map((m) => (
            <li key={m.href}>
              <button
                type="button"
                onMouseDown={() => go(m.href)}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer transition-colors"
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
