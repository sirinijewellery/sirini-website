import Image from "next/image";
import Link from "next/link";
import type { BrandStoryContent } from "@/lib/queries/home";

// Editorial brand-story block. Copy, image and CTA are owner-editable via
// admin → Settings → Homepage; the server page passes the resolved content in
// (defaults reproduce the original hardcoded values).
export function BrandStory({ content }: { content: BrandStoryContent }) {
  const hasCta = content.ctaLabel.trim() && content.ctaHref.trim();

  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Image — slides in from the left, then drifts on scroll (parallax) */}
        <div className="aspect-square bg-surface-container relative overflow-hidden border border-outline-variant/50 p-4 reveal reveal-tilt">
          <Image
            src={content.image}
            alt={content.heading}
            fill
            // scale-110 gives the parallax drift head-room so edges never show
            className="object-cover scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-parallax="0.05"
          />
        </div>

        {/* Text — slides in from the right */}
        <div className="flex flex-col gap-6 max-w-lg reveal reveal-right">
          <h2 className="font-headline-lg text-headline-lg text-on-surface gradient-title-bg w-fit">
            {content.heading}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant whitespace-pre-line">
            {content.body}
          </p>
          {hasCta && (
            <Link
              href={content.ctaHref}
              className="inline-flex items-center gap-2 font-label-caps text-label-caps font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors w-fit border-b border-primary/30 pb-1 hover:border-primary"
            >
              {content.ctaLabel} →
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
