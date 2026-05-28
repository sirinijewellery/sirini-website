import cloudinary from '../lib/cloudinary';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('D:\\Owner\\Desktop\\hero-flatlay.jpg');
  const url = await new Promise<string>((res, rej) => {
    cloudinary.uploader.upload_stream(
      {
        public_id: 'sirini-jewellery/brand/hero-flatlay',
        overwrite: true,
        resource_type: 'image',
        tags: ['hero', 'flatlay'],
      },
      (err, r) => (err ? rej(err) : res(r!.secure_url))
    ).end(buf);
  });
  console.log('✓ Uploaded:', url);
}

main().catch((e) => { console.error(e); process.exit(1); });
