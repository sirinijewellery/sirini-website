// Server component — no "use client"
// Editorial flat-lay hero: jewellery set on blush pink fabric.
// c_pad fills the landscape frame by extending the pink background to the sides —
// keeping the full jewellery arrangement intact with no cropping.
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/w_1920,h_900,c_pad,b_rgb:F8D5CF,g_center/v1779954722/sirini-jewellery/brand/hero-flatlay.jpg";

export function HeroSection() {
  return (
    <section className="relative w-full h-[680px] min-h-[520px] overflow-hidden reveal">

      {/* Full-bleed background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
      >
        {/* Left-to-right gradient — gives text a clean dark panel on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        {/* Bottom fade for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </div>

      {/* Hero content — left aligned */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-6 max-w-xl">

          {/* Gold decorative rule */}
          <div className="w-10 h-px bg-[#C9A96E] animate-slide-up-fade" />

          {/* Eyebrow label */}
          <p className="font-label-caps text-label-caps tracking-[0.3em] text-primary uppercase animate-slide-up-fade">
            Handcrafted Since 2015
          </p>

          {/* Display headline */}
          <h1
            className="font-display-lg text-[56px] sm:text-[72px] md:text-[96px] leading-[1.05] tracking-[-0.02em] text-on-surface animate-slide-up-fade"
            style={{ animationDelay: "100ms" }}
          >
            The Heritage<br className="hidden sm:block" /> <em style={{ fontStyle: "italic" }}>of Elegance</em>
          </h1>

          {/* Subtitle */}
          <p
            className="font-body-lg text-body-lg text-on-surface-variant max-w-sm leading-relaxed animate-slide-up-fade"
            style={{ animationDelay: "220ms" }}
          >
            Kundan, Meenakari &amp; gold-plated jewellery —<br className="hidden md:block" />
            crafted in Mumbai for every occasion.
          </p>

          {/* CTA */}
          <a
            href="/shop"
            className="w-fit inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-caps text-label-caps font-semibold transition-colors duration-300 animate-slide-up-fade cursor-pointer"
            style={{ animationDelay: "360ms" }}
          >
            Shop the Collection
          </a>

        </div>
      </div>
    </section>
  );
}
