/**
 * upload-10lg277-variants.ts
 *
 * Targeted upload of the Mint & Pink colour variants of 10LG277 (the Green
 * variant already exists in the DB as SKU "10LG277"). These two were skipped in
 * an earlier batch due to a same-SKU clash. Here they get unique SKUs.
 *
 * Run:
 *   cd D:\Owner\Desktop\Sirini_Website
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/upload-10lg277-variants.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BASE = 'D:\\Online Images\\Images Online\\New Products\\Longset-d';

const VARIANTS = [
  { dir: '10LG277-Mint', colour: 'Mint', sku: '10LG277-MINT' },
  { dir: '10LG277-Pink', colour: 'Pink', sku: '10LG277-PINK' },
];

async function getUploadBuffer(filePath: string): Promise<Buffer> {
  const stat = fs.statSync(filePath);
  if (stat.size > 9_500_000) {
    return await sharp(filePath).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  }
  return fs.readFileSync(filePath);
}

async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sirini-products', public_id: publicId, overwrite: false, resource_type: 'image' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function parsePrice(filename: string): number | null {
  const base = path.basename(filename, path.extname(filename)).trim();
  for (const part of base.split(/[-_]/).slice(1)) {
    const n = parseInt(part, 10);
    if (!isNaN(n) && n > 100 && n < 100000 && String(n) === part) return n;
  }
  return null;
}

async function main() {
  const before = await prisma.product.count();
  console.log(`Products before: ${before}\n`);
  const issues: string[] = [];
  let created = 0;

  for (const v of VARIANTS) {
    const folder = path.join(BASE, v.dir);
    if (!fs.existsSync(folder)) { issues.push(`${v.sku}: folder missing ${folder}`); continue; }

    const existing = await prisma.product.findFirst({ where: { sku: v.sku }, select: { id: true } });
    if (existing) { console.log(`SKIP (exists): ${v.sku}`); continue; }

    const imgFiles = fs.readdirSync(folder).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
    if (imgFiles.length === 0) { issues.push(`${v.sku}: no images`); continue; }

    let wholesale: number | null = null;
    for (const f of imgFiles) { const p = parsePrice(f); if (p !== null) { wholesale = p; break; } }
    const price = wholesale ? Math.round(wholesale * 2) : 999;
    const compareAtPrice = wholesale ? Math.round(price * 2) : 1998;
    if (!wholesale) issues.push(`${v.sku}: no price in filename → ₹999 fallback`);

    const name = `Long Set 10LG277 - ${v.colour}`;
    console.log(`Uploading ${v.sku} — "${name}" (${imgFiles.length} images, price=₹${price})`);
    const urls: string[] = [];
    for (const imgFile of imgFiles) {
      const publicId = path.basename(imgFile, path.extname(imgFile)).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
      try {
        const buffer = await getUploadBuffer(path.join(folder, imgFile));
        urls.push(await uploadToCloudinary(buffer, publicId));
        process.stdout.write('.');
      } catch (e) {
        issues.push(`${v.sku}: upload failed ${imgFile}: ${e}`);
      }
    }
    process.stdout.write('\n');
    if (urls.length === 0) { issues.push(`${v.sku}: all uploads failed`); continue; }

    const description = `A handcrafted Gold Plated ${v.colour.toLowerCase()} long haram-style set from Sirini's latest collection, perfect for bridal and festive occasions. Pairs an elegantly detailed necklace with matching earrings for a complete traditional look. Designed in Mumbai with a focus on statement shine and lasting craftsmanship.`;

    await prisma.product.create({
      data: {
        name, slug: makeSlug(name), description, price, compareAtPrice,
        category: 'long-sets', material: 'Gold Plated', sku: v.sku,
        images: urls, stock: 10, isFeatured: false,
      },
    });
    console.log(`  CREATED ${v.sku} (${urls.length} images)`);
    created++;
  }

  const after = await prisma.product.count();
  console.log(`\nProducts after: ${after} (created ${created})`);
  console.log('Issues:', issues.length ? '\n  - ' + issues.join('\n  - ') : '(none)');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
