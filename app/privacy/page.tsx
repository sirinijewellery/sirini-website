import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Privacy Policy — Sirini Jewellery",
  "How Sirini Jewellery collects, uses, and protects your personal information.",
);

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
        Privacy Policy
      </h1>
      <p className="font-sans text-xs text-muted-foreground mb-10">Last updated: January 2025</p>

      <div className="prose-like space-y-8 font-sans text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Information We Collect</h2>
          <p>
            We collect information you provide directly — such as your name, email address, phone number,
            and shipping address — when you create an account, place an order, or contact us.
          </p>
          <p>
            We also collect usage data automatically, including your device type, browser, pages visited,
            and interactions on our site, to improve your experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To process and fulfil your orders</li>
            <li>To communicate about your purchases and account</li>
            <li>To send promotional emails (with your consent)</li>
            <li>To improve our website and product offerings</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Payment Security</h2>
          <p>
            All payments are processed securely through Razorpay. We do not store your card details.
            Razorpay is PCI-DSS compliant and encrypts all payment data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share it with trusted service providers
            (shipping partners, payment processors) strictly to fulfil your orders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data at any time
            by emailing us at{" "}
            <a href="mailto:sirinijewellery@gmail.com" className="text-primary hover:underline">
              sirinijewellery@gmail.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Contact</h2>
          <p>
            For privacy-related queries, please reach out to us at{" "}
            <a href="mailto:sirinijewellery@gmail.com" className="text-primary hover:underline">
              sirinijewellery@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
