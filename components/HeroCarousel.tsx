"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { HeroSlideData } from "@/lib/queries/site";

// Rotating hero. Layout matches the original:
//   • Phone (< md): full uncropped-ratio image band on top, copy below on cream.
//   • PC (md+): full-screen full-bleed image, copy overlaid left over a gradient.
// Multiple active slides crossfade every `durationMs`. Per-device focal point
// (object-position) lets the owner "crop" what shows on each device; an optional
// separate mobile image is used on phones when provided.
export function HeroCarousel({
  slides,
  durationMs,
}: {
  slides: HeroSlideData[];
  durationMs: number;
}) {
  const [idx, setIdx] = useState(0);
  const multi = slides.length > 1;

  useEffect(() => {
    if (!multi) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, durationMs);
    return () => clearInterval(t);
  }, [multi, slides.length, durationMs]);

  return (
    <section className="relative w-full overflow-hidden bg-background reveal md:h-[100svh] md:min-h-[560px]">

      {/* Image stage — phone: in-flow ratio band; PC: absolute full-bleed */}
      <div className="relative w-full aspect-[1312/816] hero-glint md:absolute md:inset-0 md:aspect-auto md:h-full">
        {slides.map((s, i) => {
          const active = i === idx;
          const mobileSrc = s.mobileImageUrl || s.imageUrl;
          const cssFilter = `brightness(${s.brightness ?? 1}) contrast(${s.contrast ?? 1})`;
          return (
            <div
              key={s.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${active ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={mobileSrc}
                alt="Sirini Jewellery — handcrafted necklace set"
                fill
                preload={i === 0}
                quality={75}
                sizes="100vw"
                style={{ objectPosition: s.focalMobile, filter: cssFilter }}
                className="object-cover md:hidden hero-breathe"
              />
              <Image
                src={s.imageUrl}
                alt="Sirini Jewellery — handcrafted necklace set"
                fill
                preload={i === 0}
                quality={75}
                sizes="100vw"
                style={{ objectPosition: s.focalDesktop, filter: cssFilter }}
                className="object-cover hidden md:block hero-breathe"
              />
            </div>
          );
        })}
      </div>

      {/* Legibility scrims — PC only, opacity driven by active slide */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" style={{ opacity: slides[idx]?.overlayOpacity != null ? slides[idx].overlayOpacity / 0.4 : 1 }} />
      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />

      {/* Slide dots (only when multiple) */}
      {multi && (
        <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 md:left-16 md:translate-x-0 flex items-center gap-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className="flex items-center justify-center h-10 w-10 cursor-pointer"
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ${
                i === idx ? "w-7 bg-primary" : "w-2 bg-on-surface/30"
              }`} />
            </button>
          ))}
        </div>
      )}

      {/* Copy overlay (phone: below image; PC: overlaid, vertically centred) */}
      <div className="relative z-10 px-6 py-10 md:px-16 md:py-0 md:h-full md:flex md:items-center md:max-w-screen-2xl md:mx-auto">
        <div className="flex flex-col gap-5 md:gap-6 max-w-xl">
          <div className="w-10 h-px bg-[#C9A96E] animate-slide-up-fade" />
          <p className="font-label-caps text-label-caps tracking-[0.3em] text-primary uppercase animate-slide-up-fade">
            Handcrafted Since 2017
          </p>
          <h1
            className="font-display-lg text-[44px] sm:text-[68px] md:text-[92px] leading-[1.06] md:leading-[1.04] tracking-[-0.02em] text-on-surface animate-slide-up-fade"
            style={{ animationDelay: "100ms" }}
          >
            The Heritage<br className="hidden sm:block" /> <em style={{ fontStyle: "italic" }}>of Elegance</em>
          </h1>
          <p
            className="font-body-lg text-body-lg text-on-surface-variant max-w-sm leading-relaxed animate-slide-up-fade"
            style={{ animationDelay: "220ms" }}
          >
            Kundan, Meenakari &amp; gold-plated jewellery —<br className="hidden md:block" />
            crafted in Mumbai for every occasion.
          </p>
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
