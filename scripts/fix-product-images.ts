/**
 * Re-scans the source image folders, uploads any MISSING product images to
 * Cloudinary, and rebuilds each product's `images` array in priority order:
 *   MODEL → DECORATIVE (coloured bg) → WHITE (plain).  (CPT composites excluded.)
 */
import { prisma } from '../lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config(); dotenv.config({ path: '.env.local' });
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BASE = 'D:/Online Images/Images Online';
const CAT_FOLDER: Record<string, string> = {
  'necklace-sets': 'Necklace Set', 'earrings': 'Earring', 'bangles': 'Bangles',
  'finger-rings': 'Fingering', 'anklets': 'Anklet',
};

const isImg = (f: string) => { const l = f.toLowerCase(); return (l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') || l.endsWith('.webp')) && !l.includes('cpt'); };
const isModel = (f: string) => /model/i.test(f);
const isWhite = (f: string) => /white/i.test(f) && !isModel(f);
const isNumbered = (f: string) => /-\d{1,2}\.(jpe?g|png|webp)$/i.test(f);
const rank = (f: string) => isModel(f) ? 0 : isWhite(f) ? 2 : 1; // model→deco→white
function orderFiles(files: string[]) {
  return [...files].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const na = isNumbered(a), nb = isNumbered(b);
    if (na !== nb) return na ? 1 : -1;
    return a.localeCompare(b);
  });
}
import sharp from 'sharp';
const MAX = 9_500_000; // stay under Cloudinary's 10MB free-plan limit
async function upload(filePath: string, publicId: string): Promise<string> {
  let buf = fs.readFileSync(filePath);
  if (buf.length > MAX) {
    buf = await sharp(buf).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  }
  return new Promise((res, rej) => {
    cloudinary.uploader.upload_stream(
      { public_id: publicId, folder: 'sirini-jewellery', overwrite: false, resource_type: 'image' },
      (e, r) => (e || !r ? rej(e) : res(r.secure_url))
    ).end(buf);
  });
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, sku: true, category: true, images: true } });
  let added = 0, reordered = 0, missingFolders = 0;
  for (const p of products) {
    const folder = CAT_FOLDER[p.category];
    if (!folder) continue;
    const dir = path.join(BASE, folder, p.sku);
    if (!fs.existsSync(dir)) { missingFolders++; continue; }
    const files = orderFiles(fs.readdirSync(dir).filter(isImg));
    if (files.length === 0) continue;
    const current = (Array.isArray(p.images) ? p.images : []) as string[];
    const urls: string[] = [];
    for (const f of files) {
      const base = path.basename(f, path.extname(f)).toLowerCase();
      // Precise match only (base + '.') — a loose includes(base) falsely matches
      // a main file (e.g. "x-1375") against its numbered variant ("x-1375-1").
      let url = current.find((u) => u.toLowerCase().includes('/' + base + '.'));
      if (!url) {
        try {
          url = await upload(path.join(dir, f), `${p.sku.toLowerCase()}/${path.basename(f, path.extname(f))}`);
          added++;
        } catch (e) {
          console.log(`  skip ${p.sku}/${f}: ${(e as Error).message}`);
          continue;
        }
      }
      if (!urls.includes(url)) urls.push(url);
    }
    // Only update if order/content changed
    if (JSON.stringify(urls) !== JSON.stringify(current)) {
      await prisma.product.update({ where: { id: p.id }, data: { images: urls } });
      reordered++;
    }
  }
  console.log(`Done. Uploaded ${added} missing images, reordered ${reordered} products, ${missingFolders} folders not found.`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
