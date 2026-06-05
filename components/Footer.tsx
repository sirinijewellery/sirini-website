// Server component — editorial brand footer.
// Top: large italic brand statement + gold rule.
// Below: asymmetric layout — brand column left, link columns right.

import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-surface-container">
      <div className="px-6 md:px-16 pt-20 pb-12 w-full max-w-screen-2xl mx-auto">

        {/* ── Brand statement ─────────────────────────────────────── */}
        <p className="font-display text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.01em] italic font-light text-on-surface mb-6 max-w-2xl">
          Crafted for every occasion,<br className="hidden md:block" /> worn for a lifetime.
        </p>

        {/* Gold rule — short, left-aligned */}
        <div className="w-16 h-px bg-[#C9A96E] mb-12" />

        {/* ── Asymmetric grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Brand column — takes 2/3 on desktop */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <Image
              src="https://res.cloudinary.com/dp8a2lvxg/image/upload/sirini-jewellery/logo.png"
              alt="Sirini Jewellery"
              width={500}
              height={500}
              className="h-12 w-auto object-contain self-start"
            />
            <p className="font-sans text-sm text-on-surface-variant leading-relaxed max-w-sm">
              Handcrafted Kundan, Meenakari &amp; gold-plated jewellery — made in
              Mumbai since 2015.
            </p>
            <p className="font-sans text-xs text-on-surface-variant/60 tracking-wide">
              Mumbai, Maharashtra, India
            </p>

            {/* Socials */}
            <div className="flex gap-5 mt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-on-surface-variant hover:text-primary transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="mailto:sirinijewellery@gmail.com"
                aria-label="Email"
                className="text-on-surface-variant hover:text-primary transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>

            <p className="font-sans text-xs text-on-surface-variant/50 mt-4">
              © Sirini Jewellery, Est. 2015
            </p>
          </div>

          {/* Links column — 1/3 on desktop, two sub-columns */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <h4 className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/50 font-semibold mb-1">
                Company
              </h4>
              <a href="/about" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">About</a>
              <a href="/blog" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Journal</a>
              <a href="/contact" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Contact</a>
              <a href="/privacy" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Privacy</a>
              <a href="/terms" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Terms</a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/50 font-semibold mb-1">
                Shop
              </h4>
              <a href="/shop" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">All Jewellery</a>
              <a href="/wishlist" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Wishlist</a>
              <a href="/shipping" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">Shipping</a>
              <a href="/account" className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">My Account</a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
