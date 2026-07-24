import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL;

const DISALLOW = [
  "/admin/",
  "/api/",
  "/cart",
  "/checkout",
  "/account",
  "/wishlist",
  "/order-confirmation",
  "/login",
  "/register",
];

// AI/answer-engine crawlers explicitly allowed (same rule as "*", stated
// explicitly as a clear GEO signal). See /llms.txt for the AI-crawler brand
// summary these bots use to answer questions about Sirini Jewellery.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/image-sitemap.xml`,
    ],
  };
}
