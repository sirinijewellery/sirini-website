// One-off: upload the new editorial hero image to Cloudinary at full resolution.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/upload-hero.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const res = await cloudinary.uploader.upload(
    process.env.HERO_SRC || "D:/Owner/Desktop/new hero.png",
    {
      // Fresh public_id (…-3) gives the asset a brand-new URL so returning
      // visitors' browsers (which cached the old hero under the previous URL)
      // fetch it fresh instead of serving stale cache. Store as png so the
      // delivered URL keeps the existing .png convention.
      public_id: process.env.HERO_PUBLIC_ID || "hero-editorial-2",
      folder: "sirini-jewellery/brand",
      format: "png",
      overwrite: true,
      invalidate: true,
      resource_type: "image",
      tags: ["hero", "brand"],
    },
  );
  console.log(JSON.stringify({
    public_id: res.public_id,
    secure_url: res.secure_url,
    width: res.width,
    height: res.height,
    bytes: res.bytes,
    format: res.format,
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
