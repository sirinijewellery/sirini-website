"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { ShoppingBag, Heart, Search, Menu, User, LogOut, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { CartBadge } from "@/components/CartBadge";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-primary text-on-primary py-2 px-4 text-center text-[10px] md:text-xs font-label-caps tracking-[0.2em] uppercase">
        Heritage Opulence: Flat 10% OFF on Your First Order | Pan India Free Shipping
      </div>

      {/* Sticky header */}
      <header className="bg-background/90 backdrop-blur-md w-full top-0 sticky z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-16 py-2 max-w-screen-2xl mx-auto">

          {/* Logo */}
          <Link href="/" aria-label="Sirini Jewellery — Home">
            <Image
              src="https://res.cloudinary.com/dp8a2lvxg/image/upload/sirini-jewellery/logo.png"
              alt="Sirini Jewellery"
              width={500}
              height={500}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav — centered absolutely */}
          <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-label-caps text-sm font-semibold tracking-widest uppercase transition-colors duration-300 ${
                  pathname === link.href
                    ? "text-primary border-b border-primary/30 pb-1"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex gap-8 items-center ml-auto">
            <div className="flex gap-4 items-center">

              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <Input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jewellery…"
                    className="h-8 w-40 sm:w-52 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-primary hover:scale-[1.02] transition-all duration-300"
                    aria-label="Close search"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-primary hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="h-6 w-6" />
                </button>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="text-primary hover:scale-[1.02] transition-all duration-300"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
              </Link>

              {/* Account — desktop only */}
              <div className="hidden md:block">
                {session?.user ? (
                  <div className="relative group">
                    <button
                      className="text-primary hover:scale-[1.02] transition-all duration-300 cursor-pointer"
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
                    className="text-primary hover:scale-[1.02] transition-all duration-300"
                    aria-label="Sign in"
                  >
                    <User className="h-6 w-6" />
                  </Link>
                )}
              </div>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative text-primary hover:scale-[1.02] transition-all duration-300"
                aria-label="Cart"
              >
                <ShoppingBag className="h-6 w-6" />
                <CartBadge />
              </Link>

              {/* Mobile hamburger */}
              <Sheet>
                <SheetTrigger
                  className="md:hidden text-primary hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-background">
                  <div className="flex flex-col h-full">
                    {/* Mobile logo */}
                    <div className="py-2">
                      <Image
                        src="https://res.cloudinary.com/dp8a2lvxg/image/upload/sirini-jewellery/logo.png"
                        alt="Sirini Jewellery"
                        width={500}
                        height={500}
                        className="h-16 w-auto object-contain"
                      />
                    </div>

                    {/* Mobile nav links */}
                    <nav className="flex flex-col gap-1 mt-6">
                      {navLinks.map((link) => (
                        <SheetClose
                          key={link.href}
                          render={
                            <Link
                              href={link.href}
                              className={`py-3 px-2 font-label-caps text-label-caps font-semibold border-b border-outline-variant transition-colors ${
                                pathname === link.href
                                  ? "text-primary"
                                  : "text-on-surface-variant hover:text-primary"
                              }`}
                            >
                              {link.label}
                            </Link>
                          }
                        />
                      ))}
                    </nav>

                    {/* Mobile auth */}
                    <div className="mt-auto pb-6 flex flex-col gap-3">
                      {session?.user ? (
                        <>
                          <p className="text-sm font-label-caps text-on-surface-variant px-2">
                            Hi, {session.user.name || session.user.email}
                          </p>
                          <SheetClose
                            render={
                              <Link href="/account">
                                <Button variant="outline" className="w-full font-label-caps text-label-caps">
                                  My Account
                                </Button>
                              </Link>
                            }
                          />
                          <Button
                            variant="ghost"
                            className="w-full font-label-caps text-label-caps"
                            onClick={() => signOut({ callbackUrl: "/" })}
                          >
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <SheetClose
                            render={
                              <Link href="/login">
                                <Button className="w-full font-label-caps text-label-caps">Sign In</Button>
                              </Link>
                            }
                          />
                          <SheetClose
                            render={
                              <Link href="/register">
                                <Button variant="outline" className="w-full font-label-caps text-label-caps">
                                  Create Account
                                </Button>
                              </Link>
                            }
                          />
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
