import Link from "next/link";

// Title is brand-free — the root layout's title.template appends the brand.
export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Shop by Occasion", href: "/occasions" },
  { label: "The Journal", href: "/blog" },
];

export default function NotFound() {
  return (
    <div className="bg-background text-on-surface">
      <section className="min-h-[70vh] flex items-center justify-center py-24 px-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-xl">
          <p className="font-label-caps text-label-caps tracking-[0.25em] text-primary uppercase mb-6">
            Error 404
          </p>

          <p className="font-display-lg text-[96px] leading-none md:text-[140px] text-[#C9A96E] mb-6">
            404
          </p>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">
            This page slipped away
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
            Let&apos;s find you something beautiful instead.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300"
            >
              Shop the Collection
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 border border-[#C9A96E] text-on-surface font-label-caps text-label-caps font-semibold hover:bg-surface-container transition-colors duration-300"
            >
              Back to Home
            </Link>
          </div>

          <nav
            aria-label="Helpful links"
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body-md text-body-md text-on-surface-variant underline-offset-4 hover:text-primary hover:underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
