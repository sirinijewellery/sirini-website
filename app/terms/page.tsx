import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Terms of Service — Sirini Jewellery",
  "Terms and conditions for shopping with Sirini Jewellery.",
);

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
        Terms of Service
      </h1>
      <p className="font-sans text-xs text-muted-foreground mb-10">Last updated: January 2025</p>

      <div className="space-y-8 font-sans text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Acceptance of Terms</h2>
          <p>
            By using this website and placing orders with Sirini Jewellery, you agree to these Terms
            of Service. If you disagree with any part, please do not use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Products & Pricing</h2>
          <p>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.
            We reserve the right to modify prices without prior notice. Product images are
            representative; actual colour may vary slightly due to photography and screen settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Orders & Payment</h2>
          <p>
            Orders are confirmed only after successful payment. We accept payments via Razorpay
            (credit/debit cards, UPI, net banking, and wallets). In case of payment failure,
            your order will not be processed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Shipping</h2>
          <p>
            We offer free shipping across India. Delivery typically takes 5–7 business days.
            See our{" "}
            <a href="/shipping" className="text-primary hover:underline">
              Shipping &amp; Returns
            </a>{" "}
            page for full details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Intellectual Property</h2>
          <p>
            All content on this website — including images, text, logos, and designs — is the
            property of Sirini Jewellery. You may not reproduce or distribute it without our
            explicit written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Limitation of Liability</h2>
          <p>
            Sirini Jewellery shall not be liable for any indirect, incidental, or consequential
            damages arising from the use of our products or services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of Mumbai, Maharashtra.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Contact</h2>
          <p>
            Questions about these terms? Email us at{" "}
            <a href="mailto:sirinijewellery@gmail.com" className="text-primary hover:underline">
              sirinijewellery@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
