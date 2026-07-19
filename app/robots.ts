import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/checkout",
          "/account",
          "/wishlist",
          "/order-confirmation",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/image-sitemap.xml`,
    ],
  };
}
