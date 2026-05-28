/**
 * Uploads brand/heritage images to Cloudinary.
 * Run: npx tsx --env-file=.env.local scripts/upload-brand-images.ts
 */
import cloudinary from '../lib/cloudinary';
import fs from 'fs';
import path from 'path';

const IMAGES = [
  {
    localPath: path.join('D:\\Owner\\Desktop\\Sirini_Website', 'ABoutUSPage.png'),
    publicId: 'sirini-jewellery/brand/artisan-workshop',
    label: 'Artisan Workshop',
  },
];

async function upload(localPath: string, publicId: string) {
  const buffer = fs.readFileSync(localPath);
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function main() {
  for (const img of IMAGES) {
    if (!fs.existsSync(img.localPath)) {
      console.log(`SKIP (not found): ${img.localPath}`);
      continue;
    }
    console.log(`Uploading ${img.label}…`);
    const url = await upload(img.localPath, img.publicId);
    console.log(`✓ ${img.label}: ${url}`);
  }
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
