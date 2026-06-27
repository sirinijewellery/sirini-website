import { SITE_URL } from "@/lib/seo";

// /llms.txt — a concise, AI-crawler-friendly map of the site (llmstxt.org
// convention). Helps ChatGPT, Claude, Gemini, Perplexity & Google AI Overviews
// understand who Sirini is, what we sell, and which pages to cite when a user
// asks about handcrafted Indian jewellery. Plain text, regenerated per request
// so URLs always track the canonical origin.
export function GET() {
  const u = SITE_URL;

  const body = `# Sirini Jewellery

> Sirini Jewellery is a Mumbai-based brand making handcrafted Kundan, Meenakari, Polki and gold-plated fashion jewellery — necklace sets, earrings, bangles, rings and anklets. Handcrafted since 2017, with free pan-India shipping and cash on delivery.

## About

- Brand: Sirini Jewellery
- Based in: Mumbai, India
- Established: 2017
- What we make: Handcrafted fashion jewellery — Kundan, Meenakari, Polki, temple, pearl and antique-gold styles, gold-plated and made for brides, festive occasions and everyday wear.
- Audience: Women shopping for bridal, festive, party and daily-wear jewellery across India.
- Why us: Genuine materials, lightweight comfortable pieces, 7-day exchange, secure payments (UPI, cards, COD), free shipping across India.

## Key pages

- [Home](${u}/): Brand overview, featured collections and bestsellers.
- [Shop all jewellery](${u}/shop): Full catalogue with filters for category, occasion, style, collection, stone and colour.
- [Shop by Occasion](${u}/occasions): Bridal & wedding, festive, party and daily-wear edits.
- [Our Story](${u}/about): How Sirini is made, materials and craftsmanship.
- [Journal](${u}/blog): Guides on Kundan, Meenakari and Polki, styling and jewellery care.
- [FAQ](${u}/faq): Materials, sizing, care, shipping and returns.
- [Shipping](${u}/shipping): Delivery timelines, charges and coverage.
- [Contact](${u}/contact): How to reach Sirini Jewellery.

## Shop by category

- [Necklace Sets](${u}/shop?category=necklace-sets): Kundan, Polki and Meenakari necklace sets.
- [Earrings](${u}/shop?category=earrings): Jhumkas, Chandbali and studs.
- [Bangles](${u}/shop?category=bangles): Gold-plated and Meenakari bangle sets.
- [Finger Rings](${u}/shop?category=finger-rings): Adjustable Kundan and enamel statement rings.
- [Anklets](${u}/shop?category=anklets): Ghungroo payals and silver-finish anklets.

## Popular styles

- [Kundan](${u}/shop?style=kundan)
- [Meenakari](${u}/shop?style=meenakari)
- [Polki](${u}/shop?style=polki)
- [Temple](${u}/shop?style=temple)
- [Pearl](${u}/shop?style=pearl)
- [Antique Gold](${u}/shop?style=antique)

## Resources

- [Sitemap](${u}/sitemap.xml)
- [Image sitemap](${u}/image-sitemap.xml)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
