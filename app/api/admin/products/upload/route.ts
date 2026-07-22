import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Checks the file's actual magic bytes against the claimed MIME type, so a
// polyglot/renamed non-image file can't slip past the client-controlled
// `file.type` check above it.
function matchesImageSignature(buf: Buffer, mimeType: string): boolean {
  if (buf.length < 12) return false;
  switch (mimeType) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      );
    case "image/webp":
      return (
        buf.toString("ascii", 0, 4) === "RIFF" &&
        buf.toString("ascii", 8, 12) === "WEBP"
      );
    case "image/gif":
      return buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a";
    case "image/avif":
      // ISOBMFF container: bytes 4-8 are "ftyp"; brand at 8-12 varies by
      // encoder (avif/avis/av01/mif1), so only the box marker is checked.
      return buf.toString("ascii", 4, 8) === "ftyp";
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Allowlist raster image types only — notably excludes image/svg+xml, which
  // can embed scripts (stored XSS if ever served/opened directly).
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be a JPEG, PNG, WebP, GIF or AVIF image" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify magic bytes match the declared MIME type — the browser-supplied
  // file.type above is client-controlled and trivially spoofable, so a
  // renamed HTML/script payload could otherwise pass the extension check.
  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match a valid image format" },
      { status: 400 }
    );
  }

  const publicId = `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const result = await uploadToCloudinary(buffer, publicId, "sirini-products");
    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
