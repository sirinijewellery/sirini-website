// Server component — editorial brand footer.
// Top: large italic brand statement + gold rule.
// Below: asymmetric layout — brand column left, link columns right.

import Image from "next/image";
import Link from "next/link";
import { NAV_CATEGORIES, OCCASIONS, STYLES } from "@/lib/taxonomy";
import type { BusinessDetails } from "@/lib/settings";

const COMPANY_LINKS = [
  { href: "/about", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping", label: "Shipping" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const linkClass =
  "font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200 link-sweep self-start";
const headingClass =
  "font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/50 font-semibold mb-1";

export function Footer({ business }: { business: BusinessDetails }) {
  return (
    <footer className="bg-surface-container">
      <div className="px-6 md:px-16 pt-20 pb-12 w-full max-w-screen-2xl mx-auto">

        {/* ── Brand statement ─────────────────────────────────────── */}
        <p className="font-display text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.01em] italic font-light text-on-surface mb-6 max-w-2xl reveal reveal-clip">
          Crafted for every occasion,<br className="hidden md:block" /> worn for a lifetime.
        </p>

        {/* Gold rule — short, left-aligned */}
        <div className="w-16 h-px bg-[#C9A96E] mb-12" />

        {/* ── Asymmetric grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Brand column — 1/3 on desktop */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <Image
              src="https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,e_make_transparent:20,f_png,w_400/sirini-jewellery/logo-real.png"
              alt="Sirini Jewellery"
              width={500}
              height={500}
              className="h-12 w-auto object-contain self-start"
            />
            <p className="font-sans text-sm text-on-surface-variant leading-relaxed max-w-sm">
              Handcrafted Kundan, Meenakari &amp; gold-plated jewellery — made in
              Mumbai since 2017.
            </p>
            <p className="font-sans text-xs text-on-surface-variant/60 tracking-wide">
              {business.addressLine}
            </p>

            {/* Socials */}
            <div className="flex gap-5 mt-2">
              <a
                href={business.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-on-surface-variant hover:text-primary transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={`mailto:${business.email}`}
                aria-label="Email"
                className="text-on-surface-variant hover:text-primary transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>

            <p className="font-sans text-xs text-on-surface-variant/50 mt-4">
              © Sirini Jewellery, Est. 2017
            </p>
          </div>

          {/* Links — 1/3 on desktop, SEO-friendly internal link grid */}
          <nav
            aria-label="Footer"
            className="md:col-span-2 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
          >
            <div className="flex flex-col gap-3" aria-labelledby="footer-category">
              <h4 id="footer-category" className={headingClass}>
                Shop by Category
              </h4>
              {NAV_CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} className={linkClass}>
                  {c.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3" aria-labelledby="footer-occasion">
              <h4 id="footer-occasion" className={headingClass}>
                Shop by Occasion
              </h4>
              {OCCASIONS.map((o) => (
                <Link key={o.slug} href={`/shop?occasion=${o.slug}`} className={linkClass}>
                  {o.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3" aria-labelledby="footer-material">
              <h4 id="footer-material" className={headingClass}>
                Shop by Material
              </h4>
              {STYLES.map((s) => (
                <Link key={s.slug} href={`/shop?style=${s.slug}`} className={linkClass}>
                  {s.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3" aria-labelledby="footer-company">
              <h4 id="footer-company" className={headingClass}>
                Company &amp; Help
              </h4>
              {COMPANY_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

        </div>
      </div>
    </footer>
  );
}
