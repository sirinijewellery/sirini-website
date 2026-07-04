// Server component — "Step Inside Our World" portal to the immersive 3D
// experience (/world, a self-contained file in public/). Sits directly above
// the Ask AI section: a deliberate dark-velvet grid break on the cream page,
// styled to match the world it opens (velvet #140a0d, gold, rose, blush ivory).

import Image from "next/image";

// Real campaign photo from the production catalogue (Royal Heritage set) —
// the same photography that hangs inside the 3D gallery.
const PORTAL_IMAGE =
  "https://res.cloudinary.com/dp8a2lvxg/image/upload/v1779794742/sirini-jewellery/10ns09/10NS09-3200-Model.jpg";

export function WorldPortal() {
  return (
    <section
      className="relative overflow-hidden border-y border-[#d9b263]/25"
      style={{ backgroundColor: "#140a0d" }}
    >
      {/* Soft gold aura behind the portrait — no images, just light */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 45% 70% at 78% 45%, rgba(217,178,99,0.14), transparent 70%), radial-gradient(ellipse 30% 45% at 15% 90%, rgba(233,170,178,0.08), transparent 70%)",
        }}
      />

      <div className="relative max-w-screen-2xl mx-auto px-6 md:px-16 py-16 md:py-24 grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] items-center gap-12 md:gap-16">
        {/* ── Invitation ── */}
        <div className="reveal max-w-xl">
          <p className="font-label-caps text-label-caps uppercase tracking-[0.35em] text-[#e9aab2] mb-5 flex items-center gap-3">
            <span
              className="inline-block w-1.5 h-1.5 rotate-45 bg-[#d9b263]"
              aria-hidden="true"
            />
            Sirini · The Promise
          </p>

          <h2 className="font-headline-lg text-[34px] leading-[1.12] md:text-[46px] text-[#f9efe9]">
            Step inside our world
          </h2>

          <div
            className="w-16 h-px my-6"
            style={{
              background: "linear-gradient(90deg, #d9b263, transparent)",
            }}
            aria-hidden="true"
          />

          <p className="font-body-md text-body-md text-[#d8c4bd] leading-relaxed mb-8">
            One continuous 3D journey through the house of Sirini — the craft,
            the collections, the trousseau — following a golden thread all the
            way to a ring that asks one question.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <a
              href="/world"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#d9b263] hover:bg-[#f0ce8c] text-[#1c0f13] font-label-caps text-label-caps font-semibold uppercase transition-colors duration-300 press-scale cursor-pointer"
            >
              Enter the 3D World
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#d9b263]/70">
              Scroll to explore · best with sound on
            </p>
          </div>
        </div>

        {/* ── Portrait — the doorway ── */}
        <a
          href="/world"
          target="_blank"
          rel="noopener"
          aria-label="Enter the Sirini 3D world"
          className="reveal reveal-zoom relative block w-full max-w-[340px] md:max-w-[400px] mx-auto md:justify-self-end group cursor-pointer"
        >
          {/* Offset echo frame behind the portrait */}
          <div
            className="absolute -inset-3 translate-x-4 translate-y-4 border border-[#d9b263]/30 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative aspect-[4/5] overflow-hidden border border-[#d9b263]/60 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <Image
              src={PORTAL_IMAGE}
              alt="The Royal Heritage necklace set from the Sirini 3D gallery"
              fill
              sizes="(max-width: 768px) 340px, 400px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {/* Velvet vignette + hover invitation */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(to top, rgba(20,10,13,0.55), transparent 45%)",
              }}
            />
            <span className="absolute bottom-4 left-0 right-0 text-center font-sans text-[10px] tracking-[0.3em] uppercase text-[#f9efe9]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Enter the gallery
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}
