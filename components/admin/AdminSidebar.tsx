"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Ticket,
} from "lucide-react";

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

function NavLink({ href, label, icon: Icon, exact }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm transition-colors duration-150 ${
        isActive
          ? "bg-primary/20 text-primary font-medium"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <aside className="w-60 h-screen bg-slate-900 flex flex-col shrink-0 sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="font-display text-xl text-white font-light tracking-wide">
          Sirini Admin
        </span>
        <span className="font-sans text-xs text-slate-400 block mt-0.5 tracking-wider uppercase">
          Management Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink href="/admin" label="Dashboard" icon={LayoutDashboard} exact />
        <NavLink href="/admin/orders" label="Orders" icon={ShoppingBag} />
        <NavLink href="/admin/products" label="Products" icon={Package} />
        <NavLink href="/admin/categories" label="Categories" icon={Tag} />
        <NavLink href="/admin/coupons" label="Coupons" icon={Ticket} />
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700">
        <a
          href="/"
          className="font-sans text-xs text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
        >
          <span aria-hidden="true">←</span>
          Back to Store
        </a>
      </div>
    </aside>
  );
}
