"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Newspaper, Eye, EyeOff } from "lucide-react";
import type { AdminBlogPost } from "@/lib/blog";
import { BlogForm } from "@/components/admin/BlogForm";

interface Props {
  initialPosts: AdminBlogPost[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; post: AdminBlogPost };

export function BlogManager({ initialPosts }: Props) {
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function sortPosts(list: AdminBlogPost[]) {
    return [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  function handleCreated(post: AdminBlogPost) {
    setPosts((prev) => sortPosts([post, ...prev]));
    setMode({ kind: "list" });
    toast.success(`"${post.title}" created`);
  }

  function handleUpdated(post: AdminBlogPost) {
    setPosts((prev) => sortPosts(prev.map((p) => (p.id === post.id ? post : p))));
    setMode({ kind: "list" });
    toast.success(`"${post.title}" updated`);
  }

  async function handleDelete(post: AdminBlogPost) {
    if (
      !window.confirm(
        `Delete "${post.title}"?\n\nThis permanently removes the post from your Journal.`,
      )
    )
      return;

    setDeletingId(post.id);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to delete post");
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success(`"${post.title}" deleted`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDeletingId(null);
    }
  }

  if (mode.kind === "new") {
    return (
      <BlogForm
        mode="create"
        onSaved={handleCreated}
        onCancel={() => setMode({ kind: "list" })}
      />
    );
  }

  if (mode.kind === "edit") {
    return (
      <BlogForm
        mode="edit"
        post={mode.post}
        onSaved={handleUpdated}
        onCancel={() => setMode({ kind: "list" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-sans">Journal</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posts.length} post{posts.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => setMode({ kind: "new" })}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Newspaper className="h-8 w-8 opacity-40" />
            <p className="font-sans text-sm">No posts yet.</p>
            <button
              onClick={() => setMode({ kind: "new" })}
              className="text-sm text-primary hover:underline underline-offset-4 cursor-pointer"
            >
              Write your first post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Title
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Status
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50/70 transition-colors duration-100"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.coverImage}
                            alt=""
                            className="h-9 w-9 rounded object-cover border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded bg-gray-100 border border-gray-100 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[280px]">
                            {post.title}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[280px]">
                            /{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                          <Eye className="h-3 w-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setMode({ kind: "edit", post })}
                          className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                          aria-label={`Edit ${post.title}`}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                          aria-label={`Delete ${post.title}`}
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingId === post.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
