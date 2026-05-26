import { prisma } from "@/lib/prisma";

export async function getWishlistItems(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          variants: {
            select: { id: true, size: true, colour: true, stockQuantity: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });
}

export type WishlistItemWithProduct = Awaited<
  ReturnType<typeof getWishlistItems>
>[number];
