import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Our Story — Sirini Jewellery",
  "Born in Mumbai, Sirini Jewellery blends traditional craftsmanship with modern style. Discover our story.",
);

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Hero */}
      <div className="text-center mb-16">
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-primary mb-4">Our Story</p>
        <h1 className="font-display text-5xl md:text-6xl font-light text-foreground leading-tight">
          Born from a love of jewellery
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
          Sirini Jewellery is a Mumbai-based fashion jewellery brand dedicated to creating elegant,
          accessible pieces that help every woman express her unique style.
        </p>
      </div>

      <Separator className="mb-16" />

      {/* Story sections */}
      <div className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl font-light text-foreground mb-4">
              Crafted with intention
            </h2>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              Every piece in the Sirini collection is thoughtfully designed to complement the modern Indian woman
              — versatile enough for everyday wear, special enough for celebrations. We believe jewellery is
              more than an accessory; it&apos;s a form of self-expression.
            </p>
          </div>
          <div className="aspect-square rounded-2xl bg-blush flex items-center justify-center">
            <span className="font-display text-8xl text-primary opacity-20">S</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1 aspect-square rounded-2xl bg-muted flex items-center justify-center">
            <span className="font-display text-8xl text-primary opacity-20">✦</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl font-light text-foreground mb-4">
              Quality you can feel
            </h2>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              We source only high-quality materials — from gleaming gold-tone and rose-gold plating to
              intricate Kundan, Meenakari, and oxidised silver work. Each piece is carefully finished
              to ensure it looks and feels beautiful from the first wear.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
          <h2 className="font-display text-3xl font-light text-foreground text-center mb-10">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 text-center">
            {[
              { icon: "💎", title: "Quality First", desc: "Every piece passes quality checks before it reaches you." },
              { icon: "🎁", title: "Thoughtful Gifting", desc: "Beautiful packaging — ready to give as a gift." },
              { icon: "🌸", title: "Indian Heritage", desc: "Designs rooted in India's rich jewellery tradition." },
            ].map((v) => (
              <div key={v.title} className="space-y-3">
                <span className="text-3xl">{v.icon}</span>
                <h3 className="font-display text-xl text-foreground">{v.title}</h3>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-16">
        <h2 className="font-display text-3xl font-light text-foreground mb-4">Ready to find your piece?</h2>
        <Link href="/shop">
          <Button size="lg" className="font-sans h-12 px-8">Shop the Collection</Button>
        </Link>
      </div>
    </div>
  );
}
