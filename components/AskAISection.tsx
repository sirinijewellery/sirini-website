// Server component — "Ask AI about us" trust section.
// Lets shoppers ask ChatGPT / Claude / Gemini about the brand with a
// preloaded prompt. Sits at the bottom of the home page, before the footer.

const PROMPT = encodeURIComponent(
  "I'm shopping for handcrafted Indian fashion jewellery. Tell me about " +
    "Sirini Jewellery (https://sirinijewellery.com), a Mumbai-based brand " +
    "crafting Kundan, Meenakari, temple and gold-plated jewellery since 2015. " +
    "What do they sell, what makes them special, and which kinds of pieces " +
    "would you suggest from them for weddings and festive occasions?"
);

// Each assistant opens in a new tab with the prompt prefilled.
// Logos are self-hosted brand glyphs (public/ai-icons) — no runtime CDN.
const AI_TOOLS = [
  {
    name: "ChatGPT",
    href: `https://chatgpt.com/?q=${PROMPT}`,
    icon: "/ai-icons/chatgpt.svg",
  },
  {
    name: "Claude",
    href: `https://claude.ai/new?q=${PROMPT}`,
    icon: "/ai-icons/claude.svg",
  },
  {
    name: "Gemini",
    href: `https://gemini.google.com/app?q=${PROMPT}`,
    icon: "/ai-icons/gemini.svg",
  },
] as const;

export function AskAISection() {
  return (
    <section className="py-[100px] px-4 md:px-16 max-w-screen-2xl mx-auto">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5 reveal reveal-zoom">
        {/* Gold rule + heading */}
        <div className="w-10 h-px bg-[#C9A96E]" aria-hidden="true" />
        <h2 className="font-headline-lg text-headline-lg text-on-surface gradient-title-bg">
          Don&apos;t take our word for it — ask AI
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
          Curious about who we are? Ask your favourite AI assistant about
          Sirini Jewellery — the question is already typed for you.
        </p>

        {/* AI buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 reveal stagger-grid">
          {AI_TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white border border-outline-variant hover:border-primary/50 text-on-surface font-sans text-sm font-medium transition-all duration-300 card-lift press-scale cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tool.icon}
                alt={`${tool.name} logo`}
                width={18}
                height={18}
                loading="lazy"
                className="h-[18px] w-[18px] shrink-0"
              />
              Ask {tool.name}
            </a>
          ))}
        </div>

        <p className="font-sans text-[11px] text-on-surface-variant/60 mt-1">
          Opens in a new tab. ChatGPT, Claude and Gemini are trademarks of
          their respective owners.
        </p>
      </div>
    </section>
  );
}
