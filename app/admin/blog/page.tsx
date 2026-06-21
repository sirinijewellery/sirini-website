import type { Metadata } from "next";
import { getAllPostsAdmin } from "@/lib/blog";
import { BlogManager } from "@/components/admin/BlogManager";

export const metadata: Metadata = { title: "Journal" };

// Admin data should always be fresh.
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getAllPostsAdmin();

  return (
    <div className="p-6 lg:p-8">
      <BlogManager initialPosts={posts} />
    </div>
  );
}
