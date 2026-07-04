// Shrink oversized stored originals in place: replace each asset >1 MB with
// its own w_2400,c_limit,q_auto:good derivative (fetched from Cloudinary's
// CDN, ~300 KB each — NOT the multi-MB original, which would burn bandwidth
// credits). Same public_id + overwrite keeps every DB URL working; derived
// images regenerate on demand from the new, visually identical source.
//
// Brand assets (hero, logo) are deliberately excluded.
//
// Run (dry list only):  DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/compress-existing-originals.ts
// Run (execute):        add EXECUTE=1; optionally LIMIT=5 for a trial batch.
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const MIN_BYTES = 1_000_000;
const TRANSFORM = "w_2400,h_2400,c_limit,q_auto:good";
const EXECUTE = process.env.EXECUTE === "1";
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;

interface Asset {
  public_id: string;
  bytes: number;
  format: string;
  version: number;
}

async function listOversized(): Promise<Asset[]> {
  const assets: Asset[] = [];
  let cursor: string | undefined;
  do {
    const res = await cloudinary.search
      .expression(`resource_type:image AND type:upload AND bytes>${MIN_BYTES}`)
      .sort_by("bytes", "desc")
      .max_results(500)
      .next_cursor(cursor)
      .execute();
    for (const r of res.resources as (Asset & { public_id: string })[]) {
      if (r.public_id.startsWith("sirini-jewellery/brand")) continue;
      assets.push({
        public_id: r.public_id,
        bytes: r.bytes,
        format: r.format,
        version: r.version,
      });
    }
    cursor = res.next_cursor;
  } while (cursor);
  return assets;
}

async function compressOne(a: Asset): Promise<number> {
  const src = `https://res.cloudinary.com/${CLOUD}/image/upload/${TRANSFORM}/v${a.version}/${a.public_id}.${a.format}`;
  // Cloudinary's remote-fetch uploader 420s on a cold (not yet generated)
  // derivative — warm it with a plain GET first, retrying while it derives.
  for (let i = 0; i < 5; i++) {
    const head = await fetch(src, { method: "HEAD" });
    if (head.ok) break;
    if (i === 4) throw new Error(`derivative never became ready (${head.status})`);
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  const res = await cloudinary.uploader.upload(src, {
    public_id: a.public_id,
    overwrite: true,
    invalidate: false,
    resource_type: "image",
    type: "upload",
  });
  return res.bytes;
}

async function main() {
  const all = (await listOversized()).slice(0, LIMIT);
  const totalBefore = all.reduce((s, a) => s + a.bytes, 0);
  console.log(
    `${all.length} assets over ${MIN_BYTES / 1e6} MB, total ${(totalBefore / 1e9).toFixed(2)} GB` +
      (EXECUTE ? " — compressing…" : " — dry run (set EXECUTE=1 to compress)"),
  );
  if (!EXECUTE) {
    for (const a of all.slice(0, 10))
      console.log(`  ${(a.bytes / 1e6).toFixed(1)} MB  ${a.public_id}`);
    return;
  }

  let done = 0;
  let failed = 0;
  let totalAfter = 0;
  for (const a of all) {
    try {
      const newBytes = await compressOne(a);
      totalAfter += newBytes;
      done++;
      console.log(
        `[${done}/${all.length}] ${a.public_id}: ${(a.bytes / 1e6).toFixed(1)} MB -> ${(newBytes / 1e6).toFixed(2)} MB`,
      );
    } catch (e) {
      failed++;
      totalAfter += a.bytes; // unchanged
      console.error(`FAILED ${a.public_id}: ${(e as Error).message}`);
    }
    // Gentle pacing for the upload API
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(
    `Done. ${done} compressed, ${failed} failed. ` +
      `${(totalBefore / 1e9).toFixed(2)} GB -> ${(totalAfter / 1e9).toFixed(2)} GB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
