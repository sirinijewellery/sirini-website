import Image from "next/image";

// Full-screen editorial hero: the image fills the viewport, copy sits over it.
// Landscape source (1312×816) is object-cover'd and biased toward the model so
// she stays in frame as the crop tightens on portrait screens. A cream gradient
// on the left keeps the dark brand copy legible over the image.
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/v1781352135/sirini-jewellery/brand/hero-editorial.png";

export function HeroSection() {
  return (
    <section className="relative w-full h-[100svh] min-h-[560px] overflow-hidden bg-background reveal hero-glint">

      {/* Full-bleed image */}
      <Image
        src={HERO_IMAGE_URL}
        alt="Model wearing a Sirini gold-plated bridal necklace set"
        fill
        preload
        quality={90}
        sizes="100vw"
        className="object-cover object-[62%_center] hero-unveil"
      />

      {/* Legibility scrims — cream from the left (text panel) + a soft bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />

      {/* Copy overlay — left, vertically centred */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-16 max-w-screen-2xl mx-auto">
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
