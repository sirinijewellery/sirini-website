import Image from "next/image";

// Responsive hero:
//   • Phone (< md): full, UNCROPPED image on top, copy below on cream.
//   • PC (md+):     full-screen, full-bleed image with copy overlaid left,
//                   object-cover biased toward the model so she stays framed.
// One <Image>, one <h1> — layout swaps via breakpoint classes.
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/v1781352135/sirini-jewellery/brand/hero-editorial.png";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background reveal md:h-[100svh] md:min-h-[560px]">

      {/* Image —
          phone: in-flow band at the image's own ratio (no crop)
          pc:    absolute full-bleed cover */}
      <div className="relative w-full aspect-[1312/816] hero-glint md:absolute md:inset-0 md:aspect-auto md:h-full">
        <Image
          src={HERO_IMAGE_URL}
          alt="Model wearing a Sirini gold-plated bridal necklace set"
          fill
          preload
          quality={90}
          sizes="100vw"
          className="object-cover object-[62%_center] hero-unveil"
        />
      </div>

      {/* Legibility scrims — PC only (phone copy sits below the image, not over it) */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />

      {/* Copy —
          phone: in-flow below the image (cream)
          pc:    overlaid, vertically centred on the left */}
      <div className="relative z-10 px-6 py-10 md:px-16 md:py-0 md:h-full md:flex md:items-center md:max-w-screen-2xl md:mx-auto">
        <div className="flex flex-col gap-5 md:gap-6 max-w-xl">

          {/* Gold decorative rule */}
          <div className="w-10 h-px bg-[#C9A96E] animate-slide-up-fade" />

          {/* Eyebrow label */}
          <p className="font-label-caps text-label-caps tracking-[0.3em] text-primary uppercase animate-slide-up-fade">
            Handcrafted Since 2015
          </p>

          {/* Display headline */}
          <h1
            className="font-display-lg text-[44px] sm:text-[68px] md:text-[92px] leading-[1.06] md:leading-[1.04] tracking-[-0.02em] text-on-surface animate-slide-up-fade"
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
            className="group w-fit inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-caps text-label-caps font-semibold transition-colors duration-300 animate-slide-up-fade cursor-pointer btn-sheen press-scale"
            style={{ animationDelay: "360ms" }}
          >
            Shop the Collection
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden="true">→</span>
          </a>

        </div>
      </div>
    </section>
  );
}
