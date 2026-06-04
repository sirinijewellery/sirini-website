/**
 * Uploads hero model image and about page images to Cloudinary.
 * Run: npx tsx --env-file=.env.local scripts/upload-hero-and-about.ts
 */
import cloudinary from '../lib/cloudinary';
import fs from 'fs';
import path from 'path';

const IMAGES = [
  {
    localPath: 'D:\\Owner\\Desktop\\heromodel.jpg',
    publicId: 'sirini-jewellery/brand/hero-model',
    label: 'Hero Model',
  },
  {
    localPath: 'D:\\Owner\\Desktop\\artisan-craft.jpg',
    publicId: 'sirini-jewellery/brand/artisan-craft',
    label: 'Artisan Craft',
  },
  {
    localPath: 'D:\\Owner\\Desktop\\Sirini_Website\\ABoutUSPage.png',
    publicId: 'sirini-jewellery/brand/about-hero',
    label: 'About Page Hero',
  },
];

async function upload(localPath: string, publicId: string): Promise<string> {
  const buffer = fs.readFileSync(localPath);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function main() {
  const urls: Record<string, string> = {};
  for (const img of IMAGES) {
    if (!fs.existsSync(img.localPath)) {
      console.log(`SKIP (not found): ${img.localPath}`);
      continue;
    }
    console.log(`Uploading ${img.label}…`);
    const url = await upload(img.localPath, img.publicId);
    urls[img.label] = url;
    console.log(`✓ ${img.label}: ${url}`);
  }
  console.log('\n--- URLs to paste ---');
  for (const [label, url] of Object.entries(urls)) {
    console.log(`${label}: ${url}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
