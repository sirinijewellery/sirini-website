import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function classify(url: string): "decorative" | "model" | "cpt" {
  const lower = url.toLowerCase();
  if (lower.includes("cpt")) return "cpt";
  if (lower.includes("model")) return "model";
  return "decorative";
}

function reorder(images: string[]): string[] {
  const decorative = images.filter(u => classify(u) === "decorative");
  const model      = images.filter(u => classify(u) === "model");
  const cpt        = images.filter(u => classify(u) === "cpt");
  return [...decorative, ...model, ...cpt];
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
    console.log(`✓ ${p.sku}: cover → ${classify(reordered[0])} (${reordered[0].split("/").pop()})`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${unchanged} already correct.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
