import Image from "next/image";
import Link from "next/link";
import type { TaxonomyTermData } from "@/lib/taxonomy";

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(160deg, #fbebe3 0%, #efdfd8 100%)",
  "linear-gradient(160deg, #fff1ea 0%, #fbebe3 100%)",
  "linear-gradient(160deg, #f5e5dd 0%, #efdfd8 100%)",
];

export function SubcategoryGrid({
  parentLabel,
  subcategories,
}: {
  parentLabel: string;
  subcategories: TaxonomyTermData[];
}) {
  if (subcategories.length === 0) return null;

  return (
    <section className="mb-12">
      <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mb-6">
        Browse {parentLabel} by type
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {subcategories.map((sub) => (
          <Link
            key={sub.id}
            href={`/shop?category=${sub.slug}`}
            className="group/sub relative aspect-[4/5] overflow-hidden bg-surface-container"
          >
            {sub.coverImage ? (
              <>
                <Image
                  src={sub.coverImage}
                  alt={sub.label}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover/sub:scale-[1.06]"
                  style={
                    sub.coverFocal
                      ? { objectPosition: sub.coverFocal }
                      : undefined
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-headline-md text-[18px] md:text-[20px] text-white leading-tight">
                    {sub.label}
                  </h3>
                  <span className="font-label-caps text-[9px] tracking-[0.15em] uppercase font-semibold text-white/70 group-hover/sub:text-white transition-colors">
                    Shop{" "}
                    <span
                      className="inline-block transition-transform duration-300 ease-out group-hover/sub:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div
                className="absolute inset-0 flex flex-col justify-between p-5 transition-transform duration-700 ease-out group-hover/sub:scale-[1.03]"
                style={{
                  background:
                    PLACEHOLDER_GRADIENTS[sub.slug.charCodeAt(0) % 3],
                }}
              >
                <span
                  className="self-end font-headline-lg text-[72px] leading-none text-primary/12 select-none"
                  aria-hidden="true"
                >
                  {sub.label.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-headline-md text-[18px] md:text-[20px] text-on-surface leading-tight mb-0.5">
                    {sub.label}
                  </h3>
                  <span className="font-label-caps text-[9px] tracking-[0.15em] uppercase font-semibold text-primary/70 group-hover/sub:text-primary transition-colors">
                    Shop{" "}
                    <span
                      className="inline-block transition-transform duration-300 ease-out group-hover/sub:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
