import cloudinary from '../lib/cloudinary';
import fs from 'fs';

async function main() {
  const buf = fs.readFileSync('D:\\Owner\\Desktop\\artisan-craft.jpg');
  const url = await new Promise<string>((res, rej) => {
    cloudinary.uploader.upload_stream(
      { public_id: 'sirini-jewellery/brand/artisan-craft', overwrite: true, quality: 'auto', fetch_format: 'auto' },
      (err, r) => err ? rej(err) : res(r!.secure_url)
    ).end(buf);
  });
  console.log('URL:', url);
}
main().catch(e => { console.error(e); process.exit(1); });
