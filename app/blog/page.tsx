import Image from "next/image";
import Link from "next/link";
import { pageMetadata, siteConfig } from "@/lib/seo";
import { getAllArticles } from "@/lib/blog";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export const metadata = pageMetadata(
  "Journal — Styling Guides & Jewellery Care",
  "Styling guides, jewellery care tips and traditional craft explainers from Sirini Jewellery — Kundan, Meenakari, Polki, festive edits and more.",
  { canonical: "/blog" },
);

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Re-render the index at most once an hour (ISR); new posts appear without a redeploy.
export const revalidate = 3600;

export default async function BlogPage() {
  const articles = await getAllArticles();

  return (
    <div className="bg-background text-on-surface">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Journal", url: `${siteConfig.url}/blog` },
        ]}
      />
      {/* ── Heading ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 max-w-screen-2xl mx-auto">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="font-sans text-xs text-on-surface-variant mb-6"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-on-surface" aria-current="page">
              Journal
            </li>
          </ol>
        </nav>
        <div className="section-gold-rule max-w-2xl">
          <p className="font-label-caps text-label-caps tracking-[0.25em] text-primary uppercase mb-4">
            The Journal
          </p>
          <h1 className="font-display-lg text-display-lg md:text-[56px] md:leading-[1.1] text-on-surface">
            Styling Guides &amp; Jewellery Care
          </h1>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mt-6 max-w-xl">
          Stories from our atelier — how to wear Kundan on your wedding day, the
          difference between Meenakari, Kundan &amp; Polki, festive edits and
          honest care tips to keep your handcrafted pieces shining.
        </p>
      </section>

      {/* ── Article grid ──────────────────────────────────────────── */}
      <section className="pb-24 px-6 md:px-16 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                />
              </div>
              <p className="font-label-caps text-label-caps tracking-[0.2em] uppercase text-on-surface-variant/70 mt-5 mb-3">
                {formatDate(article.date)} · {article.readMins} min read
              </p>
              <h2 className="font-display text-[24px] md:text-[26px] font-light leading-[1.15] text-on-surface mb-3">
                {article.title}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4">
                {article.excerpt}
              </p>
              <span className="inline-flex items-center gap-2 font-label-caps text-label-caps tracking-[0.2em] uppercase text-primary mt-auto">
                Read more
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CollectionPage schema for blog index */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Sirini Jewellery Journal",
            description:
              "Styling guides, jewellery care tips and traditional craft explainers from Sirini Jewellery.",
            url: `${siteConfig.url}/blog`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: articles.length,
              itemListElement: articles.map((a, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${siteConfig.url}/blog/${a.slug}`,
                name: a.title,
              })),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
