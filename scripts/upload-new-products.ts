/**
 * upload-new-products.ts
 *
 * Uploads new product images to Cloudinary and creates DB records for:
 *   - 6 Necklace Set products (NS folder, no price in filename → default 999)
 *   - 18 Long Set / Pendant Set products (Longset-d folder, price in filename)
 *
 * Run:
 *   cd D:\Owner\Desktop\Sirini_Website
 *   npx tsx scripts/upload-new-products.ts
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

/* ── Paths ─────────────────────────────────────────────────────────── */

const NS_BASE   = 'D:\\Online Images\\Images Online\\New Products';
const LS_BASE   = 'D:\\Online Images\\Images Online\\New Products\\Longset-d';

/* ── Material from SKU prefix ──────────────────────────────────────── */

function getMaterial(sku: string): string {
  const prefix = sku.substring(0, 2);
  const map: Record<string, string> = {
    '01': 'Brass & Copper',
    '02': 'Brass & Copper',
    '05': 'Silver Plated',
    '10': 'Gold Plated',
    '15': 'Silver Plated',
    '17': 'Gold Plated',
    '30': 'Antique Gold',
  };
  return map[prefix] ?? 'Gold Plated';
}

/* ── Description helper ────────────────────────────────────────────── */

function makeDescription(type: 'necklace-set' | 'long-set' | 'pendant-set', colour: string | null): string {
  const c = colour ? `${colour.toLowerCase()} ` : '';
  if (type === 'long-set') {
    return `Stunning ${c}long set featuring an elegantly crafted necklace with matching earrings. Perfect for weddings, receptions, and festive occasions. Exudes traditional charm with a contemporary finish.`;
  }
  if (type === 'pendant-set') {
    return `Elegant ${c}pendant set with an intricately detailed centrepiece and matching earrings. Ideal for celebrations, gifting, and special occasions.`;
  }
  // necklace-set
  return `Stunning ${c}necklace set featuring a beautifully crafted pendant with matching earrings. Perfect for weddings, engagements, and festive occasions. Exudes elegance and traditional charm.`;
}

/* ── Slug generation ───────────────────────────────────────────────── */

function makeSlug(name: string, sku: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // avoid duplicate suffix if already included
  if (base.endsWith(suffix)) return base;
  return `${base}-${suffix}`;
}

/* ── Price parsing from Long Set filename ──────────────────────────── */

function parsePriceFromFilename(filename: string): number | null {
  // Pattern examples:
  //   02LG200-625-1.jpg  → 625
  //   10LG277-GREEN-6775-1.jpg → 6775
  //   15LG280-2800 .jpg → 2800
  const base = path.basename(filename, path.extname(filename)).trim();
  const parts = base.split('-');
  // skip index 0 (code), scan rest for a 3-5 digit number
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

/* ── Product definition types ──────────────────────────────────────── */

interface ProductDef {
  sku: string;           // e.g. "10NS517"
  name: string;          // human name
  categorySlug: string;  // "necklace-sets" | "long-sets"
  folderPath: string;    // absolute path to image folder
  defaultPrice: number;  // selling price (already calculated)
  colour: string | null;
  type: 'necklace-set' | 'long-set' | 'pendant-set';
}

/* ── Build product list ────────────────────────────────────────────── */

function buildNsProducts(): ProductDef[] {
  // 6 NS products, default selling price = 999
  const NS_SKUS = ['10NS517','10NS672','10NS686','10NS697','10NS712','10NS723'];
  return NS_SKUS.map(sku => ({
    sku,
    name: `Necklace Set ${sku}`,
    categorySlug: 'necklace-sets',
    folderPath: path.join(NS_BASE, sku),
    defaultPrice: 999,
    colour: null,
    type: 'necklace-set' as const,
  }));
}

function buildLongSetProducts(): ProductDef[] {
  // Subdirectories under Longset-d
  const dirs = [
    '02LG200','02LG201','02LG202','05PS140',
    '10LG277-Green','10LG277-Mint','10LG277-Pink',
    '15LG192','15LG280','15LG286','15LG289','15LG299',
    '15PS179','15PS188',
    '17LG251','17LG254',
    '30LG203','30LG206',
  ];

  const COLOUR_SUFFIXES = ['Green','Mint','Pink','White','Red','Blue'];

  return dirs.map(dirName => {
    // Extract colour from dir name
    let colour: string | null = null;
    let skuBase = dirName;
    for (const c of COLOUR_SUFFIXES) {
      if (dirName.endsWith('-' + c)) {
        colour = c;
        skuBase = dirName.slice(0, -(c.length + 1));
        break;
      }
    }

    const sku = skuBase.toUpperCase();
    const isPS = sku.includes('PS');

    // Build name
    const name = colour
      ? `${isPS ? 'Pendant Set' : 'Long Set'} ${skuBase} - ${colour}`
      : `${isPS ? 'Pendant Set' : 'Long Set'} ${skuBase}`;

    const categorySlug = isPS ? 'necklace-sets' : 'long-sets';
    const type: 'long-set' | 'pendant-set' = isPS ? 'pendant-set' : 'long-set';

    // Price will be parsed from filenames; default fallback 999
    // We parse at upload time from the actual files
    return {
      sku,
      name,
      categorySlug,
      folderPath: path.join(LS_BASE, dirName),
      defaultPrice: 999, // will be overridden after scanning files
      colour,
      type,
      _dirName: dirName,
    } as ProductDef & { _dirName: string };
  }) as (ProductDef & { _dirName?: string })[];
}

/* ── Main ──────────────────────────────────────────────────────────── */

async function main() {
  console.log('Sirini Jewellery — New Products Upload\n');

  // Count products before
  const beforeCount = await prisma.product.count();
  console.log(`Products in DB before: ${beforeCount}\n`);

  const allProducts: (ProductDef & { _dirName?: string })[] = [
    ...buildNsProducts(),
    ...(buildLongSetProducts() as (ProductDef & { _dirName?: string })[]),
  ];

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let totalImagesUploaded = 0;
  const createdList: string[] = [];

  for (const prod of allProducts) {
    // Check if already exists in DB
    const existing = await prisma.product.findFirst({
      where: { sku: prod.sku },
      select: { id: true, sku: true },
    });

    if (existing) {
      console.log(`SKIP (exists): ${prod.sku} — ${prod.name}`);
      skipped++;
      continue;
    }

    // Check folder exists
    if (!fs.existsSync(prod.folderPath)) {
      console.error(`ERROR: Folder not found: ${prod.folderPath}`);
      errors++;
      continue;
    }

    try {
      // Scan for image files
      const allFiles = fs.readdirSync(prod.folderPath).sort();
      const imgFiles = allFiles.filter(f => {
        const lo = f.toLowerCase();
        return (lo.endsWith('.jpg') || lo.endsWith('.jpeg') || lo.endsWith('.png'));
      });

      if (imgFiles.length === 0) {
        console.error(`ERROR: No images found in ${prod.folderPath}`);
        errors++;
        continue;
      }

      // Determine selling price
      let sellingPrice = prod.defaultPrice;
      if (prod.type !== 'necklace-set') {
        // Parse wholesale price from filename
        for (const f of imgFiles) {
          const wholesale = parsePriceFromFilename(f);
          if (wholesale !== null) {
            sellingPrice = wholesale * 2;
            break;
          }
        }
        if (sellingPrice === prod.defaultPrice && prod.defaultPrice === 999) {
          console.warn(`  WARN: Could not parse price from filenames for ${prod.sku}, using default 999`);
        }
      }

      const compareAtPrice = sellingPrice * 2;

      // Upload images
      console.log(`\nUploading ${prod.sku} — "${prod.name}" (${imgFiles.length} images, price=₹${sellingPrice})`);

      const urls: string[] = [];
      for (const imgFile of imgFiles) {
        const filePath = path.join(prod.folderPath, imgFile);
        const base = path.basename(imgFile, path.extname(imgFile)).toLowerCase().trim();
        // Replace spaces and special chars in publicId
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
        }
      }

      if (urls.length === 0) {
        console.error(`ERROR: All uploads failed for ${prod.sku}`);
        errors++;
        continue;
      }

      // Create product in DB
      const slug = makeSlug(prod.name, prod.sku);
      const material = getMaterial(prod.sku);
      const description = makeDescription(prod.type, prod.colour);

      const product = await prisma.product.create({
        data: {
          name: prod.name,
          slug,
          description,
          price: sellingPrice,
          compareAtPrice,
          category: prod.categorySlug,
          material,
          sku: prod.sku,
          images: urls,
          isFeatured: false,
        },
      });

      // Create default variant
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          stockQuantity: 10,
        },
      });

      console.log(`  CREATED: ${prod.sku} — "${prod.name}" (${urls.length} images, slug: ${slug})`);
      created++;
      createdList.push(`${prod.sku} — "${prod.name}" (${urls.length} images, ₹${sellingPrice})`);
    } catch (e) {
      console.error(`ERROR creating ${prod.sku}: ${e}`);
      errors++;
    }
  }

  // Final count
  const afterCount = await prisma.product.count();

  console.log('\n' + '─'.repeat(60));
  console.log(`Products before: ${beforeCount}`);
  console.log(`Products after:  ${afterCount}`);
  console.log(`Created: ${created}  |  Skipped: ${skipped}  |  Errors: ${errors}`);
  console.log(`Total images uploaded to Cloudinary: ${totalImagesUploaded}`);
  console.log('\nCreated products:');
  createdList.forEach(p => console.log('  ' + p));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
