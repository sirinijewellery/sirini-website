import cloudinary from '../lib/cloudinary';
import fs from 'fs';
import path from 'path';
async function main() {
  const buf = fs.readFileSync(path.resolve(process.cwd(), 'Logo.jpeg'));
  const url: string = await new Promise((resolve, reject) => {
    const s = cloudinary.uploader.upload_stream(
      { public_id: 'sirini-jewellery/logo-real', overwrite: true, resource_type: 'image' },
      (e, r) => (e || !r ? reject(e) : resolve(r.secure_url))
    );
    s.end(buf);
  });
  console.log('LOGO_URL:', url);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
