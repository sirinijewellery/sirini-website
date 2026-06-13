// One-off: upload the new editorial hero image to Cloudinary at full resolution.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/upload-hero.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const res = await cloudinary.uploader.upload("D:/Owner/Desktop/new-hero.png", {
    public_id: "hero-editorial",
    folder: "sirini-jewellery/brand",
    overwrite: true,
    resource_type: "image",
    tags: ["hero", "brand"],
  });
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
