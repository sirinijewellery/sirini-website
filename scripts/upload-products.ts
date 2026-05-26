/**
 * upload-products.ts
 * Reads jewellery photos from D:\Online Images\Images Online,
 * uploads them to Cloudinary, and creates Product records in the DB.
 *
 * Run: npx tsx scripts/upload-products.ts
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

/* ── Config ──────────────────────────────────────────────────────── */

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const IMAGES_BASE = "D:\\Online Images\\Images Online";

/* ── Category mapping (folder name → DB values) ─────────────────── */

const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
  "Anklet":       { name: "Anklets",       slug: "anklets" },
  "Bangles":      { name: "Bangles",       slug: "bangles" },
  "Earring":      { name: "Earrings",      slug: "earrings" },
  "Fingering":    { name: "Finger Rings",  slug: "finger-rings" },
  "Necklace Set": { name: "Necklace Sets", slug: "necklace-sets" },
};

/* ── SKU prefix → product type ───────────────────────────────────── */

function getProductType(sku: string): string {
  const u = sku.toUpperCase();
  if (u.includes("KE"))  return "Kundan Earring";
  if (u.includes("ER"))  return "Earring";
  if (u.includes("BG"))  return "Bangle";
  if (u.includes("FR"))  return "Finger Ring";
  if (u.includes("PS"))  return "Pendant Set";
  if (u.includes("NS"))  return "Necklace Set";
  if (u.includes("PL"))  return "Anklet";
  if (u.includes("TL"))  return "Necklace";
  return "Jewellery";
}

/* ── Color extraction from folder name ───────────────────────────── */

const COLORS = ["Green", "Ruby", "White", "Pink", "Blue"];

function extractColor(folderName: string): string | null {
  if (folderName.endsWith("-Greeen") || folderName.endsWith("-greeen")) return "Green";
  for (const c of COLORS) {
    if (folderName.endsWith("-" + c)) return c;
  }
  return null;
}

function baseSku(folderName: string): string {
  // Strip known color suffixes (and typos)
  const suffixes = [...COLORS.map(c => "-" + c), "-Greeen"];
  for (const s of suffixes) {
    if (folderName.endsWith(s)) return folderName.slice(0, -s.length);
  }
  return folderName;
}

/* ── Price extraction from filenames ─────────────────────────────── */

function extractRawPrice(files: string[]): number | null {
  for (const f of files) {
    if (f.toLowerCase().includes("cpt")) continue;
    // Match: -{digits} before end-of-name or -{digit} or -Model
    const m = f.match(/-(\d{3,5})(?:-\d+|-Model)?\.(jpe?g|png|webp)$/i);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

/* ── Descriptions ────────────────────────────────────────────────── */

function makeDescription(type: string, color: string | null): string {
  const c = color ? `${color.toLowerCase()} ` : "";
  const map: Record<string, string> = {
    "Bangle":
      `Elegantly crafted ${c}bangle in a beautiful gold-toned finish. Perfect for everyday wear and festive occasions. Lightweight, comfortable, and versatile — pairs beautifully with traditional and contemporary outfits.`,
    "Earring":
      `Beautifully designed ${c}earring crafted with attention to detail. Adds a touch of grace and elegance to any look. Lightweight for all-day comfort, suitable for casual and formal wear.`,
    "Kundan Earring":
      `Exquisite ${c}kundan-style earring with intricate stonework and a rich gold-toned finish. Ideal for weddings, parties, and festive celebrations. A timeless piece that complements ethnic and fusion ensembles.`,
    "Finger Ring":
      `Delicately designed ${c}finger ring with an intricate pattern and lustrous gold-toned finish. Lightweight and comfortable for everyday wear. Makes a thoughtful gift for loved ones.`,
    "Necklace Set":
      `Stunning ${c}necklace set featuring a beautifully crafted pendant with matching earrings. Perfect for weddings, engagements, and festive occasions. Exudes elegance and traditional charm.`,
    "Pendant Set":
      `Elegant ${c}pendant set with an intricately detailed centrepiece and matching earrings. Ideal for celebrations, gifting, and special occasions.`,
    "Anklet":
      `Charming ${c}anklet (payal) with delicate detailing and a shimmering gold-toned finish. Adds a beautiful touch to traditional and festive outfits. Lightweight and comfortable to wear all day.`,
    "Necklace":
      `Beautiful ${c}necklace with a graceful design. Perfect for festive occasions, weddings, or as a thoughtful gift. Crafted with care for lasting elegance.`,
  };
  return map[type] ?? `Beautiful ${c}${type.toLowerCase()} from Sirini Jewellery's exclusive collection. Crafted with care for lasting elegance.`;
}

/* ── Cloudinary upload ───────────────────────────────────────────── */

async function uploadBuffer(filePath: string, publicId: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: publicId, folder: "sirini-jewellery", overwrite: true, resource_type: "image" },
        (err, result) => {
          if (err || !result) reject(err ?? new Error("Upload failed"));
          else resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

/* ── Sort images: main first, numbered next, Model last ─────────── */

function sortImages(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const isMain = (f: string) => !f.match(/-\d+\.(jpe?g|png|webp)$/i) && !f.toLowerCase().includes("model");
    const isModel = (f: string) => f.toLowerCase().includes("model");
    if (isMain(a) && !isMain(b)) return -1;
    if (!isMain(a) && isMain(b)) return 1;
    if (!isModel(a) && isModel(b)) return -1;
    if (isModel(a) && !isModel(b)) return 1;
    return a.localeCompare(b);
  });
}

/* ── Main ────────────────────────────────────────────────────────── */

async function main() {
  console.log("🚀 Sirini Jewellery — Product Upload Script\n");

  // Step 1: Upsert categories
  for (const [, cat] of Object.entries(CATEGORY_MAP)) {
    const exists = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!exists) {
      await prisma.category.create({ data: { name: cat.name, slug: cat.slug } });
      console.log(`✓ Category created: ${cat.name}`);
    } else {
      console.log(`  Category exists: ${cat.name}`);
    }
  }
  console.log();

  let created = 0, skipped = 0, errors = 0;

  // Step 2: Walk each category
  for (const [folder, cat] of Object.entries(CATEGORY_MAP)) {
    const catPath = path.join(IMAGES_BASE, folder);
    if (!fs.existsSync(catPath)) {
      console.warn(`⚠  Missing folder: ${catPath}`);
      continue;
    }

    const skuFolders = fs.readdirSync(catPath).filter(f =>
      fs.statSync(path.join(catPath, f)).isDirectory()
    );

    console.log(`\n📂  ${cat.name} — ${skuFolders.length} product(s)`);

    for (const sku of skuFolders) {
      const skuPath = path.join(catPath, sku);

      // Skip if product already in DB (idempotent re-runs)
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        console.log(`  ⏭  Skip (exists): ${sku}`);
        skipped++;
        continue;
      }

      try {
        const allFiles = fs.readdirSync(skuPath);
        const imgFiles = allFiles.filter(f => {
          const lo = f.toLowerCase();
          return (lo.endsWith(".jpg") || lo.endsWith(".jpeg") || lo.endsWith(".png") || lo.endsWith(".webp"))
            && !lo.includes("cpt");
        });

        if (imgFiles.length === 0) {
          console.log(`  ⚠  No images: ${sku}`);
          continue;
        }

        const rawPrice = extractRawPrice(allFiles);
        if (!rawPrice) {
          console.log(`  ⚠  Can't extract price: ${sku} (files: ${allFiles.join(", ")})`);
          errors++;
          continue;
        }

        const price = rawPrice * 2;            // 200% of base
        const color = extractColor(sku);
        const base = baseSku(sku);             // SKU without color suffix
        const type = getProductType(base);
        const slug = sku.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

        // Build product name  e.g. "Green Kundan Earring — 10KE379"
        const name = color
          ? `${color} ${type} — ${base}`
          : `${type} — ${sku}`;

        // Upload images
        process.stdout.write(`  ↑  ${sku} (${imgFiles.length} imgs, ₹${price})… `);
        const sorted = sortImages(imgFiles);
        const urls: string[] = [];

        for (const imgFile of sorted) {
          const filePath = path.join(skuPath, imgFile);
          const ext = path.extname(imgFile);
          const imgBase = path.basename(imgFile, ext);
          const publicId = `${sku.toLowerCase()}/${imgBase}`;
          try {
            const url = await uploadBuffer(filePath, publicId);
            urls.push(url);
          } catch (e) {
            process.stdout.write(`\n    ✗ Upload failed: ${imgFile} — ${e}\n`);
          }
        }

        if (urls.length === 0) {
          console.log(`✗ All uploads failed`);
          errors++;
          continue;
        }

        await prisma.product.create({
          data: {
            name,
            slug,
            description: makeDescription(type, color),
            price,
            category: cat.slug,
            material: "Gold-Toned",
            sku,
            images: urls,
            isFeatured: false,
          },
        });

        console.log(`✓  Created: "${name}"`);
        created++;
      } catch (e) {
        console.log(`\n  ✗  Error: ${sku} — ${e}`);
        errors++;
      }
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅  Done!  Created: ${created}  |  Skipped: ${skipped}  |  Errors: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
