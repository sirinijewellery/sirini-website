import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies site-wide. No CSP here — Razorpay's checkout.js is loaded
        // dynamically at runtime and JSON-LD relies on inline <script> tags,
        // so a strict CSP needs careful allowlisting/testing before it can be
        // added safely (tracked as a manual follow-up, not done here).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // geolocation is (self), not (): components/ShippingLocationBar.tsx
          // calls navigator.geolocation and would be silently blocked by ()
          // the day it gets wired into a page. (self) still denies all
          // third-party frames.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // The immersive 3D world is a self-contained static file in public/.
        // Serve it at the clean /world URL.
        source: "/world",
        destination: "/world.html",
      },
    ];
  },
  images: {
    // All product/brand imagery lives on Cloudinary — let THEIR CDN do the
    // resizing + AVIF/WebP conversion instead of proxying full-size originals
    // through Vercel's optimizer. Dramatically smaller transfers.
    loader: "custom",
    loaderFile: "./lib/cloudinaryLoader.ts",
    // Trim the srcset width ladder. Each distinct width becomes its own
    // Cloudinary derived transformation (counts against the monthly credit
    // quota), so the 8+8 Next defaults multiplied transformations needlessly.
    // These 4 + 3 widths still cover phone → tablet → desktop → retina cleanly.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
