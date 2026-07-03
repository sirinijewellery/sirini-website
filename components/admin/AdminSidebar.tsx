"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Ticket,
  UserCog,
  Users,
  Images,
  Megaphone,
  HelpCircle,
  Settings,
  Newspaper,
  Store,
  ClipboardList,
  Menu,
  X,
  Palette,
  Inbox,
} from "lucide-react";
import { AdminQuickNav } from "./AdminQuickNav";

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
  onNavigate?: () => void;
}

function NavLink({ href, label, icon: Icon, exact, badge, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg font-sans text-sm transition-colors duration-150 ${
        isActive
          ? "bg-primary/20 text-primary font-medium"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-[11px] font-semibold">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AdminSidebar({
  pendingCount = 0,
  messageCount = 0,
}: {
  pendingCount?: number;
  messageCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile hamburger button — fixed top-left, hidden on desktop ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-3 bg-slate-900 text-white rounded-xl shadow-lg"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed md:sticky md:relative inset-y-0 left-0 z-50
          w-60 h-dvh bg-slate-900 flex flex-col shrink-0
          transition-transform duration-300 ease-in-out md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          top-0
        `}
      >
        {/* Logo + close button */}
        <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="group"
            aria-label="Go to the live site (sirinijewellery.com)"
          >
            <span className="font-display text-xl text-white font-light tracking-wide group-hover:text-primary transition-colors">
              Sirini Admin
            </span>
            <span className="font-sans text-xs text-slate-400 block mt-0.5 tracking-wider uppercase">
              Management Panel
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-2.5 -mr-1"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick "tell me what you want to do" launcher */}
        <AdminQuickNav onNavigate={() => setMobileOpen(false)} />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" onClick={() => setMobileOpen(false)}>
          <NavLink href="/admin" label="Dashboard" icon={LayoutDashboard} exact />
          {/* Pending sits up top while there's work; drops to the bottom when empty. */}
          {pendingCount > 0 && (
            <NavLink href="/admin/pending" label="Pending" icon={ClipboardList} badge={pendingCount} />
          )}
          <NavLink href="/admin/orders" label="Orders" icon={ShoppingBag} />
          <NavLink href="/admin/messages" label="Messages" icon={Inbox} badge={messageCount} />
          <NavLink href="/admin/products" label="Products" icon={Package} />
          <NavLink href="/admin/categories" label="Categories" icon={Tag} />
          <NavLink href="/admin/shop" label="Shop" icon={Store} />
          <NavLink href="/admin/colors" label="Colors" icon={Palette} />
          <NavLink href="/admin/coupons" label="Coupons" icon={Ticket} />
          <NavLink href="/admin/hero" label="Hero Section" icon={Images} />
          <NavLink href="/admin/ribbons" label="Header Ribbon" icon={Megaphone} />
          <NavLink href="/admin/blog" label="Blog" icon={Newspaper} />
          <NavLink href="/admin/settings" label="Settings" icon={Settings} />
          <NavLink href="/admin/admins" label="Admins" icon={Users} />
          <NavLink href="/admin/help" label="Help" icon={HelpCircle} />
          <NavLink href="/admin/account" label="My Account" icon={UserCog} />
          {pendingCount === 0 && (
            <NavLink href="/admin/pending" label="Pending" icon={ClipboardList} />
          )}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <Link
            href="/"
            className="font-sans text-xs text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
          >
            <span aria-hidden="true">←</span>
            Back to Store
          </Link>
        </div>
      </aside>
    </>
  );
}
