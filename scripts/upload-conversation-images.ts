/**
 * The two images the user shared in the conversation need to be saved locally first.
 * Save them as:
 *   D:\Owner\Desktop\hero-model.jpg   (image 1 — model with necklace set, maang tikka)
 *   D:\Owner\Desktop\artisan-craft.jpg (image 2 — artisan hands setting kundan stones)
 *
 * Then run: npx tsx --env-file=.env.local scripts/upload-conversation-images.ts
 */
import cloudinary from '../lib/cloudinary';
import fs from 'fs';

const IMAGES = [
  {
    path: 'D:\\Owner\\Desktop\\hero-model.jpg',
    publicId: 'sirini-jewellery/brand/hero-model',
    label: 'Hero model',
  },
  {
    path: 'D:\\Owner\\Desktop\\artisan-craft.jpg',
    publicId: 'sirini-jewellery/brand/artisan-craft',
    label: 'Artisan craft (Our Story)',
  },
];

async function upload(localPath: string, publicId: string) {
  const buffer = fs.readFileSync(localPath);
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (err, result) => { if (err || !result) return reject(err); resolve(result.secure_url); }
    ).end(buffer);
  });
}

async function main() {
  for (const img of IMAGES) {
    if (!fs.existsSync(img.path)) {
      console.log(`MISSING: ${img.path} — save the image here first`);
      continue;
    }
    console.log(`Uploading ${img.label}…`);
    const url = await upload(img.path, img.publicId);
    console.log(`✓ ${img.label}: ${url}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
