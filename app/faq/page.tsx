import Link from "next/link";
import { FAQJsonLd } from "@/components/FAQJsonLd";
import { pageMetadata, siteConfig } from "@/lib/seo";
import { getFaq } from "@/lib/queries/content";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

// Title is brand-free — the root layout's title.template appends the brand.
export const metadata = pageMetadata(
  "FAQ",
  "Answers to common questions about Sirini Jewellery — gold plating, care, shipping, returns, sizing and how to reach us.",
  { canonical: "/faq" },
);

const WHATSAPP_URL = "https://wa.me/919322222216";

export default async function FAQPage() {
  // Single source of truth — the on-page list and FAQJsonLd both read getFaq().
  const faqs = await getFaq();

  return (
    <div className="bg-background text-on-surface">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "FAQ", url: `${siteConfig.url}/faq` },
        ]}
      />

      {/* ── Heading section ───────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase mb-4">
            Help Centre
          </p>
          <div className="section-gold-rule">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Everything you need to know about Sirini Jewellery — our materials, care, shipping
            and how to get in touch.
          </p>
        </div>
      </section>

      {/* ── Accordion ─────────────────────────────────────────────── */}
      <section className="pb-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="max-w-2xl space-y-0">
          {faqs.map(({ q, a }, i) => (
            <details
              key={i}
              className="group border-b border-outline-variant py-1"
            >
              {/*
               * CSS-only open state:
               *   - summary chevron rotates via [open] attribute selector
               *   - no JS needed
               */}
              <summary
                className={[
                  "flex items-center justify-between gap-4",
                  "cursor-pointer select-none",
                  "py-5 font-body-md text-body-md font-medium text-on-surface",
                  "list-none",                  /* hide native marker */
                  "[&::-webkit-details-marker]:hidden",
                  "hover:text-primary transition-colors duration-150",
                ].join(" ")}
              >
                <span>{q}</span>
                {/* Chevron — CSS-only rotation via details[open] */}
                <span
                  aria-hidden="true"
                  className="shrink-0 w-5 h-5 text-primary transition-transform duration-200 details-open:rotate-180"
                  style={{ display: "inline-block" }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" />
                  </svg>
                </span>
              </summary>

              {/* Answer body */}
              <div className="pb-5 pr-8">
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 bg-surface-container">
        <div className="max-w-screen-2xl mx-auto text-center">
          <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase mb-4">
            Still have questions?
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
            Chat with us on WhatsApp
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-md mx-auto">
            Our team is online Monday – Saturday, 10 am to 7 pm IST. We usually
            reply within a few hours.
          </p>
          <Link
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300"
          >
            {/* WhatsApp icon */}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </Link>
        </div>
      </section>

      {/* Google FAQ rich-results structured data */}
      <FAQJsonLd />

    </div>
  );
}
