import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/parseImages";

const INSTAGRAM_HANDLE = "sirinijewellerymanufacturerss";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}`;

// Async server component — uses the highest-priced necklace-set products
// (which carry the nicest model shots) as a stand-in Instagram feed.
export async function InstagramStrip() {
  const products = await prisma.product.findMany({
    where: { category: "necklace-sets" },
    orderBy: { price: "desc" },
    take: 12,
    select: { images: true },
  });

  // Collect one image per product: prefer the model shot, else the first image.
  const seen = new Set<string>();
  const feed: string[] = [];
  for (const p of products) {
    const imgs = parseImages(p.images);
    if (imgs.length === 0) continue;
    const pick = imgs.find((u) => /model/i.test(u)) ?? imgs[0];
    if (pick && !seen.has(pick)) {
      seen.add(pick);
      feed.push(pick);
    }
    if (feed.length >= 6) break;
  }

  if (feed.length === 0) return null;

  return (
    <section className="bg-[#FAF0EC] py-[120px] px-4 md:px-16 reveal">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[32px] md:text-[44px] font-light leading-[1.0] tracking-[-0.02em] text-on-surface gradient-title-bg hover:text-[#C9A96E] transition-colors"
          >
            @{INSTAGRAM_HANDLE}
          </a>
          <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-on-surface-variant">
            Follow us on Instagram · 1.9k followers
          </p>
        </div>

        {/* Feed grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {feed.map((src, i) => (
            <a
              key={src}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View Sirini Jewellery on Instagram`}
              className="group relative block aspect-square overflow-hidden rounded-lg ring-1 ring-[#E8D9CE]"
            >
              <Image
                src={src}
                alt={`Sirini Jewellery Instagram post ${i + 1}`}
                fill
                sizes="(max-width: 768px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Hover overlay with Instagram glyph */}
              <span
                className="absolute inset-0 flex items-center justify-center bg-[#3A2A22]/0 opacity-0 transition-all duration-300 group-hover:bg-[#3A2A22]/35 group-hover:opacity-100"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-white drop-shadow"
                >
                  <rect
                    x="2.5"
                    y="2.5"
                    width="19"
                    height="19"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C9A96E] px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.15em] text-white shadow-sm transition-all duration-300 hover:bg-[#b8975c] hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <rect
                x="2.5"
                y="2.5"
                width="19"
                height="19"
                rx="5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
            </svg>
            Follow @sirini
          </a>
        </div>
      </div>
    </section>
  );
}
