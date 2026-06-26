"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { ShoppingBag, Heart, Search, Menu, User, LogOut, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartBadge } from "@/components/CartBadge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MegaMenu } from "@/components/MegaMenu";
import { OccasionMenu } from "@/components/OccasionMenu";
import { useCartStore } from "@/lib/store/cart";
import { categoryLabel, type TaxonomyGroupData } from "@/lib/taxonomy";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

// Links shown BEFORE the "Shop" mega-menu trigger in the desktop nav.
const navLinksLeading = [
  { href: "/", label: "Home" },
];

// Links shown AFTER the "Shop" mega-menu and "Shop by Occasion" dropdown.
const navLinksTrailing = [
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

// Flat list used by the mobile sheet (mega menu is desktop-only).
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/occasions", label: "Shop by Occasion" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const DEFAULT_ANNOUNCEMENTS = [
  "Free Pan-India Shipping on All Orders",
  "Handcrafted Since 2017 · Genuine Kundan & Meenakari",
  "Cash on Delivery Available · First Order: Flat 10% OFF",
];

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
});

// ─── Component ───────────────────────────────────────────────────────────────

export function Navbar({
  messages,
  groups,
}: {
  messages?: string[];
  groups: TaxonomyGroupData[];
}) {
  const ANNOUNCEMENTS = messages && messages.length ? messages : DEFAULT_ANNOUNCEMENTS;

  // Split the admin-managed menu taxonomy for the mobile sheet (the desktop
  // mega-menu handles its own splitting). "category" is hierarchical (MAINS +
  // sub-categories); every other showInMenu group is flat.
  const categoryGroup = groups.find((g) => g.slug === "category");
  const mobileMains = categoryGroup?.terms ?? [];
  const mobileGroups = groups.filter((g) => g.slug !== "category");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const openDrawer = useCartStore((s) => s.openDrawer);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Other state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  // Refs
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Rotating announcements
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Click-outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        if (searchOpen) closeSearch();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && searchResults[activeIndex]) {
      // Keyboard-selected item — navigate to product
      router.push(`/shop/${searchResults[activeIndex].slug}`);
      closeSearch();
      return;
    }
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  }

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        e.preventDefault();
        router.push(`/shop/${searchResults[activeIndex].slug}`);
        closeSearch();
      }
      // else: let the form submit handler run (navigates to /shop?search=...)
    } else if (e.key === "Escape") {
      closeSearch();
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Announcement bar — rotating messages + language toggle */}
      <div className="relative bg-primary text-on-primary py-2 px-12 md:px-4 text-center text-[10px] md:text-xs font-label-caps tracking-[0.2em] uppercase">
        <span className="relative block h-[1.4em]">
          {ANNOUNCEMENTS.map((msg, i) => (
            <span
              key={i}
              aria-hidden={i !== announcementIdx}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                i === announcementIdx ? "opacity-100" : "opacity-0"
              }`}
            >
              {msg}
            </span>
          ))}
        </span>
        {/* EN ⇄ हिंदी translation toggle */}
        <div className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2">
          <LanguageToggle />
        </div>
      </div>

      {/* Sticky header */}
      <header className="bg-background/90 backdrop-blur-md w-full top-0 sticky z-50">
        <div className="flex items-center gap-4 w-full px-6 md:px-16 py-2 max-w-screen-2xl mx-auto">

          {/* Logo — goes home; when already home, glides up to the hero */}
          <Link
            href="/"
            aria-label="Sirini Jewellery — Home"
            className="shrink-0"
            onClick={() => {
              if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <Image
              src="https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,e_make_transparent:20,f_png,w_400/sirini-jewellery/logo-real.png"
              alt="Sirini Jewellery"
              width={500}
              height={500}
              className="h-20 w-auto object-contain"
              preload
            />
          </Link>

          {/* Desktop nav — centered in remaining space (no overlap with logo/icons) */}
          <nav className="hidden md:flex gap-x-5 lg:gap-x-7 items-center flex-1 justify-center">
            {navLinksLeading.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative font-label-caps text-[13px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#C9A96E] after:transition-transform after:duration-200 after:origin-left ${
                  pathname === link.href
                    ? "text-primary after:scale-x-100"
                    : "text-on-surface-variant hover:text-primary after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Shop mega-menu trigger */}
            <MegaMenu groups={groups} />

            {/* Shop by Occasion dropdown trigger */}
            <OccasionMenu />

            {navLinksTrailing.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative font-label-caps text-[13px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#C9A96E] after:transition-transform after:duration-200 after:origin-left ${
                  pathname === link.href
                    ? "text-primary after:scale-x-100"
                    : "text-on-surface-variant hover:text-primary after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1">

              {/* ── Search ─────────────────────────────────────────────────── */}
              <div className="relative" ref={searchContainerRef}>
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <Input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={handleSearchInput}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search jewellery…"
                      className="h-8 w-40 sm:w-52 text-sm"
                      autoComplete="off"
                      aria-label="Search jewellery"
                      aria-autocomplete="list"
                      aria-expanded={searchResults.length > 0 || isSearching}
                      aria-activedescendant={
                        activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale"
                      aria-label="Close search"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale cursor-pointer"
                    aria-label="Search"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                )}

                {/* Search dropdown */}
                {searchOpen && (searchResults.length > 0 || isSearching) && (
                  <div
                    role="listbox"
                    aria-label="Search results"
                    className="absolute top-full right-0 mt-1 w-[320px] sm:w-[380px] bg-background border border-outline-variant shadow-lg z-50 max-h-[400px] overflow-y-auto"
                  >
                    {/* Searching spinner row */}
                    {isSearching && searchResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground font-sans">
                        Searching…
                      </div>
                    )}

                    {/* No results row — only shown when not loading */}
                    {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground font-sans">
                        No results for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}

                    {/* Result rows */}
                    {searchResults.map((result, i) => (
                      <button
                        key={result.id}
                        id={`search-result-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        type="button"
                        onClick={() => {
                          router.push(`/shop/${result.slug}`);
                          closeSearch();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 border-b border-outline-variant/40 last:border-b-0 cursor-pointer ${
                          i === activeIndex
                            ? "bg-surface-container"
                            : "hover:bg-surface-container"
                        }`}
                      >
                        {/* Thumbnail */}
                        {result.images[0] && (
                          <div className="w-10 h-10 shrink-0 overflow-hidden bg-surface-container-low border border-outline-variant/30">
                            <img
                              src={result.images[0]}
                              alt={result.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-sans text-on-surface truncate">
                            {result.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-sans">
                            {categoryLabel(result.category)}
                          </p>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-sans font-semibold text-primary shrink-0">
                          {inrFormatter.format(result.price)}
                        </span>
                      </button>
                    ))}

                    {/* "See all results" footer */}
                    {searchResults.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/shop?search=${encodeURIComponent(searchQuery)}`
                          );
                          closeSearch();
                        }}
                        className="w-full px-4 py-2.5 text-xs font-label-caps tracking-wider uppercase text-primary hover:bg-surface-container transition-colors border-t border-outline-variant cursor-pointer"
                      >
                        See all results for &ldquo;{searchQuery}&rdquo; →
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* ── /Search ────────────────────────────────────────────────── */}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
              </Link>

              {/* Account — desktop only */}
              <div className="hidden md:block">
                {session?.user ? (
                  <div className="relative group">
                    <button
                      className="inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale cursor-pointer"
                      aria-label="Account"
                    >
                      <User className="h-6 w-6" />
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 border border-outline-variant bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="px-3 py-2 border-b border-outline-variant">
                        <p className="text-sm font-label-caps text-on-surface truncate">
                          {session.user.name || session.user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-3 py-2 text-sm font-label-caps text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                        >
                          <User className="h-4 w-4" /> My Account
                        </Link>
                        {session.user.isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-label-caps text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          >
                            <Settings className="h-4 w-4" /> Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm font-label-caps text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale"
                    aria-label="Sign in"
                  >
                    <User className="h-6 w-6" />
                  </Link>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={openDrawer}
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="h-6 w-6" />
                <CartBadge />
              </button>

              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full text-primary hover:bg-surface-container transition-colors press-scale cursor-pointer"
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-background">
                  <div className="flex flex-col h-full">
                    {/* Mobile logo — now tappable, returns to the home/hero page */}
                    <div className="py-2">
                      <Link
                        href="/"
                        aria-label="Sirini Jewellery — Home"
                        onClick={() => {
                          setMobileOpen(false);
                          if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Image
                          src="https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,e_make_transparent:20,f_png,w_400/sirini-jewellery/logo-real.png"
                          alt="Sirini Jewellery"
                          width={500}
                          height={500}
                          className="h-16 w-auto object-contain"
                        />
                      </Link>
                    </div>

                    {/* Mobile nav links — onClick closes the sheet */}
                    <nav className="flex flex-col gap-1 mt-6 overflow-y-auto">
                      {navLinks.map((link) =>
                        link.href === "/shop" ? (
                          <div
                            key={link.href}
                            className="border-b border-outline-variant"
                          >
                            <Link
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block py-3 px-2 font-label-caps text-label-caps font-semibold transition-colors ${
                                pathname === link.href
                                  ? "text-primary"
                                  : "text-on-surface-variant hover:text-primary"
                              }`}
                            >
                              {link.label}
                            </Link>

                            {/* Compact grouped shop links — data-driven from taxonomy */}
                            <div className="pb-3 pl-4 flex flex-col gap-3">
                              {/* Category (MAINS + sub-categories) */}
                              {mobileMains.length > 0 && (
                                <div>
                                  <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#C9A96E] mb-1.5">
                                    Category
                                  </p>
                                  <div className="flex flex-col">
                                    {mobileMains.map((main) => (
                                      <div key={main.id}>
                                        <Link
                                          href={`/shop?category=${main.slug}`}
                                          onClick={() => setMobileOpen(false)}
                                          className="block py-2 text-sm font-sans text-on-surface-variant hover:text-primary transition-colors"
                                        >
                                          {main.label}
                                        </Link>
                                        {main.children.length > 0 && (
                                          <div className="flex flex-col pl-3">
                                            {main.children.map((sub) => (
                                              <Link
                                                key={sub.id}
                                                href={`/shop?category=${sub.slug}`}
                                                onClick={() => setMobileOpen(false)}
                                                className="block py-1.5 text-sm font-sans text-muted-foreground hover:text-primary transition-colors"
                                              >
                                                {sub.label}
                                              </Link>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* One block per other showInMenu group (Occasion, Collection, …) */}
                              {mobileGroups.map((group) => (
                                <div key={group.id}>
                                  <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-[#C9A96E] mb-1.5">
                                    {group.label}
                                  </p>
                                  <div className="flex flex-col">
                                    {group.terms.map((term) => (
                                      <Link
                                        key={term.id}
                                        href={`/shop?${group.slug}=${term.slug}`}
                                        onClick={() => setMobileOpen(false)}
                                        className="block py-2 text-sm font-sans text-on-surface-variant hover:text-primary transition-colors"
                                      >
                                        {term.label}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ))}

                            </div>
                          </div>
                        ) : link.href === "/occasions" ? (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`py-3 px-2 font-label-caps text-label-caps font-semibold border-b border-outline-variant transition-colors flex items-center gap-1.5 ${
                              pathname.startsWith("/occasions")
                                ? "text-primary"
                                : "text-primary/80 hover:text-primary"
                            }`}
                          >
                            <span className="text-[#C9A96E] text-xs leading-none">✦</span>
                            {link.label}
                          </Link>
                        ) : (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`py-3 px-2 font-label-caps text-label-caps font-semibold border-b border-outline-variant transition-colors ${
                              pathname === link.href
                                ? "text-primary"
                                : "text-on-surface-variant hover:text-primary"
                            }`}
                          >
                            {link.label}
                          </Link>
                        )
                      )}
                    </nav>

                    {/* Mobile auth */}
                    <div className="mt-auto pb-6 flex flex-col gap-3">
                      {session?.user ? (
                        <>
                          <p className="text-sm font-label-caps text-on-surface-variant px-2">
                            Hi, {session.user.name || session.user.email}
                          </p>
                          <Link href="/account" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="w-full font-label-caps text-label-caps">
                              My Account
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            className="w-full font-label-caps text-label-caps"
                            onClick={() => {
                              setMobileOpen(false);
                              signOut({ callbackUrl: "/" });
                            }}
                          >
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" onClick={() => setMobileOpen(false)}>
                            <Button className="w-full font-label-caps text-label-caps">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/register" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="w-full font-label-caps text-label-caps">
                              Create Account
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

            </div>
          </div>
        </div>
      </header>
    </>
  );
}
