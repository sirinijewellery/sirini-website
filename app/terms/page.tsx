import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getTerms, getShippingTime } from "@/lib/queries/content";

export const metadata: Metadata = pageMetadata(
  "Terms of Service — Sirini Jewellery",
  "Terms and conditions for shopping with Sirini Jewellery.",
);

// Render a stored plain-text body as safe structured paragraphs.
// Blank/new lines split paragraphs; bare email addresses become mailto links.
// No raw HTML is ever rendered.
const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

function linkifyEmails(text: string) {
  return text.split(EMAIL_RE).map((part, i) =>
    EMAIL_RE.test(part) ? (
      <a key={i} href={`mailto:${part}`} className="text-primary hover:underline">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Body({ body }: { body: string }) {
  const paragraphs = body.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i}>{linkifyEmails(para)}</p>
      ))}
    </>
  );
}

export default async function TermsPage() {
  const [content, time] = await Promise.all([getTerms(), getShippingTime()]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
        {content.title}
      </h1>
      {content.updated && (
        <p className="font-sans text-xs text-muted-foreground mb-10">
          Last updated: {content.updated}
        </p>
      )}

      <div className="space-y-8 font-sans text-sm text-muted-foreground leading-relaxed">
        {content.sections.map((section, i) => {
          const isShipping = section.heading.trim().toLowerCase() === "shipping";
          return (
            <section key={i} className="space-y-3">
              <h2 className="font-display text-2xl font-light text-foreground">{section.heading}</h2>
              {isShipping ? (
                <p>
                  We offer free shipping across India. Delivery typically takes{" "}
                  {time.deliveryDays} business days. See our{" "}
                  <Link href="/shipping" className="text-primary hover:underline">
                    Shipping &amp; Returns
                  </Link>{" "}
                  page for full details.
                </p>
              ) : (
                <Body body={section.body} />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
