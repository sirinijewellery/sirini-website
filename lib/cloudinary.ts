import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CLOUDINARY_PRESETS = {
  PRODUCT_THUMB: "w_300,h_300,c_fill,q_auto,f_auto",
  PRODUCT_GALLERY: "w_800,h_800,c_fill,q_auto,f_auto",
  PRODUCT_HERO: "w_1200,h_600,c_fill,q_auto,f_auto",
} as const;

export function getCloudinaryUrl(
  publicId: string,
  preset: keyof typeof CLOUDINARY_PRESETS = "PRODUCT_GALLERY"
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transformation = CLOUDINARY_PRESETS[preset];
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  publicId: string,
  folder = "sirini-jewellery"
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          folder,
          overwrite: true,
          resource_type: "image",
          // Incoming transformation: shrink BEFORE storing. Camera originals
          // are 8–10 MB / 4000+ px; storing them raw burns storage credits and
          // lets any raw-URL consumer pull multi-MB files. 2400px covers every
          // rendered size (max srcset width is 1920) with zoom headroom.
          transformation: [
            { width: 2400, height: 2400, crop: "limit", quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      )
      .end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
