import { getAllArticles } from "@/lib/blog";
import { siteConfig } from "@/lib/seo";

export const dynamic = "force-static";

// Escape the five XML special characters for safe inclusion in element text.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Convert an ISO date (YYYY-MM-DD) into an RFC-822 date string for <pubDate>.
function toRfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

export async function GET() {
  const articles = getAllArticles();
  const baseUrl = siteConfig.url;
  const feedLink = `${baseUrl}/blog`;

  const items = articles
    .map((article) => {
      const url = `${baseUrl}/blog/${article.slug}`;
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRfc822(article.date)}</pubDate>
      <description>${escapeXml(article.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuildDate =
    articles.length > 0
      ? toRfc822(articles[0].date)
      : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sirini Jewellery — Journal</title>
    <link>${escapeXml(feedLink)}</link>
    <atom:link href="${escapeXml(`${baseUrl}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />
    <description>Styling guides, jewellery care tips and traditional craft stories from Sirini Jewellery.</description>
    <language>en-IN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
