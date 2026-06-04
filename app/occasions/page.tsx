import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { OCCASIONS, getOccasionCoverImage } from "@/lib/queries/products";

export const metadata = pageMetadata(
  "Shop by Occasion",
  "Explore Sirini Jewellery by occasion — heirloom Bridal & Wedding sets and our Festive Edit of Meenakari, temple & jhumka pieces for every celebration.",
);

export default async function OccasionsPage() {
  const covers = await Promise.all(
    OCCASIONS.map((o) => getOccasionCoverImage(o.slug)),
  );

  return (
    <div className="bg-background text-on-surface">
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
      </section>

      {/* ── Occasion cards ────────────────────────────────────────── */}
      <section className="pb-24 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {OCCASIONS.map((occasion, i) => {
            const cover = covers[i];
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
