/**
 * Compressed delivery URL for bot-facing surfaces (JSON-LD, sitemaps,
 * OG metadata, merchant feed). Crawlers (Googlebot-Image, WhatsApp,
 * Merchant Center) fetch these URLs directly, so serving the raw stored
 * original (often 8–10 MB) burns Cloudinary bandwidth credits fast.
 *
 * Deliberately NOT f_auto: Merchant Center and some link-preview scrapers
 * don't accept AVIF, so we keep the original format and let w_/q_ do the
 * shrinking. Same transform string everywhere = one shared derived asset
 * per image (one transformation credit, ever).
 */
const MARKER = "/image/upload/";
export const BOT_IMAGE_TRANSFORM = "w_1200,h_1200,c_limit,q_auto:good";

export function botImageUrl(src: string): string {
  const idx = src.indexOf(MARKER);
  if (idx === -1) return src;

  const rest = src.slice(idx + MARKER.length);

  // First path segment after /upload/ — a version (v123…) or public id means
  // the URL is untransformed; anything with key_value params already carries
  // a transformation (e.g. brand/logo URLs) and is left untouched.
  const slash = rest.indexOf("/");
  const first = slash === -1 ? rest : rest.slice(0, slash);
  const isTransform = /(^|,)[a-z]+_[^/]*/.test(first) && !/^v\d+$/.test(first);
  if (isTransform) return src;

  return `${src.slice(0, idx + MARKER.length)}${BOT_IMAGE_TRANSFORM}/${rest}`;
}
