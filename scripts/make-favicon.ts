/**
 * Converts public/logo.png → app/favicon.ico
 * Uses ICO format with embedded 32x32 PNG (supported by all modern browsers).
 * Run: npx tsx scripts/make-favicon.ts
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const src = path.resolve('public/logo.png');
  const dest = path.resolve('app/favicon.ico');

  // Resize to 32×32, keep transparency
  const png = await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Build a minimal ICO file with 1 embedded PNG image
  // ICO spec: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG bytes
  const dataOffset = 6 + 16;

  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);  // reserved
  iconDir.writeUInt16LE(1, 2);  // type: 1 = ICO
  iconDir.writeUInt16LE(1, 4);  // image count: 1

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);             // width
  entry.writeUInt8(32, 1);             // height
  entry.writeUInt8(0, 2);              // color count (0 = true color)
  entry.writeUInt8(0, 3);              // reserved
  entry.writeUInt16LE(1, 4);           // color planes
  entry.writeUInt16LE(32, 6);          // bits per pixel
  entry.writeUInt32LE(png.length, 8);  // size of PNG data
  entry.writeUInt32LE(dataOffset, 12); // byte offset of PNG data

  const ico = Buffer.concat([iconDir, entry, png]);
  fs.writeFileSync(dest, ico);

  console.log(`✓ Created ${dest} (${ico.length} bytes, 32×32 PNG-in-ICO)`);
}

main().catch(e => { console.error(e); process.exit(1); });
