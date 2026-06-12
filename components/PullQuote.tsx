// Server component — editorial customer pull quote
// Breaks product-scroll rhythm with a human moment, warm editorial tone.

export function PullQuote() {
  return (
    <section className="py-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
      {/* Quote slides in from the left as it scrolls into view */}
      <div className="flex gap-6 md:gap-8 items-start max-w-3xl reveal reveal-left">
        {/* Gold vertical rule */}
        <div className="shrink-0 w-[2px] self-stretch bg-[#C9A96E] mt-1" />

        {/* Quote body */}
        <div>
          <blockquote className="font-display text-[28px] md:text-[36px] leading-[1.3] tracking-[-0.01em] text-on-surface italic font-light">
            "I wore this to my cousin's sangeet and couldn't stop receiving
            compliments — every aunty asked where I got it from."
          </blockquote>
          <p className="mt-4 font-sans text-[11px] tracking-[0.2em] uppercase text-on-surface-variant font-medium">
            — Priya M., Mumbai
          </p>
        </div>
      </div>
    </section>
  );
}
