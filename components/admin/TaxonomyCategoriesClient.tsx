"use client";

import { Fragment, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Upload,
  Loader2,
  Check,
  X,
  Layers,
  Plus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Focal-point helpers (matches ShopTaxonomyManager)
// ---------------------------------------------------------------------------
const FOCAL_POSITION: Record<string, string> = {
  north_west: "0% 0%",
  north: "50% 0%",
  north_east: "100% 0%",
  west: "0% 50%",
  center: "50% 50%",
  east: "100% 50%",
  south_west: "0% 100%",
  south: "50% 100%",
  south_east: "100% 100%",
};

const FOCAL_GRID: [string, string, string][] = [
  ["north_west", "north", "north_east"],
  ["west", "center", "east"],
  ["south_west", "south", "south_east"],
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SubCat {
  id: string;
  label: string;
  slug: string;
  blurb: string | null;
  coverImage: string | null;
  coverFocal: string | null;
  showInMenu: boolean;
  sortOrder: number;
}

interface MainCat extends SubCat {
  children: SubCat[];
}

interface Props {
  groupId: string;
  initialCategories: MainCat[];
}

// ---------------------------------------------------------------------------
// Inline edit form
// ---------------------------------------------------------------------------
interface EditFormData {
  label: string;
  blurb: string;
  coverImage: string;
  coverFocal: string;
  showInMenu: boolean;
}

interface EditFormProps {
  initial: EditFormData;
  onSave: (data: EditFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function EditForm({ initial, onSave, onCancel, saving }: EditFormProps) {
  const [label, setLabel] = useState(initial.label);
  const [blurb, setBlurb] = useState(initial.blurb);
  const [coverImage, setCoverImage] = useState(initial.coverImage);
  const [coverFocal, setCoverFocal] = useState(initial.coverFocal || "center");
  const [showInMenu, setShowInMenu] = useState(initial.showInMenu);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Upload failed"); return; }
      setCoverImage(json.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { toast.error("Label is required"); return; }
    await onSave({ label: label.trim(), blurb: blurb.trim(), coverImage: coverImage.trim(), coverFocal, showInMenu });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Label */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Necklace Set"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            autoFocus
            disabled={saving}
          />
        </div>

        {/* Show in menu */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Show in menu</label>
          <button
            type="button"
            onClick={() => setShowInMenu((v) => !v)}
            disabled={saving}
            role="switch"
            aria-checked={showInMenu}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 cursor-pointer ${showInMenu ? "bg-primary" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${showInMenu ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className="text-[11px] text-gray-400">
            {showInMenu ? "Visible in the navigation mega-menu." : "Hidden from the mega-menu."}
          </span>
        </div>
      </div>

      {/* Blurb */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Blurb</label>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="Short description shown on category pages…"
          rows={2}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
          disabled={saving}
        />
      </div>

      {/* Cover image + focal-point picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cover image</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
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
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading…" : "Browse"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </div>

        {/* Preview + focal-point picker */}
        {coverImage && (
          <div className="mt-2 flex items-start gap-4">
            <img
              src={coverImage}
              alt="Cover preview"
              // eslint-disable-next-line @next/next/no-img-element
              className="h-24 w-24 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0"
              style={{ objectPosition: FOCAL_POSITION[coverFocal] ?? "50% 50%" }}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Focal point</span>
              <div className="grid grid-cols-3 gap-0.5 w-[76px]">
                {FOCAL_GRID.map((row) =>
                  row.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setCoverFocal(slug)}
                      disabled={saving}
                      title={slug.replace(/_/g, " ")}
                      className={`h-6 w-6 rounded-sm border cursor-pointer disabled:cursor-not-allowed ${
                        coverFocal === slug
                          ? "bg-slate-900 border-slate-900"
                          : "bg-slate-200 border-slate-200 hover:bg-slate-300"
                      }`}
                    />
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setCoverImage("")}
                disabled={saving || uploading}
                className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-60 cursor-pointer mt-1"
              >
                Remove
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG or WebP — max 5 MB. Uploads go to your Cloudinary library.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Add category / subcategory inline form
// ---------------------------------------------------------------------------
interface AddFormProps {
  groupId: string;
  parentId?: string | null;
  onAdded: (cat: MainCat | SubCat, parentId: string | null) => void;
  onCancel: () => void;
}

function AddCategoryForm({ groupId, parentId = null, onAdded, onCancel }: AddFormProps) {
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) { toast.error("Label is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/taxonomy/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, parentId, label: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to create"); return; }
      const raw = json.term as SubCat & { children?: SubCat[] };
      onAdded({ ...raw, children: raw.children ?? [] } as MainCat, parentId);
      toast.success(`"${trimmed}" created`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={parentId ? "Subcategory name" : "Category name"}
        className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors flex-1 min-w-[160px]"
        autoFocus
        disabled={saving}
      />
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
      >
        <Check className="h-3.5 w-3.5" />
        {saving ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Cover thumbnail helper
// ---------------------------------------------------------------------------
function Thumb({ src, alt, size = 64, focal }: { src: string | null; alt: string; size?: number; focal?: string | null }) {
  if (!src) {
    return (
      <div
        className="rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 shrink-0"
        style={{ width: size, height: size }}
      >
        <Layers className="h-5 w-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0"
      style={{ width: size, height: size, objectPosition: focal ? (FOCAL_POSITION[focal] ?? "50% 50%") : "50% 50%" }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function TaxonomyCategoriesClient({ groupId, initialCategories }: Props) {
  const [categories, setCategories] = useState<MainCat[]>(initialCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [addingMain, setAddingMain] = useState(false);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);

  // ---- helpers --------------------------------------------------------------

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function applyTermUpdate(updated: MainCat | SubCat, parentId: string | null) {
    setCategories((prev) =>
      prev.map((main) => {
        if (parentId === null) {
          return main.id === updated.id ? ({ ...main, ...updated } as MainCat) : main;
        }
        if (main.id === parentId) {
          return { ...main, children: main.children.map((sub) => sub.id === updated.id ? { ...sub, ...updated } : sub) };
        }
        return main;
      })
    );
  }

  function handleAdded(cat: MainCat | SubCat, parentId: string | null) {
    if (parentId === null) {
      setCategories((prev) => [...prev, cat as MainCat]);
      setAddingMain(false);
    } else {
      setCategories((prev) =>
        prev.map((main) =>
          main.id === parentId ? { ...main, children: [...main.children, cat as SubCat] } : main
        )
      );
      setAddingSubFor(null);
      setExpandedIds((prev) => new Set([...prev, parentId]));
    }
  }

  // ---- save handler ---------------------------------------------------------
  async function handleSave(termId: string, parentId: string | null, data: EditFormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/taxonomy/terms/${termId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: data.label,
          blurb: data.blurb || null,
          coverImage: data.coverImage || null,
          coverFocal: data.coverFocal || "center",
          showInMenu: data.showInMenu,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to save"); return; }
      applyTermUpdate(json.term as MainCat | SubCat, parentId);
      setEditingId(null);
      toast.success(`"${data.label}" saved`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  // ---- quick showInMenu toggle ----------------------------------------------
  async function handleMenuToggle(term: MainCat | SubCat, parentId: string | null) {
    const next = !term.showInMenu;
    setTogglingId(term.id);
    applyTermUpdate({ ...term, showInMenu: next }, parentId);
    try {
      const res = await fetch(`/api/admin/taxonomy/terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInMenu: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        applyTermUpdate({ ...term, showInMenu: term.showInMenu }, parentId);
        toast.error(json.error ?? "Failed to update");
        return;
      }
      toast.success(next ? `"${term.label}" now shows in the menu` : `"${term.label}" hidden from the menu`);
    } catch {
      applyTermUpdate({ ...term, showInMenu: term.showInMenu }, parentId);
      toast.error("Network error — please try again");
    } finally {
      setTogglingId(null);
    }
  }

  // ---- sub-row render -------------------------------------------------------
  function renderSubRow(sub: SubCat, parentId: string) {
    const isEditing = editingId === sub.id;
    return (
      <Fragment key={sub.id}>
        <tr className="bg-gray-50/60 hover:bg-gray-50 transition-colors duration-100">
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-3 pl-4 sm:pl-8">
              <Thumb src={sub.coverImage} alt={sub.label} size={48} focal={sub.coverFocal} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 leading-tight">{sub.label}</p>
                <p className="text-xs font-mono text-slate-400 truncate">{sub.slug}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-2.5 text-center hidden sm:table-cell">
            <button
              type="button"
              onClick={() => handleMenuToggle(sub, parentId)}
              disabled={togglingId === sub.id}
              role="switch"
              aria-checked={sub.showInMenu}
              aria-label={`${sub.showInMenu ? "Hide" : "Show"} ${sub.label} in menu`}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 cursor-pointer ${sub.showInMenu ? "bg-primary" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${sub.showInMenu ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </td>
          <td className="px-4 py-2.5 text-right">
            <button
              onClick={() => setEditingId(isEditing ? null : sub.id)}
              className="inline-flex items-center gap-1 px-3 h-9 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer"
              aria-label={`Edit ${sub.label}`}
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </td>
        </tr>

        {isEditing && (
          <tr key={`${sub.id}-edit`} className="bg-blue-50/40">
            <td colSpan={3} className="px-4 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Editing subcategory: {sub.label}
              </p>
              <EditForm
                initial={{ label: sub.label, blurb: sub.blurb ?? "", coverImage: sub.coverImage ?? "", coverFocal: sub.coverFocal ?? "center", showInMenu: sub.showInMenu }}
                onSave={(data) => handleSave(sub.id, parentId, data)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            </td>
          </tr>
        )}
      </Fragment>
    );
  }

  // ---- render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">
            Taxonomy-based categories. Edit cover images, labels, and visibility — or add new ones.
          </p>
        </div>
        {!addingMain && groupId && (
          <button
            onClick={() => { setAddingMain(true); setEditingId(null); setAddingSubFor(null); }}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        )}
      </div>

      {/* Add main category form */}
      {addingMain && groupId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">New main category</p>
          <AddCategoryForm
            groupId={groupId}
            parentId={null}
            onAdded={handleAdded}
            onCancel={() => setAddingMain(false)}
          />
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Layers className="h-8 w-8 opacity-40" />
            <p className="text-sm">No taxonomy categories yet. Use the button above to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Category
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-center w-28 hidden sm:table-cell">
                    In menu
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-right w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((main) => {
                  const isExpanded = expandedIds.has(main.id);
                  const isEditing = editingId === main.id;
                  const isAddingSub = addingSubFor === main.id;
                  const subCount = main.children.length;

                  return (
                    <Fragment key={main.id}>
                      {/* Main category row */}
                      <tr className="hover:bg-gray-50/70 transition-colors duration-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Thumb src={main.coverImage} alt={main.label} size={56} focal={main.coverFocal} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 leading-tight">{main.label}</p>
                              <p className="text-xs font-mono text-slate-400 truncate mt-0.5">{main.slug}</p>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {subCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(main.id)}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    {isExpanded ? "Hide" : `${subCount} sub${subCount === 1 ? "category" : "categories"}`}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSubFor(isAddingSub ? null : main.id);
                                    setEditingId(null);
                                    if (!isExpanded) toggleExpand(main.id);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add sub
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* show in menu toggle */}
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <button
                            type="button"
                            onClick={() => handleMenuToggle(main, null)}
                            disabled={togglingId === main.id}
                            role="switch"
                            aria-checked={main.showInMenu}
                            aria-label={`${main.showInMenu ? "Hide" : "Show"} ${main.label} in menu`}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 cursor-pointer ${main.showInMenu ? "bg-primary" : "bg-gray-300"}`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${main.showInMenu ? "translate-x-5" : "translate-x-0.5"}`} />
                          </button>
                        </td>

                        {/* actions */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditingId(isEditing ? null : main.id)}
                            className="inline-flex items-center gap-1 px-3 h-9 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            aria-label={`Edit ${main.label}`}
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        </td>
                      </tr>

                      {/* Inline edit row */}
                      {isEditing && (
                        <tr key={`${main.id}-edit`} className="bg-blue-50/40">
                          <td colSpan={3} className="px-4 py-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Editing: {main.label}</p>
                            <EditForm
                              initial={{ label: main.label, blurb: main.blurb ?? "", coverImage: main.coverImage ?? "", coverFocal: main.coverFocal ?? "center", showInMenu: main.showInMenu }}
                              onSave={(data) => handleSave(main.id, null, data)}
                              onCancel={() => setEditingId(null)}
                              saving={saving}
                            />
                          </td>
                        </tr>
                      )}

                      {/* Add subcategory row */}
                      {isAddingSub && (
                        <tr key={`${main.id}-addsub`} className="bg-emerald-50/40">
                          <td colSpan={3} className="px-4 py-3 sm:pl-12">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New subcategory under {main.label}</p>
                            <AddCategoryForm
                              groupId={groupId}
                              parentId={main.id}
                              onAdded={handleAdded}
                              onCancel={() => setAddingSubFor(null)}
                            />
                          </td>
                        </tr>
                      )}

                      {/* Subcategory rows */}
                      {isExpanded && main.children.map((sub) => renderSubRow(sub, main.id))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <p className="text-xs text-slate-400">
          {categories.length} main {categories.length === 1 ? "category" : "categories"},{" "}
          {categories.reduce((n, m) => n + m.children.length, 0)} subcategories total
        </p>
      )}
    </div>
  );
}
