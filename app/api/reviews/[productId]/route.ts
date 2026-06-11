import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseImages } from "@/lib/parseImages";

const reviewSchema = z.object({
  authorName: z.string().min(1, "Name is required").max(100),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
});

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { productId } = await params;

    const rawReviews = await prisma.review.findMany({
      where: { productId, isPublished: true },
      orderBy: { createdAt: "desc" },
    });

    const totalCount = rawReviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round((rawReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
        : 0;

    // Normalise the JSON images field to a string[] and surface isVerified.
    // Omit userId — internal user ids must not be exposed publicly.
    const reviews = rawReviews.map(({ userId: _userId, ...r }) => ({
      ...r,
      isVerified: r.isVerified,
      images: parseImages(r.images),
    }));

    return NextResponse.json({ reviews, averageRating, totalCount });
  } catch (error) {
    console.error("[Reviews GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { productId } = await params;

    const session = await auth();
    const userId = session?.user?.id ?? null;

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        authorName: parsed.data.authorName,
        rating: parsed.data.rating,
        body: parsed.data.body ?? null,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("[Reviews POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
