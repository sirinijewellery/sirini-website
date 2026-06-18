import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Shipping & Returns — Sirini Jewellery",
  "Free shipping across India. Easy returns within 7 days. Learn about our shipping and return policy.",
  { canonical: "/shipping" },
);

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
        Shipping &amp; Returns
      </h1>

      <div className="space-y-10 font-sans text-sm text-muted-foreground leading-relaxed">
        {/* Shipping */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-light text-foreground">Shipping Policy</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🚚", title: "Free Shipping", desc: "On all orders across India. No minimum order value." },
              { icon: "⏱️", title: "5–7 Business Days", desc: "Standard delivery time after order confirmation." },
              { icon: "📦", title: "Gift Packaging", desc: "All orders are packaged beautifully, ready to gift." },
            ].map((item) => (
              <div key={item.title} className="bg-muted/40 rounded-xl p-4 space-y-2">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="font-sans font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <p>
            Once your order is shipped, you will receive a tracking number via email. We ship across
            all major cities and towns in India through trusted courier partners.
          </p>
        </section>

        {/* Returns */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-light text-foreground">Return Policy</h2>
          <p>
            We accept returns within <strong className="text-foreground">7 days</strong> of delivery
            for items that are unused, in original condition, and in original packaging.
          </p>

          <div className="space-y-3">
            <h3 className="font-sans font-semibold text-foreground">Eligible for return:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Wrong product delivered</li>
              <li>Defective or damaged product</li>
              <li>Product significantly different from description</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-sans font-semibold text-foreground">Not eligible for return:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Items damaged due to misuse</li>
              <li>Items returned after 7 days</li>
              <li>Customised or made-to-order items</li>
            </ul>
          </div>

          <p>
            To initiate a return, email us at{" "}
            <a href="mailto:sirinijewellery@gmail.com" className="text-primary hover:underline">
              sirinijewellery@gmail.com
            </a>{" "}
            with your order ID and photos of the product. We&apos;ll arrange a pickup within 2 business days.
          </p>
        </section>

        {/* Refunds */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-light text-foreground">Refunds</h2>
          <p>
            Once your return is received and inspected, we will process your refund within{" "}
            <strong className="text-foreground">5–7 business days</strong>. Refunds are credited
            to your original payment method.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-muted/30 p-6 space-y-2">
          <h3 className="font-display text-lg text-foreground">Need help?</h3>
          <p>
            Reach us at{" "}
            <a href="mailto:sirinijewellery@gmail.com" className="text-primary hover:underline">
              sirinijewellery@gmail.com
            </a>{" "}
            or{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us here
            </a>. We&apos;re happy to help.
          </p>
        </section>
      </div>
    </div>
  );
}
