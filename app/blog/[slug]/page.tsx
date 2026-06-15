import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMetadata, siteConfig } from "@/lib/seo";
import { getAllArticles, getArticleBySlug } from "@/lib/blog";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  return pageMetadata(article.title, article.excerpt, {
    ogImage: article.coverImage,
    canonical: `${siteConfig.url}/blog/${article.slug}`,
  });
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const articleUrl = `${siteConfig.url}/blog/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage,
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    author: {
      "@type": "Organization",
      name: "Sirini Jewellery",
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: "Sirini Jewellery",
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: "https://res.cloudinary.com/dp8a2lvxg/image/upload/e_trim,q_auto,f_png,w_600/sirini-jewellery/logo-real.png",
      },
    },
  };

  return (
    <div className="bg-background text-on-surface">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Journal", url: `${siteConfig.url}/blog` },
          { name: article.title, url: articleUrl },
        ]}
      />
      {/* ── Cover hero ─────────────────────────────────────────────── */}
      <section className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-surface-container">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          preload
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </section>

      {/* ── Article body ──────────────────────────────────────────── */}
      <article className="px-6 md:px-16 py-14 md:py-20">
        <div className="max-w-2xl mx-auto">
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
              <li>
                <Link
                  href="/blog"
                  className="hover:text-primary transition-colors"
                >
                  Journal
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-on-surface" aria-current="page">
                {article.title}
              </li>
            </ol>
          </nav>

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-label-caps text-label-caps tracking-[0.2em] uppercase text-on-surface-variant/70 hover:text-primary transition-colors mb-8"
          >
            ← The Journal
          </Link>

          {/* Title block */}
          <p className="font-label-caps text-label-caps tracking-[0.2em] uppercase text-primary mb-4">
            {formatDate(article.date)} · {article.readMins} min read
          </p>
          <h1 className="font-display-lg text-[34px] md:text-[44px] leading-[1.1] text-on-surface mb-10">
            {article.title}
          </h1>

          {/* Lead excerpt */}
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-10 italic">
            {article.excerpt}
          </p>

          {/* Sections */}
          <div className="flex flex-col gap-8">
            {article.body.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="font-display text-[24px] md:text-[28px] font-light leading-[1.2] text-on-surface mb-4">
                    {section.heading}
                  </h2>
                )}
                <div className="flex flex-col gap-5">
                  {section.paragraphs.map((para, j) => (
                    <p
                      key={j}
                      className="font-body-lg text-body-lg text-on-surface-variant leading-[1.8]"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* ── Shop the Story — related internal links ───────────── */}
          {article.relatedLinks?.length ? (
            <div className="mt-16 pt-10 border-t border-on-surface/10">
              <h2 className="font-label-caps text-label-caps tracking-[0.2em] uppercase text-primary mb-5">
                Shop the Story
              </h2>
              <ul className="flex flex-wrap gap-3">
                {article.relatedLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center rounded-full border border-primary/40 px-5 py-2 font-body-md text-body-md text-primary hover:border-primary hover:bg-primary/5 transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* ── Closing CTA ──────────────────────────────────────── */}
          <div className="section-gold-rule mt-16 pt-10 border-t border-on-surface/10">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
              Find your next heirloom
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300"
            >
              Shop the collection
            </Link>
          </div>
        </div>
      </article>

      {/* Structured data — BlogPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
