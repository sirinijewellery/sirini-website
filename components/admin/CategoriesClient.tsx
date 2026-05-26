"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Check, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
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

// ---------------------------------------------------------------------------
// Inline form — used for both Add and Edit
// ---------------------------------------------------------------------------
interface InlineFormProps {
  initial?: { name: string; slug: string; image: string };
  onSave: (data: { name: string; slug: string; image: string }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function InlineForm({ initial, onSave, onCancel, saving }: InlineFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initial?.slug);

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
    await onSave({ name: name.trim(), slug: slug.trim(), image: image.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        {/* Image URL */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Image URL
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            disabled={saving}
          />
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
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Add ----------------------------------------------------------------
  async function handleAdd(data: { name: string; slug: string; image: string }) {
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
      setCategories((prev) =>
        [...prev, json as Category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsAdding(false);
      toast.success(`Category "${json.name}" created`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  // ---- Edit ---------------------------------------------------------------
  async function handleEdit(
    id: string,
    data: { name: string; slug: string; image: string }
  ) {
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
        prev
          .map((c) => (c.id === id ? (json as Category) : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      toast.success(`Category "${json.name}" updated`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
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
                        <td colSpan={4} className="px-4 py-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Editing: {cat.name}
                          </p>
                          <InlineForm
                            initial={{
                              name: cat.name,
                              slug: cat.slug,
                              image: cat.image ?? "",
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
