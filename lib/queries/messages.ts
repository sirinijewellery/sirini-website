import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** All contact-form messages, unread first, then newest first. */
export const getContactMessages = cache(async () => {
  return prisma.contactMessage.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
  });
});

/** Unread-message count for the admin sidebar badge. Never throws — a DB
 *  hiccup degrades to 0 rather than breaking the admin layout render
 *  (same contract as getPendingCount). */
export const getUnreadMessageCount = cache(async (): Promise<number> => {
  try {
    return await prisma.contactMessage.count({ where: { isRead: false } });
  } catch {
    return 0;
  }
});
