import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
