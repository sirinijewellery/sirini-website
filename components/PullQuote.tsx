import type { PullQuoteContent } from "@/lib/queries/home";

// Editorial customer pull quote — breaks product-scroll rhythm with a human
// moment. Text + attribution are owner-editable via admin → Settings → Homepage;
// the server page passes the resolved content in (defaults = original copy).

export function PullQuote({ content }: { content: PullQuoteContent }) {
  if (!content.text.trim()) return null;

  return (
    <section className="py-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
      {/* Quote slides in from the left as it scrolls into view */}
      <div className="flex gap-6 md:gap-8 items-start max-w-3xl reveal reveal-left">
        {/* Gold vertical rule */}
        <div className="shrink-0 w-[2px] self-stretch bg-[#C9A96E] mt-1" />

        {/* Quote body */}
        <div>
          <blockquote className="font-display text-[28px] md:text-[36px] leading-[1.3] tracking-[-0.01em] text-on-surface italic font-light">
            &ldquo;{content.text}&rdquo;
          </blockquote>
          {content.attribution.trim() && (
            <p className="mt-4 font-sans text-[11px] tracking-[0.2em] uppercase text-on-surface-variant font-medium">
              — {content.attribution}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
