import Image from "next/image";

// Editorial hero: model in a gold-plated bridal set against an ornate gold
// screen. Shown in FULL (uncropped) via a split layout — image on one side,
// copy on cream on the other. Natural ratio 1312×816.
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/v1781352135/sirini-jewellery/brand/hero-editorial.png";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background reveal">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 md:items-center">

        {/* Image — full frame, never cropped (image first on mobile, right on desktop) */}
        <div className="order-1 md:order-2 relative w-full">
          <Image
            src={HERO_IMAGE_URL}
            alt="Model wearing a Sirini gold-plated bridal necklace set"
            width={1312}
            height={816}
            preload
            quality={90}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-auto object-contain animate-fade-in-scale"
          />
        </div>

        {/* Copy — cream panel (left on desktop, below image on mobile) */}
        <div className="order-2 md:order-1 px-6 md:px-16 py-12 md:py-20">
          <div className="flex flex-col gap-6 max-w-xl md:ml-auto">

            {/* Gold decorative rule */}
            <div className="w-10 h-px bg-[#C9A96E] animate-slide-up-fade" />

            {/* Eyebrow label */}
            <p className="font-label-caps text-label-caps tracking-[0.3em] text-primary uppercase animate-slide-up-fade">
              Handcrafted Since 2015
            </p>

            {/* Display headline */}
            <h1
              className="font-display-lg text-[56px] sm:text-[72px] md:text-[88px] leading-[1.05] tracking-[-0.02em] text-on-surface animate-slide-up-fade"
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
              className="w-fit inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-on-primary font-label-caps text-label-caps font-semibold transition-colors duration-300 animate-slide-up-fade cursor-pointer btn-sheen press-scale"
              style={{ animationDelay: "360ms" }}
            >
              Shop the Collection
            </a>

          </div>
        </div>

      </div>
    </section>
  );
}
