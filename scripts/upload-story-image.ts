/**
 * Uploads story_image.png (Mumbai infographic poster) to Cloudinary.
 * Run: npx tsx --env-file=.env.local scripts/upload-story-image.ts
 */
import cloudinary from '../lib/cloudinary';
import fs from 'fs';

const LOCAL_PATH = 'D:\\Owner\\Desktop\\story_image.png';
const PUBLIC_ID = 'sirini-jewellery/brand/story-infographic';

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
  if (!fs.existsSync(LOCAL_PATH)) {
    console.error(`File not found: ${LOCAL_PATH}`);
    process.exit(1);
  }
  console.log('Uploading story_image.png...');
  const url = await upload(LOCAL_PATH, PUBLIC_ID);
  console.log(`\nUploaded successfully!`);
  console.log(`URL: ${url}`);
  console.log(`\nWith optimisation params:`);
  console.log(`https://res.cloudinary.com/dp8a2lvxg/image/upload/q_auto,f_auto,w_1400/${PUBLIC_ID}`);
}

main().catch(e => { console.error(e); process.exit(1); });
