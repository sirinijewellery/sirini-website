import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/blog";
import { BlogManager } from "@/components/admin/BlogManager";

export const metadata: Metadata = { title: "Journal" };

// Admin data should always be fresh.
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/blog");

  const posts = await getAllPostsAdmin();

  return (
    <div className="p-6 lg:p-8">
      <BlogManager initialPosts={posts} />
    </div>
  );
}
