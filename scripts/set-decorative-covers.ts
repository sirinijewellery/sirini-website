import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Classification rules (based on filename patterns observed in the catalogue):
//   decorative — main styled hero shot: no number suffix, no "white", no "model", no "cpt"
//                e.g. 01ns706-3825.jpg  /  01NS830-2250.jpg
//   numbered   — plain product detail shots with a numeric index suffix
//                e.g. 01ns706-3825-1.jpg  /  01NS705-WHITE-4500-1.jpg
//   model      — model wearing the product: contains "model"
//   cpt        — close-up thumbnail: contains "cpt"
//
// Cover priority: model → decorative → numbered → cpt
// (owner rule, 12 Jun 2026: model shot is always the cover when it exists;
//  decorative styled shot otherwise; plain white shots last)

function classify(url: string): "decorative" | "numbered" | "model" | "cpt" {
  const lower = url.toLowerCase();
  const filename = lower.split("/").pop() ?? lower;          // last path segment
  const base = filename.replace(/\.[^.]+$/, "");             // strip extension

  if (base.includes("cpt"))   return "cpt";
  if (base.includes("model")) return "model";

  // A numbered shot ends with a 1-2 digit index (e.g. -1, -2, -4-)
  // Price numbers like -3825 or -2975 are 4 digits and won't match.
  if (/-\d{1,2}-?$/.test(base)) return "numbered";

  // Explicitly labelled white-background shots
  if (base.includes("white")) return "numbered";

  return "decorative";
}

function reorder(images: string[]): string[] {
  const model      = images.filter(u => classify(u) === "model");
  const decorative = images.filter(u => classify(u) === "decorative");
  const numbered   = images.filter(u => classify(u) === "numbered");
  const cpt        = images.filter(u => classify(u) === "cpt");
  return [...model, ...decorative, ...numbered, ...cpt];
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, images: true },
  });

  let updated = 0;
  let unchanged = 0;

  for (const p of products) {
    const current = (p.images as string[]) ?? [];
    const reordered = reorder(current);

    const same = current.every((u, i) => u === reordered[i]);
    if (same) { unchanged++; continue; }

    await prisma.product.update({
      where: { id: p.id },
      data: { images: reordered },
    });
    console.log(`✓ ${p.sku}  [${classify(current[0])} → ${classify(reordered[0])}]  ${reordered[0].split("/").pop()}`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${unchanged} already correct.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
