/**
 * Generates a SQUARE, legible, branded favicon set so Google/Chrome show the
 * Sirini mark instead of a generic globe.
 *
 * The existing logo is 806×495 (wide + transparent) → unusable as a favicon.
 * We render a deep-maroon square with a gold serif "S" monogram + a thin gold
 * ring — recognisable at 16px, premium at any size.
 *
 * Outputs (Next.js App Router file conventions auto-serve these):
 *   app/icon.png        512×512  → <link rel="icon">
 *   app/apple-icon.png  180×180  → apple-touch-icon
 *   app/favicon.ico     32×32    → /favicon.ico
 *
 * Run: npx tsx scripts/make-square-favicon.ts
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MAROON = '#5C1A24';
const GOLD = '#C9A96E';

function svg(size: number): Buffer {
  const r = size / 2;
  const ring = size * 0.44;
  const fontSize = size * 0.62;
  return Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${MAROON}"/>
  <circle cx="${r}" cy="${r}" r="${ring}" fill="none" stroke="${GOLD}" stroke-width="${size * 0.018}" opacity="0.7"/>
  <text x="50%" y="50%" dy="0.02em" text-anchor="middle" dominant-baseline="central"
        font-family="Georgia, 'Times New Roman', 'EB Garamond', serif"
        font-size="${fontSize}" font-weight="600" fill="${GOLD}">S</text>
</svg>`);
}

async function main() {
  const appDir = path.resolve('app');

  // 512 icon
  await sharp(svg(512)).png().toFile(path.join(appDir, 'icon.png'));
  console.log('✓ app/icon.png (512×512)');

  // 180 apple icon
  await sharp(svg(180)).png().toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✓ app/apple-icon.png (180×180)');

  // 32 favicon.ico (PNG embedded in ICO container)
  const png32 = await sharp(svg(32)).png().toBuffer();
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);
  iconDir.writeUInt16LE(1, 2);
  iconDir.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png32.length, 8);
  entry.writeUInt32LE(6 + 16, 12);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), Buffer.concat([iconDir, entry, png32]));
  console.log('✓ app/favicon.ico (32×32)');

  console.log('\nDone. Square branded favicon generated.');
}
main().catch((e) => { console.error(e); process.exit(1); });
