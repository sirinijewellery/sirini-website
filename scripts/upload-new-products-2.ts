/**
 * upload-new-products-2.ts
 *
 * Uploads the new-products batch from:
 *   D:\Online Images\Images Online\sirni new 08-06-26
 * (the task referenced "upload2_New Products"; that folder does not exist on
 *  disk — the dated "sirni new 08-06-26" folder is the actual new batch.)
 *
 * Schema note: products NO LONGER have variants. Stock lives on Product.stock.
 * We set stock: 10 and create NO variants.
 *
 * Run:
 *   cd D:\Owner\Desktop\Sirini_Website
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/upload-new-products-2.ts
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

/* ── DB ────────────────────────────────────────────────────────────── */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/* ── Cloudinary ────────────────────────────────────────────────────── */

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Source folder ─────────────────────────────────────────────────── */

const SRC_BASE = 'D:\\Online Images\\Images Online\\sirni new 08-06-26';

/* ── Category from SKU letters ─────────────────────────────────────── */

const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
  LG: { name: 'Long Sets', slug: 'long-sets' },
  NS: { name: 'Necklace Sets', slug: 'necklace-sets' },
  PS: { name: 'Necklace Sets', slug: 'necklace-sets' },
  ER: { name: 'Earrings', slug: 'earrings' },
  JHM: { name: 'Earrings', slug: 'earrings' },
  BG: { name: 'Bangles', slug: 'bangles' },
  FR: { name: 'Finger Rings', slug: 'finger-rings' },
  PL: { name: 'Anklets', slug: 'anklets' },
};

function getCategoryLetters(code: string): string {
  // strip leading digits, take the alpha run
  const m = code.match(/^\d*([A-Za-z]+)/);
  return m ? m[1].toUpperCase() : '';
}

/* ── Material from numeric prefix ──────────────────────────────────── */

function getMaterial(code: string): { material: string; mapped: boolean } {
  const prefix = code.substring(0, 2);
  const map: Record<string, string> = {
    '01': 'Brass & Copper',
    '02': 'Brass & Copper',
    '05': 'Silver Plated',
    '15': 'Silver Plated',
    '10': 'Gold Plated',
    '17': 'Gold Plated',
    '30': 'Antique Gold',
  };
  if (map[prefix]) return { material: map[prefix], mapped: true };
  return { material: 'Gold Plated', mapped: false }; // fallback (e.g. prefix 24)
}

/* ── Singular label per category ───────────────────────────────────── */

function productTypeName(letters: string): string {
  switch (letters) {
    case 'LG': return 'Long Set';
    case 'NS': return 'Necklace Set';
    case 'PS': return 'Pendant Set';
    case 'ER':
    case 'JHM': return 'Earrings';
    case 'BG': return 'Bangles';
    case 'FR': return 'Finger Ring';
    case 'PL': return 'Anklet';
    default: return 'Jewellery Set';
  }
}

/* ── Slug generation (code appended for uniqueness) ────────────────── */

function makeSlug(name: string, sku: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const suffix = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (base.endsWith(suffix)) return base;
  return `${base}-${suffix}`;
}

/* ── Price parsing from filename ───────────────────────────────────── */

function parsePriceFromFilename(filename: string): number | null {
  // e.g. 01NS706-3825-1.jpg → 3825 ; 30NS743-2375-5.jpg → 2375
  const base = path.basename(filename, path.extname(filename)).trim();
  const parts = base.split(/[-_]/);
  for (const part of parts.slice(1)) {
    const trimmed = part.trim();
    const n = parseInt(trimmed, 10);
    if (!isNaN(n) && n > 100 && n < 100000 && String(n) === trimmed) return n;
  }
  return null;
}

/* ── Buffer helper with sharp resize if >9.5 MB ───────────────────── */

async function getUploadBuffer(filePath: string): Promise<Buffer> {
  const stat = fs.statSync(filePath);
  if (stat.size > 9_500_000) {
    console.log(`    (resizing large file: ${(stat.size / 1_000_000).toFixed(1)} MB)`);
    return await sharp(filePath)
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  }
  return fs.readFileSync(filePath);
}

/* ── Cloudinary upload ─────────────────────────────────────────────── */

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

/* ── Colour suffix detection (for future colour-variant folders) ──── */

const COLOUR_SUFFIXES = ['Green', 'Mint', 'Pink', 'White', 'Red', 'Blue', 'Maroon', 'Yellow', 'Black'];

function splitColour(dirName: string): { codeBase: string; colour: string | null } {
  for (const c of COLOUR_SUFFIXES) {
    if (dirName.toLowerCase().endsWith('-' + c.toLowerCase())) {
      return { codeBase: dirName.slice(0, -(c.length + 1)), colour: c };
    }
  }
  return { codeBase: dirName, colour: null };
}

/* ── Description ───────────────────────────────────────────────────── */

function makeDescription(typeName: string, material: string, colour: string | null): string {
  const c = colour ? `${colour.toLowerCase()} ` : '';
  const t = typeName.toLowerCase();
  if (typeName === 'Long Set') {
    return `A handcrafted ${material} ${c}long haram-style set from Sirini's latest collection, perfect for bridal and festive occasions. Pairs an elegantly detailed necklace with matching earrings for a complete traditional look. Designed in Mumbai with a focus on statement shine and lasting craftsmanship.`;
  }
  if (typeName === 'Pendant Set') {
    return `A handcrafted ${material} ${c}pendant set from Sirini's latest collection, featuring an intricately detailed centrepiece with matching earrings. Ideal for celebrations, gifting, and special evenings out. Designed in Mumbai with a focus on everyday elegance and statement shine.`;
  }
  // Necklace Set (default)
  return `A handcrafted ${material} ${c}necklace set from Sirini's latest collection, pairing a beautifully crafted necklace with matching earrings. Perfect for weddings, engagements, and festive celebrations. Designed in Mumbai with a focus on everyday elegance and statement shine.`;
}

/* ── Ensure category exists ────────────────────────────────────────── */

async function ensureCategory(letters: string): Promise<string> {
  const cat = CATEGORY_MAP[letters];
  if (!cat) {
    // unknown letters → default to Necklace Sets bucket
    console.warn(`  WARN: unknown category letters "${letters}", defaulting to necklace-sets`);
    return 'necklace-sets';
  }
  const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
  if (!existing) {
    await prisma.category.create({ data: { name: cat.name, slug: cat.slug } });
    console.log(`  CREATED category: ${cat.name} (${cat.slug})`);
  }
  return cat.slug;
}

/* ── Main ──────────────────────────────────────────────────────────── */

interface Report {
  sku: string;
  name: string;
  category: string;
  material: string;
  price: number;
  images: number;
  usedFallbackPrice: boolean;
  unmappedMaterial: boolean;
}

async function main() {
  console.log('Sirini Jewellery — New Products Upload (batch 2)\n');

  if (!fs.existsSync(SRC_BASE)) {
    console.error(`FATAL: source folder not found: ${SRC_BASE}`);
    process.exit(1);
  }

  const beforeCount = await prisma.product.count();
  console.log(`Products in DB before: ${beforeCount}\n`);

  const dirs = fs
    .readdirSync(SRC_BASE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let totalImagesUploaded = 0;
  const report: Report[] = [];
  const issues: string[] = [];

  for (const dirName of dirs) {
    const folderPath = path.join(SRC_BASE, dirName);
    const { codeBase, colour } = splitColour(dirName);
    const code = codeBase.toUpperCase();
    const letters = getCategoryLetters(code);
    const typeName = productTypeName(letters);

    // SKU unique per colour
    const sku = colour ? `${code}-${colour.toUpperCase()}` : code;

    // Name
    const name = colour ? `${typeName} ${code} - ${colour}` : `${typeName} ${code}`;

    // Check existing
    const existing = await prisma.product.findFirst({ where: { sku }, select: { id: true } });
    if (existing) {
      console.log(`SKIP (exists): ${sku} — ${name}`);
      skipped++;
      continue;
    }

    // Scan images
    const allFiles = fs.readdirSync(folderPath).sort();
    const imgFiles = allFiles.filter((f) => {
      const lo = f.toLowerCase();
      return lo.endsWith('.jpg') || lo.endsWith('.jpeg') || lo.endsWith('.png') || lo.endsWith('.webp');
    });

    if (imgFiles.length === 0) {
      console.error(`ERROR: No images in ${folderPath}`);
      issues.push(`${sku}: no images found in folder`);
      errors++;
      continue;
    }

    // Price
    let wholesale: number | null = null;
    for (const f of imgFiles) {
      const p = parsePriceFromFilename(f);
      if (p !== null) { wholesale = p; break; }
    }
    let price: number;
    let compareAtPrice: number;
    let usedFallbackPrice = false;
    if (wholesale !== null) {
      price = Math.round(wholesale * 2);
      compareAtPrice = Math.round(price * 2);
    } else {
      price = 999;
      compareAtPrice = 1998;
      usedFallbackPrice = true;
      issues.push(`${sku}: no price in filename → used ₹999 fallback (owner should set real price)`);
    }

    // Material
    const { material, mapped } = getMaterial(code);
    if (!mapped) {
      issues.push(`${sku}: material prefix "${code.substring(0, 2)}" not in spec map → defaulted to "${material}"`);
    }

    // Category
    const categorySlug = await ensureCategory(letters);

    // Upload
    console.log(`\nUploading ${sku} — "${name}" (${imgFiles.length} images, price=₹${price})`);
    const urls: string[] = [];
    for (const imgFile of imgFiles) {
      const filePath = path.join(folderPath, imgFile);
      const base = path.basename(imgFile, path.extname(imgFile)).toLowerCase().trim();
      const publicId = base.replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
      process.stdout.write(`  -> ${imgFile} ... `);
      try {
        const buffer = await getUploadBuffer(filePath);
        const url = await uploadToCloudinary(buffer, publicId);
        urls.push(url);
        totalImagesUploaded++;
        console.log('OK');
      } catch (e) {
        console.log(`FAILED: ${e}`);
        issues.push(`${sku}: image upload failed for ${imgFile}: ${e}`);
      }
    }

    if (urls.length === 0) {
      console.error(`ERROR: all uploads failed for ${sku}`);
      issues.push(`${sku}: ALL image uploads failed → product not created`);
      errors++;
      continue;
    }

    // Create product (NO variant; stock on product)
    try {
      const slug = makeSlug(name, sku);
      const description = makeDescription(typeName, material, colour);
      await prisma.product.create({
        data: {
          name,
          slug,
          description,
          price,
          compareAtPrice,
          category: categorySlug,
          material,
          sku,
          images: urls,
          stock: 10,
          isFeatured: false,
        },
      });
      console.log(`  CREATED: ${sku} — "${name}" (${urls.length} images, slug: ${slug})`);
      created++;
      report.push({
        sku, name, category: categorySlug, material, price,
        images: urls.length, usedFallbackPrice, unmappedMaterial: !mapped,
      });
    } catch (e) {
      console.error(`ERROR creating ${sku}: ${e}`);
      issues.push(`${sku}: DB create failed: ${e}`);
      errors++;
    }
  }

  const afterCount = await prisma.product.count();

  console.log('\n' + '─'.repeat(70));
  console.log(`Products before: ${beforeCount}  |  after: ${afterCount}`);
  console.log(`Created: ${created}  |  Skipped: ${skipped}  |  Errors: ${errors}`);
  console.log(`Total images uploaded to Cloudinary: ${totalImagesUploaded}`);

  console.log('\nUPLOADED PRODUCTS TABLE:');
  console.log('SKU | NAME | CATEGORY | MATERIAL | PRICE | IMAGES | FLAGS');
  for (const r of report) {
    const flags = [
      r.usedFallbackPrice ? '₹999-FALLBACK' : '',
      r.unmappedMaterial ? 'MATERIAL-DEFAULTED' : '',
    ].filter(Boolean).join(',') || '-';
    console.log(`${r.sku} | ${r.name} | ${r.category} | ${r.material} | ₹${r.price} | ${r.images} | ${flags}`);
  }

  console.log('\nISSUES / ERRORS:');
  if (issues.length === 0) console.log('  (none)');
  else issues.forEach((i) => console.log('  - ' + i));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
