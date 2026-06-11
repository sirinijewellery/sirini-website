"use client";

/**
 * Custom next/image loader — serves every Cloudinary image resized and
 * compressed straight from Cloudinary's CDN (f_auto picks AVIF/WebP,
 * q_auto picks the leanest visually-lossless quality, w_ caps the pixel
 * width to what the layout actually needs).
 *
 * Without this, cards/galleries pulled multi-MB original JPGs.
 *
 * Handles URLs that already carry a transformation segment (hero, logo)
 * by chaining ours AFTER the existing one, so effects like e_trim are
 * applied before the final resize.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const marker = "/image/upload/";
  const idx = src.indexOf(marker);
  if (idx === -1) {
    // Non-Cloudinary image (none in production today) — serve as-is.
    return src;
  }

  const base = src.slice(0, idx + marker.length);
  const rest = src.slice(idx + marker.length);

  const q = quality ? `q_${quality}` : "q_auto";
  const t = `f_auto,${q},w_${width},c_limit`;

  // First path segment after /upload/ — either a version (v123…), the start
  // of the public id, or an existing transformation (contains "_" params
  // separated by commas, e.g. "q_auto,f_auto,w_1920" or "e_trim,f_png").
  const slash = rest.indexOf("/");
  const first = slash === -1 ? rest : rest.slice(0, slash);
  const isTransform = /(^|,)[a-z]+_[^/]*/.test(first) && !/^v\d+$/.test(first);

  if (isTransform && slash !== -1) {
    // Chain after the existing transform: …/upload/<existing>/<ours>/<id>
    return `${base}${first}/${t}/${rest.slice(slash + 1)}`;
  }
  return `${base}${t}/${rest}`;
}
