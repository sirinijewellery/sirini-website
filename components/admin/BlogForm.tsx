"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Save,
  GripVertical,
} from "lucide-react";
import type { AdminBlogPost } from "@/lib/blog";

type Section = { heading: string; paragraphs: string[] };
type RelatedLink = { label: string; href: string };

interface CreateProps {
  mode: "create";
  post?: undefined;
  onSaved: (post: AdminBlogPost) => void;
  onCancel: () => void;
}
interface EditProps {
  mode: "edit";
  post: AdminBlogPost;
  onSaved: (post: AdminBlogPost) => void;
  onCancel: () => void;
}
type Props = CreateProps | EditProps;

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const labelCls =
  "text-xs font-medium text-slate-500 uppercase tracking-wider";
const inputCls =
  "h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full";
const textareaCls =
  "px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full resize-y";
const cardCls = "bg-white rounded-xl border border-gray-200 shadow-sm p-5";

export function BlogForm({ mode, post, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [readMins, setReadMins] = useState<number>(post?.readMins ?? 5);
  const [isPublished, setIsPublished] = useState<boolean>(
    post?.isPublished ?? true,
  );
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    post?.metaDescription ?? "",
  );
  const [sections, setSections] = useState<Section[]>(
    post?.body?.length
      ? post.body.map((s) => ({
          heading: s.heading ?? "",
          paragraphs: s.paragraphs.length ? s.paragraphs : [""],
        }))
      : [{ heading: "", paragraphs: [""] }],
  );
  const [links, setLinks] = useState<RelatedLink[]>(
    post?.relatedLinks?.length ? post.relatedLinks : [],
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(generateSlug(val));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      setCoverImage(json.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ---- Section helpers ----------------------------------------------------
  function updateSection(i: number, patch: Partial<Section>) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }
  function addSection() {
    setSections((prev) => [...prev, { heading: "", paragraphs: [""] }]);
  }
  function removeSection(i: number) {
    setSections((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveSection(i: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function updateParagraph(si: number, pi: number, val: string) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, paragraphs: s.paragraphs.map((p, j) => (j === pi ? val : p)) }
          : s,
      ),
    );
  }
  function addParagraph(si: number) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === si ? { ...s, paragraphs: [...s.paragraphs, ""] } : s,
      ),
    );
  }
  function removeParagraph(si: number, pi: number) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, paragraphs: s.paragraphs.filter((_, j) => j !== pi) }
          : s,
      ),
    );
  }

  // ---- Link helpers -------------------------------------------------------
  function updateLink(i: number, patch: Partial<RelatedLink>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLink() {
    setLinks((prev) => [...prev, { label: "", href: "" }]);
  }
  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ---- Submit -------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return toast.error("Title is required");
    if (!excerpt.trim()) return toast.error("Excerpt is required");
    if (!coverImage.trim()) return toast.error("A cover image is required");

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      coverImage: coverImage.trim(),
      readMins: Number(readMins) || 5,
      isPublished,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      body: sections.map((s) => ({
        heading: s.heading.trim() || undefined,
        paragraphs: s.paragraphs.map((p) => p.trim()).filter(Boolean),
      })),
      relatedLinks: links
        .map((l) => ({ label: l.label.trim(), href: l.href.trim() }))
        .filter((l) => l.label && l.href),
    };

    setSaving(true);
    try {
      const url =
        mode === "edit" ? `/api/admin/blog/${post!.id}` : "/api/admin/blog";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to save post");
        return;
      }
      // The API returns a raw prisma row; map into AdminBlogPost shape.
      onSaved({
        id: json.id,
        slug: json.slug,
        title: json.title,
        excerpt: json.excerpt,
        coverImage: json.coverImage,
        body: payload.body
          .filter((s) => s.heading || s.paragraphs.length)
          .map((s) => (s.heading ? { heading: s.heading, paragraphs: s.paragraphs } : { paragraphs: s.paragraphs })),
        relatedLinks: payload.relatedLinks,
        readMins: json.readMins,
        isPublished: json.isPublished,
        metaTitle: json.metaTitle ?? null,
        metaDescription: json.metaDescription ?? null,
        publishedAt:
          typeof json.publishedAt === "string"
            ? json.publishedAt
            : new Date(json.publishedAt).toISOString(),
      });
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-slate-900 font-sans">
            {mode === "edit" ? "Edit post" : "New post"}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create post"}
        </button>
      </div>

      {/* Basics */}
      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-700 mb-4">Basics</p>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="How to Style a Kundan Necklace Set"
              className={inputCls}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={labelCls}>Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                placeholder="auto-generated from title"
                className={`${inputCls} font-mono text-slate-600`}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Read time (mins)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={readMins}
                onChange={(e) => setReadMins(parseInt(e.target.value) || 1)}
                className={inputCls}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>
              Excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary shown on the Journal index and as the meta description fallback."
              rows={3}
              className={textareaCls}
              disabled={saving}
            />
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>
              Cover image <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Paste an image URL, or upload →"
                className={inputCls}
                disabled={saving || uploading}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={saving || uploading}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading ? "Uploading…" : "Browse"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  e.target.files?.[0] && handleUpload(e.target.files[0])
                }
              />
            </div>
            {coverImage && (
              <div className="mt-1.5 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="h-16 w-24 rounded-lg object-cover border border-gray-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  disabled={saving || uploading}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">
              PNG, JPG or WebP — max 5 MB. Uploads go to your Cloudinary library.
            </p>
          </div>

          {/* Published toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
              disabled={saving}
            />
            <span className="text-sm text-slate-700 font-medium">
              Published{" "}
              <span className="text-slate-400 font-normal">
                — uncheck to save as a draft (hidden from the live blog)
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Body sections */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Article body</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Each section has an optional heading and one or more paragraphs.
            </p>
          </div>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section, si) => (
            <div
              key={si}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <GripVertical className="h-3.5 w-3.5" />
                  Section {si + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(si, -1)}
                    disabled={si === 0}
                    className="px-2 h-7 rounded border border-gray-200 text-xs text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Move section up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(si, 1)}
                    disabled={si === sections.length - 1}
                    className="px-2 h-7 rounded border border-gray-200 text-xs text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Move section down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(si)}
                    disabled={sections.length === 1}
                    className="inline-flex items-center gap-1 px-2 h-7 rounded border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Remove section"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={section.heading}
                onChange={(e) => updateSection(si, { heading: e.target.value })}
                placeholder="Heading (optional — leave blank for an intro section)"
                className={inputCls}
                disabled={saving}
              />

              <div className="space-y-2">
                {section.paragraphs.map((para, pi) => (
                  <div key={pi} className="flex gap-2 items-start">
                    <textarea
                      value={para}
                      onChange={(e) => updateParagraph(si, pi, e.target.value)}
                      placeholder={`Paragraph ${pi + 1}`}
                      rows={3}
                      className={textareaCls}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => removeParagraph(si, pi)}
                      disabled={section.paragraphs.length === 1}
                      className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Remove paragraph"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addParagraph(si)}
                  className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg border border-gray-200 text-xs font-medium text-slate-600 hover:bg-white hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Add paragraph
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related links */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Shop the Story</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Optional internal links shown at the foot of the article.
            </p>
          </div>
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add link
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No links added.</p>
        ) : (
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(i, { label: e.target.value })}
                  placeholder="Label, e.g. Kundan necklace sets"
                  className={inputCls}
                  disabled={saving}
                />
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => updateLink(i, { href: e.target.value })}
                  placeholder="/shop?style=kundan"
                  className={`${inputCls} font-mono text-slate-600`}
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO */}
      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-700 mb-1">SEO (optional)</p>
        <p className="text-xs text-gray-400 mb-4">
          Leave blank to fall back to the title and excerpt.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Meta title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Defaults to the post title"
              className={inputCls}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Meta description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Defaults to the excerpt"
              rows={2}
              className={textareaCls}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 pb-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create post"}
        </button>
      </div>
    </form>
  );
}
