import { ContactForm } from "@/components/ContactForm";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { pageMetadata, siteConfig } from "@/lib/seo";
import { getBusinessDetails } from "@/lib/queries/site";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata = pageMetadata(
  "Contact Us",
  "Get in touch with Sirini Jewellery. We're happy to help with orders, custom pieces, and bulk enquiries.",
  { canonical: "/contact" },
);

export default async function ContactPage() {
  const business = await getBusinessDetails();
  const whatsappNumber = business.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'd like to enquire about your jewellery.")}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Contact", url: `${siteConfig.url}/contact` },
        ]}
      />
      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-primary mb-3">We&apos;d love to hear from you</p>
        <h1 className="font-display text-5xl md:text-6xl font-light text-foreground">Get in Touch</h1>
        <p className="font-sans text-base text-muted-foreground mt-4 max-w-md mx-auto">
          Questions about an order, styling advice, or bulk enquiries? We&apos;re happy to help.
          Meanwhile, feel free to{" "}
          <Link href="/shop" className="text-primary underline underline-offset-2 hover:no-underline">
            browse our jewellery
          </Link>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Contact form */}
        <div>
          <h2 className="font-display text-2xl font-light text-foreground mb-6">Send us a message</h2>
          <ContactForm />
        </div>

        {/* Contact info */}
        <div className="space-y-8">
          <h2 className="font-display text-2xl font-light text-foreground">Other ways to reach us</h2>

          {/* WhatsApp */}
          {whatsappNumber && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-foreground">WhatsApp</p>
                <p className="font-sans text-sm text-muted-foreground mt-0.5">
                  Chat with us directly for quick queries
                </p>
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm font-sans font-medium text-[#25D366] hover:underline"
                >
                  Open WhatsApp chat →
                </Link>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-foreground">Email</p>
              <a
                href={`mailto:${business.email}`}
                className="font-sans text-sm text-primary hover:underline mt-0.5 inline-block"
              >
                {business.email}
              </a>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                We respond within 24–48 hours
              </p>
            </div>
          </div>

          <Separator />

          {/* FAQ snippets */}
          <div className="space-y-4">
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Common questions</p>
            {[
              { q: "Do you offer gift wrapping?", a: "Yes! Add a note at checkout and we'll wrap it beautifully." },
              { q: "Can I customise an order?", a: "Reach out on WhatsApp for customisation requests." },
              { q: "What are your shipping timelines?", a: "5–7 business days across India." },
            ].map((faq) => (
              <div key={faq.q} className="space-y-1">
                <p className="font-sans text-sm font-medium text-foreground">{faq.q}</p>
                <p className="font-sans text-xs text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ rich results for the inline Q&As */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Do you offer gift wrapping?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes! Add a note at checkout and we'll wrap it beautifully.",
                },
              },
              {
                "@type": "Question",
                name: "Can I customise an order?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Reach out on WhatsApp for customisation requests.",
                },
              },
              {
                "@type": "Question",
                name: "What are your shipping timelines?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "5–7 business days across India.",
                },
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
