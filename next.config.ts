import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All product/brand imagery lives on Cloudinary — let THEIR CDN do the
    // resizing + AVIF/WebP conversion instead of proxying full-size originals
    // through Vercel's optimizer. Dramatically smaller transfers.
    loader: "custom",
    loaderFile: "./lib/cloudinaryLoader.ts",
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
