import Image from "next/image";
import Link from "next/link";
import { pageMetadata, siteConfig } from "@/lib/seo";
import { OCCASIONS, getOccasionCovers } from "@/lib/queries/products";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata = pageMetadata(
  "Shop by Occasion",
  "Explore Sirini Jewellery by occasion — heirloom Bridal & Wedding sets and our Festive Edit of Meenakari, temple & jhumka pieces for every celebration.",
  { canonical: "/occasions" },
);

export default async function OccasionsPage() {
  const coverMap = await getOccasionCovers();

  return (
    <div className="bg-background text-on-surface">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Shop by Occasion", url: `${siteConfig.url}/occasions` },
        ]}
      />
      {/* ── Heading ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="section-gold-rule max-w-2xl">
          <p className="font-label-caps text-label-caps tracking-[0.25em] text-primary uppercase mb-4">
            Shop by Occasion
          </p>
          <h1 className="font-display-lg text-display-lg md:text-[56px] md:leading-[1.1] text-on-surface">
            Jewellery for Every Celebration
          </h1>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mt-6 max-w-xl">
          From the heirloom sets that crown a wedding day to the festive pieces that
          light up every celebration — find the perfect adornment for your moment.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-4 max-w-2xl">
          Shopping handcrafted jewellery by occasion makes it easy to find exactly
          what your moment calls for — bridal Kundan sets for your wedding, vibrant
          Meenakari pieces for the festive season, statement designs for parties and
          delicate gold-plated jewellery for everyday wear. Every piece is crafted by
          our artisans in Mumbai, so you adorn each celebration with the same care
          that goes into making it.
        </p>
      </section>

      {/* ── Occasion cards ────────────────────────────────────────── */}
      <section className="pb-24 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {OCCASIONS.map((occasion) => {
            const cover = coverMap[occasion.slug];
            return (
              <Link
                key={occasion.slug}
                href={`/shop?occasion=${occasion.slug}`}
                className="group relative block overflow-hidden bg-surface-container"
              >
                <div className="relative aspect-[4/5] md:aspect-[3/4] w-full overflow-hidden">
                  {cover && (
                    <Image
                      src={cover}
                      alt={occasion.label}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width:768px) 100vw, 50vw"
                    />
                  )}
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Overlaid text */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                    <h2 className="font-display text-[32px] md:text-[40px] font-light leading-[1.05] text-white mb-3">
                      {occasion.label}
                    </h2>
                    <p className="font-body-md text-body-md text-white/85 max-w-sm mb-4">
                      {occasion.blurb}
                    </p>
                    <span className="inline-flex items-center gap-2 font-label-caps text-label-caps tracking-[0.2em] uppercase text-white">
                      Explore
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── SEO content block ─────────────────────────────────────── */}
      <section className="pb-8 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="max-w-3xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
            Find the Perfect Jewellery for Every Occasion
          </h2>
          <div className="flex flex-col gap-5">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              <span className="text-on-surface font-medium">Bridal &amp; wedding jewellery.</span>{" "}
              Our handcrafted Kundan and Polki bridal sets are designed to be the
              centrepiece of your big day — layered haars, matching jhumkas and maang
              tikkas finished with delicate Meenakari enamel. Each set is crafted to
              photograph beautifully and become the heirloom you pass on.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              <span className="text-on-surface font-medium">Festive edit.</span> From
              Navratri garba nights to Diwali dinners, our festive collection brings
              together vibrant Meenakari pieces, oxidised designs and gold-plated
              jhumkas and chokers that move with you. Mix and match a few versatile
              pieces to create a fresh look for every celebration of the season.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              <span className="text-on-surface font-medium">Party &amp; daily wear.</span>{" "}
              For evenings out, statement earrings and contemporary gold-plated
              necklaces elevate any outfit, while lightweight studs, slim bangles and
              everyday rings are made to be worn again and again. Whatever the
              occasion, every piece is handcrafted in Mumbai with lasting quality.
            </p>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-16 text-center max-w-screen-2xl mx-auto">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
          Not sure where to begin?
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300"
        >
          View all jewellery
        </Link>
      </section>
    </div>
  );
}
