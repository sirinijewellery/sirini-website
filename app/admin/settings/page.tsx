import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  IndianRupee,
  LayoutTemplate,
  Package,
  FileText,
  Palette,
  PanelTop,
} from "lucide-react";

export const metadata = { title: "Settings" };

// Cards link to each settings area. Add a new entry here as each area ships.
const AREAS = [
  {
    href: "/admin/settings/business",
    icon: Building2,
    title: "Business details",
    desc: "Contact email, phone, WhatsApp, Instagram, address & hours — used across the whole site.",
  },
  {
    href: "/admin/settings/homepage",
    icon: LayoutTemplate,
    title: "Homepage",
    desc: "Promo banner, trust badges, testimonials, brand story, and which homepage sections show & in what order.",
  },
  {
    href: "/admin/settings/commerce",
    icon: IndianRupee,
    title: "Pricing & shipping",
    desc: "GST rate, gift-wrap fee, free-shipping threshold, shipping fee and Cash-on-Delivery rules.",
  },
  {
    href: "/admin/settings/catalog",
    icon: Package,
    title: "Products & catalog",
    desc: "Low-stock threshold, hide sold-out items, default sort, and product badge labels & colours.",
  },
  {
    href: "/admin/settings/content",
    icon: FileText,
    title: "Pages & FAQ",
    desc: "Edit the About, Shipping, Privacy and Terms pages and the FAQ list.",
  },
  {
    href: "/admin/settings/navbar",
    icon: PanelTop,
    title: "Navbar",
    desc: "Navigation bar colours, link order, and which menu items are visible.",
  },
  {
    href: "/admin/settings/theme",
    icon: Palette,
    title: "Theme & fonts",
    desc: "Brand colours and the storefront font pairing.",
  },
];

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/settings");

  return (
    <div className="p-4 md:p-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit site-wide content and configuration. Changes apply within a couple of minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AREAS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <a.icon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{a.title}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">{a.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
