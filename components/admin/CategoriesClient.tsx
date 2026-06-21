"use client";

import { Fragment, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Check, Tag, Upload, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  showOnHome: boolean;
}

interface Props {
  initialCategories: Category[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Stable sort for the table: homepage order (sortOrder asc) then name.
function sortCategories(list: Category[]): Category[] {
  return [...list].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
  );
}

// ---------------------------------------------------------------------------
// Inline form — used for both Add and Edit
// ---------------------------------------------------------------------------
interface InlineFormData {
  name: string;
  slug: string;
  image: string;
  sortOrder: number;
  showOnHome: boolean;
}

interface InlineFormProps {
  initial?: InlineFormData;
  onSave: (data: InlineFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function InlineForm({ initial, onSave, onCancel, saving }: InlineFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [sortOrder, setSortOrder] = useState<string>(
    initial?.sortOrder != null ? String(initial.sortOrder) : "0"
  );
  const [showOnHome, setShowOnHome] = useState(initial?.showOnHome ?? true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initial?.slug);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      setImage(json.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  }

  function handleSlugChange(val: string) {
    setSlug(val);
    setSlugManuallyEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const order = Number.parseInt(sortOrder, 10);
    await onSave({
      name: name.trim(),
      slug: slug.trim(),
      image: image.trim(),
      sortOrder: Number.isFinite(order) ? Math.max(0, Math.min(9999, order)) : 0,
      showOnHome,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Rings"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            autoFocus
            disabled={saving}
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="auto-generated"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-mono"
            disabled={saving}
          />
        </div>
      </div>

      {/* Image — paste a URL or browse to upload */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Image
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Paste an image URL, or upload →"
            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
        {image && (
          <div className="mt-1.5 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Category preview"
              className="h-12 w-12 rounded-lg object-cover border border-gray-200 bg-gray-50"
            />
            <button
              type="button"
              onClick={() => setImage("")}
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

      {/* Homepage placement — sort order + show-on-home toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Homepage order
          </label>
          <input
            type="number"
            min={0}
            max={9999}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-32"
            disabled={saving}
          />
          <span className="text-[11px] text-gray-400">
            Lower numbers appear first on the homepage grid.
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Show on homepage
          </label>
          <button
            type="button"
            onClick={() => setShowOnHome((v) => !v)}
            disabled={saving}
            role="switch"
            aria-checked={showOnHome}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 cursor-pointer ${
              showOnHome ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                showOnHome ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-[11px] text-gray-400">
            {showOnHome ? "Visible in the homepage Curated Collections grid." : "Hidden from the homepage grid."}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(() =>
    sortCategories(initialCategories)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Tracks rows with an in-flight quick toggle so we can disable the control.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ---- Add ----------------------------------------------------------------
  async function handleAdd(data: InlineFormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create category");
        return;
      }
      setCategories((prev) => sortCategories([...prev, json as Category]));
      setIsAdding(false);
      toast.success(`Category "${json.name}" created`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  // ---- Edit ---------------------------------------------------------------
  async function handleEdit(id: string, data: InlineFormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update category");
        return;
      }
      setCategories((prev) =>
        sortCategories(prev.map((c) => (c.id === id ? (json as Category) : c)))
      );
      setEditingId(null);
      toast.success(`Category "${json.name}" updated`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  // ---- Quick toggle: show on homepage (no full edit needed) ---------------
  async function handleToggleHome(category: Category) {
    const next = !category.showOnHome;
    setTogglingId(category.id);
    // Optimistic update
    setCategories((prev) =>
      sortCategories(
        prev.map((c) => (c.id === category.id ? { ...c, showOnHome: next } : c))
      )
    );
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Revert on failure
        setCategories((prev) =>
          sortCategories(
            prev.map((c) =>
              c.id === category.id ? { ...c, showOnHome: category.showOnHome } : c
            )
          )
        );
        toast.error(json.error ?? "Failed to update");
        return;
      }
      toast.success(
        next
          ? `"${category.name}" now shows on the homepage`
          : `"${category.name}" hidden from the homepage`
      );
    } catch {
      setCategories((prev) =>
        sortCategories(
          prev.map((c) =>
            c.id === category.id ? { ...c, showOnHome: category.showOnHome } : c
          )
        )
      );
      toast.error("Network error — please try again");
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Quick edit: homepage sort order ------------------------------------
  async function handleSortOrderChange(category: Category, raw: string) {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? Math.max(0, Math.min(9999, parsed)) : 0;
    if (next === category.sortOrder) return;
    // Optimistic update
    setCategories((prev) =>
      sortCategories(
        prev.map((c) => (c.id === category.id ? { ...c, sortOrder: next } : c))
      )
    );
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: next }),
      });
      if (!res.ok) {
        const json = await res.json();
        setCategories((prev) =>
          sortCategories(
            prev.map((c) =>
              c.id === category.id ? { ...c, sortOrder: category.sortOrder } : c
            )
          )
        );
        toast.error(json.error ?? "Failed to update order");
      }
    } catch {
      setCategories((prev) =>
        sortCategories(
          prev.map((c) =>
            c.id === category.id ? { ...c, sortOrder: category.sortOrder } : c
          )
        )
      );
      toast.error("Network error — please try again");
    }
  }

  // ---- Delete -------------------------------------------------------------
  async function handleDelete(category: Category) {
    if (
      !window.confirm(
        `Delete category "${category.name}"?\n\nProducts using this category will not be deleted but may appear uncategorised.`
      )
    )
      return;

    setDeletingId(category.id);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to delete category");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success(`Category "${category.name}" deleted`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 font-sans">Categories</h1>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">New Category</p>
          <InlineForm
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Tag className="h-8 w-8 opacity-40" />
            <p className="font-sans text-sm">No categories yet. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Name
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Slug
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden sm:table-cell">
                    Image
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Home order
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-center">
                    On home
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <Fragment key={cat.id}>
                    <tr
                      className="hover:bg-gray-50/70 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {cat.image ? (
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="h-8 w-8 rounded object-cover border border-gray-100"
                            />
                            <span className="text-gray-400 text-xs truncate max-w-[180px]">
                              {cat.image}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">None</span>
                        )}
                      </td>

                      {/* Homepage sort order — editable inline */}
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          defaultValue={cat.sortOrder ?? 0}
                          onBlur={(e) => handleSortOrderChange(cat, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          aria-label={`Homepage order for ${cat.name}`}
                          className="w-16 h-8 px-2 rounded border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        />
                      </td>

                      {/* Show on homepage — quick toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHome(cat)}
                          disabled={togglingId === cat.id}
                          role="switch"
                          aria-checked={cat.showOnHome}
                          aria-label={`${cat.showOnHome ? "Hide" : "Show"} ${cat.name} on homepage`}
                          title={cat.showOnHome ? "Showing on homepage" : "Hidden from homepage"}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 cursor-pointer ${
                            cat.showOnHome ? "bg-primary" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              cat.showOnHome ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setIsAdding(false);
                              setEditingId(editingId === cat.id ? null : cat.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            disabled={deletingId === cat.id}
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                            aria-label={`Delete ${cat.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deletingId === cat.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit row */}
                    {editingId === cat.id && (
                      <tr key={`${cat.id}-edit`} className="bg-gray-50/80">
                        <td colSpan={6} className="px-4 py-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Editing: {cat.name}
                          </p>
                          <InlineForm
                            initial={{
                              name: cat.name,
                              slug: cat.slug,
                              image: cat.image ?? "",
                              sortOrder: cat.sortOrder ?? 0,
                              showOnHome: cat.showOnHome ?? true,
                            }}
                            onSave={(data) => handleEdit(cat.id, data)}
                            onCancel={() => setEditingId(null)}
                            saving={saving}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {categories.length > 0 && (
        <p className="font-sans text-xs text-slate-400">
          {categories.length} {categories.length === 1 ? "category" : "categories"} total
        </p>
      )}
    </div>
  );
}
