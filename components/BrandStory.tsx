import Image from "next/image";
import Link from "next/link";

export function BrandStory() {
  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto reveal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <div className="aspect-square bg-surface-container relative overflow-hidden border border-outline-variant/50 p-4">
          <Image
            src="https://res.cloudinary.com/dp8a2lvxg/image/upload/v1779797844/sirini-jewellery/brand/artisan-workshop.jpg"
            alt="Artisan crafting jewellery"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-6 max-w-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface gradient-title-bg w-fit">
            Crafted with Intention
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Every piece of Sirini jewellery tells a story of heritage. Our master artisans employ
            centuries-old techniques, working slowly and deliberately to create heirlooms that
            transcend fleeting trends. We believe in the quiet luxury of meticulous craftsmanship.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-label-caps text-label-caps font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors w-fit border-b border-primary/30 pb-1 hover:border-primary"
          >
            Our Story →
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
