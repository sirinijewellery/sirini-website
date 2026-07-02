import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getPrivacy } from "@/lib/queries/content";

export const metadata: Metadata = pageMetadata(
  "Privacy Policy — Sirini Jewellery",
  "How Sirini Jewellery collects, uses, and protects your personal information.",
  { canonical: "/privacy" },
);

// Render a stored plain-text body as safe structured paragraphs.
// Blank lines split paragraphs; bare email addresses become mailto links.
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

export default async function PrivacyPage() {
  const content = await getPrivacy();

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

      <div className="prose-like space-y-8 font-sans text-sm text-muted-foreground leading-relaxed">
        {content.sections.map((section, i) => (
          <section key={i} className="space-y-3">
            <h2 className="font-display text-2xl font-light text-foreground">{section.heading}</h2>
            <Body body={section.body} />
          </section>
        ))}
      </div>
    </div>
  );
}
