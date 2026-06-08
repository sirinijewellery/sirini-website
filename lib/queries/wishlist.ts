import { prisma } from "@/lib/prisma";

export async function getWishlistItems(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: { id: "desc" },
  });
}

export type WishlistItemWithProduct = Awaited<
  ReturnType<typeof getWishlistItems>
>[number];
