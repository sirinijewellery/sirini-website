import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  try {
    await prisma.wishlistItem.create({
      data: { userId: session.user.id, productId },
    });
    return NextResponse.json({ wishlisted: true });
  } catch {
    return NextResponse.json({ error: "Already in wishlist" }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: session.user.id, productId },
    });
    return NextResponse.json({ wishlisted: false });
  } catch {
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
