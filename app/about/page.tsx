import Image from "next/image";
import Link from "next/link";
import { pageMetadata, siteConfig } from "@/lib/seo";
import { getAbout } from "@/lib/queries/content";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata = pageMetadata(
  "Our Story — Handcrafted Since 2017",
  "Born in Mumbai in 2017, Sirini Jewellery blends traditional craftsmanship with modern elegance. A family. A craft. A promise.",
  { canonical: "/about" },
);

// Hero: Mumbai infographic poster — the Sirini story image.
// Infographic contains text, so deliver the whole frame (no forced height crop)
// and render with object-contain so nothing critical is cut off.
const HERO_IMAGE =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,c_limit,w_1600/v1780555870/sirini-jewellery/brand/story-infographic.jpg";

// Artisan close-up — hands setting kundan stones
const ARTISAN_IMAGE =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto/v1779798780/sirini-jewellery/brand/artisan-craft.jpg";

export default async function AboutPage() {
  const content = await getAbout();
  // Story intro paragraphs (split on blank lines so the owner can keep the
  // original two-paragraph rhythm or write their own).
  const introParas = (content.intro ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  // sections[0] = "Crafted to Last" materials block; the rest fill the values strip.
  const materials = content.sections[0];
  const values = content.sections.slice(1);

  return (
    <div className="bg-background text-on-surface">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Our Story", url: `${siteConfig.url}/about` },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      {/* Portrait infographic poster: show it whole (object-contain) on a cream
          backdrop so its text is never cropped. Responsive aspect ratio keeps a
          tall frame on phones and a wider frame on larger screens. */}
      <section className="relative w-full bg-[#FAF0EC] overflow-hidden aspect-[3/4] sm:aspect-[16/10] lg:aspect-[21/9] max-h-[85vh]">
        <Image
          src={HERO_IMAGE}
          alt="The Sirini story — handcrafted in Mumbai since 2017"
          fill
          preload
          className="object-contain object-center"
          sizes="100vw"
        />
        {/* Subtle bottom gradient so the headline stays legible without hiding the poster */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#FAF0EC] via-[#FAF0EC]/70 to-transparent" />
        {/* Headline over image */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-8 sm:pb-12 lg:pb-16 max-w-screen-2xl mx-auto">
          <p className="font-label-caps text-label-caps tracking-[0.25em] text-primary mb-3 uppercase">
            Since 2017
          </p>
          <h1 className="font-display-lg text-display-lg md:text-[56px] md:leading-[1.1] text-on-surface max-w-2xl">
            A Family. A Craft. A Promise.
          </h1>
        </div>
      </section>

      {/* ── Intro ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase mb-4">
            The Story
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
            {content.title}
          </h2>
          {introParas.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-4"
                  : "font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4 last:mb-0"
              }
            >
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* ── Artisan image + Materials ──────────────────────────────── */}
      <section className="py-0 pb-24 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Artisan image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
            <Image
              src={ARTISAN_IMAGE}
              alt="Artisan crafting jewellery at the Mumbai workshop"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Materials text */}
          <div className="flex flex-col gap-6">
            <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase">
              Materials &amp; Intention
            </p>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {materials?.heading ?? "Crafted to Last"}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {materials?.body}
            </p>
            <ul className="space-y-3">
              {[
                "Ethically sourced gold & silver plating",
                "Hand-set Kundan & Meenakari stones",
                "Rigorous quality checks before dispatch",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-body-md text-body-md text-on-surface-variant">
                  <span className="text-primary mt-1">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Values strip ──────────────────────────────────────────── */}
      <section className="bg-surface-container py-20 px-6 md:px-16">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
          {values.map((v) => (
            <div key={v.heading}>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">{v.heading}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-16 text-center max-w-screen-2xl mx-auto">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
          Find your piece of heritage.
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300"
        >
          Shop the Collection
        </Link>
      </section>

    </div>
  );
}
