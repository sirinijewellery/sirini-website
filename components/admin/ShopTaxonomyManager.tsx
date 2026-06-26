"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Loader2,
  X,
  Check,
  Layers,
  CornerDownRight,
  Lock,
} from "lucide-react";
import type { TaxonomyGroupData, TaxonomyTermData } from "@/lib/taxonomy";

// ───────────────────────────────────────────────────────────────────────────
// Shared upload helper — POST FormData {file} → { url }.
// ───────────────────────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string | null> {
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
      return null;
    }
    return json.url as string;
  } catch {
    toast.error("Network error during upload");
    return null;
  }
}

// Maps Cloudinary focal-point slug → CSS object-position value.
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

// A small browse-to-upload control with a thumbnail preview + remove + focal-point picker.
function CoverImageField({
  value,
  onChange,
  focal,
  onFocalChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  focal: string;
  onFocalChange: (f: string) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (url) {
      onChange(url);
      toast.success("Image uploaded");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        Cover image
      </label>
      <div className="flex items-center gap-2">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Cover preview"
            className="h-32 w-32 rounded-lg object-cover border border-slate-200 bg-slate-50"
            style={{ objectPosition: FOCAL_POSITION[focal] ?? "50% 50%" }}
          />
        ) : (
          <div className="h-32 w-32 rounded-lg border border-dashed border-slate-300 bg-slate-50 grid place-items-center text-slate-300">
            <Layers className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Uploading…" : value ? "Replace" : "Browse"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled || uploading}
              className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-60 cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div className="flex flex-col gap-1 mt-0.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Focal point
        </label>
        <div className="grid grid-cols-3 gap-0.5 w-[76px]">
          {FOCAL_GRID.map((row) =>
            row.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => onFocalChange(slug)}
                disabled={disabled}
                title={slug.replace(/_/g, " ")}
                className={`h-6 w-6 rounded-sm border cursor-pointer disabled:cursor-not-allowed ${
                  focal === slug
                    ? "bg-slate-900 border-slate-900"
                    : "bg-slate-200 border-slate-200"
                }`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Term editor — inline form for both add (no `initial`) and edit.
// ───────────────────────────────────────────────────────────────────────────
interface TermDraft {
  label: string;
  blurb: string;
  coverImage: string;
  coverFocal: string;
  showInMenu: boolean;
}

function TermForm({
  initial,
  onSave,
  onCancel,
  saving,
  submitLabel = "Save",
  autoFocus = true,
}: {
  initial?: Partial<TermDraft>;
  onSave: (draft: TermDraft) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [blurb, setBlurb] = useState(initial?.blurb ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [coverFocal, setCoverFocal] = useState(initial?.coverFocal ?? "center");
  const [showInMenu, setShowInMenu] = useState(initial?.showInMenu ?? true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    await onSave({
      label: label.trim(),
      blurb: blurb.trim(),
      coverImage: coverImage.trim(),
      coverFocal,
      showInMenu,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Jhumkas"
            autoFocus={autoFocus}
            disabled={saving}
            className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
          />
          <span className="text-[11px] text-slate-400">
            The web address is generated from this automatically.
          </span>
        </div>
        <div className="flex items-end pb-1">
          <button
            type="button"
            onClick={() => setShowInMenu((v) => !v)}
            disabled={saving}
            role="switch"
            aria-checked={showInMenu}
            className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer disabled:opacity-60"
          >
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                showInMenu ? "bg-slate-900" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  showInMenu ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
            Show in Shop menu
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Blurb
        </label>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="Short description shown on category pages and menus."
          rows={2}
          disabled={saving}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors resize-y"
        />
      </div>

      <CoverImageField
        value={coverImage}
        onChange={setCoverImage}
        focal={coverFocal}
        onFocalChange={setCoverFocal}
        disabled={saving}
      />

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Main manager
// ───────────────────────────────────────────────────────────────────────────
export function ShopTaxonomyManager({
  initialGroups,
}: {
  initialGroups: TaxonomyGroupData[];
}) {
  const [groups, setGroups] = useState<TaxonomyGroupData[]>(initialGroups);
  const [activeGroupId, setActiveGroupId] = useState<string>(
    initialGroups[0]?.id ?? ""
  );
  const [busy, setBusy] = useState(false);
  // Which "add term" / "add sub" / "edit term" form is open. Keyed by a string.
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [addingDimension, setAddingDimension] = useState(false);

  const activeGroup =
    groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  // Re-pull the whole tree from the server — used as the source of truth after
  // any mutation so sortOrder / nesting always reflect the DB.
  async function refetch() {
    try {
      const res = await fetch("/api/admin/taxonomy");
      const json = await res.json();
      if (res.ok && Array.isArray(json.groups)) {
        setGroups(json.groups as TaxonomyGroupData[]);
        return true;
      }
    } catch {
      /* fall through */
    }
    return false;
  }

  // ── Terms ────────────────────────────────────────────────────────────────
  async function createTerm(
    groupId: string,
    parentId: string | null,
    draft: TermDraft
  ) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/taxonomy/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          parentId,
          label: draft.label,
          blurb: draft.blurb || null,
          coverImage: draft.coverImage || null,
          coverFocal: draft.coverFocal || "center",
          showInMenu: draft.showInMenu,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to add term");
        return;
      }
      await refetch();
      setOpenForm(null);
      toast.success(`"${json.term.label}" added`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function updateTerm(termId: string, draft: TermDraft) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/taxonomy/terms/${termId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label,
          blurb: draft.blurb || null,
          coverImage: draft.coverImage || null,
          coverFocal: draft.coverFocal || "center",
          showInMenu: draft.showInMenu,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update term");
        return;
      }
      await refetch();
      setOpenForm(null);
      toast.success(`"${json.term.label}" updated`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  // Quick toggle showInMenu without opening the editor (optimistic).
  async function toggleTermMenu(term: TaxonomyTermData) {
    const next = !term.showInMenu;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/taxonomy/terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInMenu: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update");
        return;
      }
      await refetch();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTerm(term: TaxonomyTermData) {
    const childCount = term.children.length;
    const warn = childCount
      ? `\n\nThis also removes its ${childCount} sub-${
          childCount === 1 ? "category" : "categories"
        }.`
      : "";
    if (
      !window.confirm(
        `Delete "${term.label}"?${warn}\n\nProducts using it will lose this tag.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/taxonomy/terms/${term.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete term");
        return;
      }
      await refetch();
      toast.success(`"${term.label}" deleted`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  // Reorder within a sibling list by swapping sortOrder with the neighbour.
  async function reorderTerm(
    siblings: TaxonomyTermData[],
    index: number,
    dir: -1 | 1
  ) {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const a = siblings[index];
    const b = siblings[target];
    setBusy(true);
    try {
      // Swap their sortOrder values. If they happen to be equal, nudge by 1.
      const aOrder = a.sortOrder;
      const bOrder = b.sortOrder === a.sortOrder ? a.sortOrder + dir : b.sortOrder;
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/taxonomy/terms/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: bOrder }),
        }),
        fetch(`/api/admin/taxonomy/terms/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: aOrder }),
        }),
      ]);
      if (!r1.ok || !r2.ok) {
        toast.error("Failed to reorder");
        return;
      }
      await refetch();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  // ── Groups (dimensions) ────────────────────────────────────────────────────
  async function createGroup(draft: {
    label: string;
    hierarchical: boolean;
    showInMenu: boolean;
  }) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to add dimension");
        return;
      }
      await refetch();
      setActiveGroupId(json.group.id);
      setAddingDimension(false);
      toast.success(`Dimension "${json.group.label}" created`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function toggleGroupMenu(group: TaxonomyGroupData) {
    const next = !group.showInMenu;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/taxonomy/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInMenu: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update");
        return;
      }
      await refetch();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup(group: TaxonomyGroupData) {
    if (group.isSystem) return;
    const hasTerms = group.terms.length > 0;
    if (
      !window.confirm(
        hasTerms
          ? `Delete the "${group.label}" dimension and all of its terms? This can't be undone.`
          : `Delete the "${group.label}" dimension?`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/taxonomy/groups/${group.id}${
          hasTerms ? "?cascade=true" : ""
        }`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete dimension");
        return;
      }
      const remaining = groups.filter((g) => g.id !== group.id);
      await refetch();
      if (activeGroupId === group.id) {
        setActiveGroupId(remaining[0]?.id ?? "");
      }
      toast.success(`Dimension "${group.label}" deleted`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  if (!activeGroup) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <p className="text-sm text-slate-500">No dimensions yet.</p>
        <AddDimensionPanel
          open={addingDimension}
          setOpen={setAddingDimension}
          onCreate={createGroup}
          busy={busy}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Dimension tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setActiveGroupId(g.id);
              setOpenForm(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              g.id === activeGroup.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {g.label}
            {g.isSystem && (
              <Lock
                className={`h-3 w-3 ${
                  g.id === activeGroup.id ? "text-white/60" : "text-slate-300"
                }`}
              />
            )}
          </button>
        ))}
        <button
          onClick={() => setAddingDimension((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add dimension
        </button>
      </div>

      <AddDimensionPanel
        open={addingDimension}
        setOpen={setAddingDimension}
        onCreate={createGroup}
        busy={busy}
      />

      {/* Active dimension card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {activeGroup.label}
              </h2>
              {activeGroup.isSystem && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" /> System
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeGroup.hierarchical
                ? "Hierarchical — main categories with nested sub-categories."
                : "Flat list of terms."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Group showInMenu quick toggle */}
            <button
              type="button"
              onClick={() => toggleGroupMenu(activeGroup)}
              disabled={busy}
              role="switch"
              aria-checked={activeGroup.showInMenu}
              title="Show this dimension in the Shop menu"
              className="inline-flex items-center gap-2 text-xs text-slate-500 cursor-pointer disabled:opacity-60"
            >
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  activeGroup.showInMenu ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    activeGroup.showInMenu ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
              In menu
            </button>
            {!activeGroup.isSystem && (
              <button
                onClick={() => deleteGroup(activeGroup)}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Delete dimension
              </button>
            )}
          </div>
        </div>

        {/* Term list */}
        {activeGroup.terms.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-2">
            No terms yet — add the first one below.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeGroup.terms.map((term, i) => (
              <li key={term.id}>
                <TermRow
                  term={term}
                  index={i}
                  siblings={activeGroup.terms}
                  hierarchical={activeGroup.hierarchical}
                  busy={busy}
                  openForm={openForm}
                  setOpenForm={setOpenForm}
                  onReorder={(dir) => reorderTerm(activeGroup.terms, i, dir)}
                  onToggleMenu={() => toggleTermMenu(term)}
                  onDelete={() => deleteTerm(term)}
                  onEdit={(draft) => updateTerm(term.id, draft)}
                  onAddSub={(draft) => createTerm(activeGroup.id, term.id, draft)}
                  onReorderChild={(children, idx, dir) =>
                    reorderTerm(children, idx, dir)
                  }
                  onToggleChildMenu={(child) => toggleTermMenu(child)}
                  onDeleteChild={(child) => deleteTerm(child)}
                  onEditChild={(childId, draft) => updateTerm(childId, draft)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Add a top-level term / main category */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {openForm === `add-root` ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {activeGroup.hierarchical
                  ? "New main category"
                  : `New ${activeGroup.label} term`}
              </p>
              <TermForm
                onSave={(draft) => createTerm(activeGroup.id, null, draft)}
                onCancel={() => setOpenForm(null)}
                saving={busy}
                submitLabel="Add"
              />
            </div>
          ) : (
            <button
              onClick={() => setOpenForm("add-root")}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {activeGroup.hierarchical
                ? "Add main category"
                : `Add ${activeGroup.label.toLowerCase()}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// A single top-level term row (with nested sub-terms for hierarchical groups).
// ───────────────────────────────────────────────────────────────────────────
function TermRow({
  term,
  index,
  siblings,
  hierarchical,
  busy,
  openForm,
  setOpenForm,
  onReorder,
  onToggleMenu,
  onDelete,
  onEdit,
  onAddSub,
  onReorderChild,
  onToggleChildMenu,
  onDeleteChild,
  onEditChild,
}: {
  term: TaxonomyTermData;
  index: number;
  siblings: TaxonomyTermData[];
  hierarchical: boolean;
  busy: boolean;
  openForm: string | null;
  setOpenForm: (k: string | null) => void;
  onReorder: (dir: -1 | 1) => void;
  onToggleMenu: () => void;
  onDelete: () => void;
  onEdit: (draft: TermDraft) => Promise<void>;
  onAddSub: (draft: TermDraft) => Promise<void>;
  onReorderChild: (
    children: TaxonomyTermData[],
    idx: number,
    dir: -1 | 1
  ) => void;
  onToggleChildMenu: (child: TaxonomyTermData) => void;
  onDeleteChild: (child: TaxonomyTermData) => void;
  onEditChild: (childId: string, draft: TermDraft) => Promise<void>;
}) {
  const editing = openForm === `edit-${term.id}`;
  const addingSub = openForm === `addsub-${term.id}`;

  return (
    <div className="rounded-lg border border-slate-200">
      <TermLine
        term={term}
        index={index}
        total={siblings.length}
        busy={busy}
        onReorder={onReorder}
        onToggleMenu={onToggleMenu}
        onEdit={() => setOpenForm(editing ? null : `edit-${term.id}`)}
        onDelete={onDelete}
      />

      {editing && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4">
          <TermForm
            initial={{
              label: term.label,
              blurb: term.blurb ?? "",
              coverImage: term.coverImage ?? "",
              coverFocal: term.coverFocal ?? "center",
              showInMenu: term.showInMenu,
            }}
            onSave={onEdit}
            onCancel={() => setOpenForm(null)}
            saving={busy}
          />
        </div>
      )}

      {/* Sub-categories (hierarchical groups only) */}
      {hierarchical && (
        <div className="border-t border-slate-100 px-3 py-2 space-y-1.5">
          {term.children.length > 0 &&
            term.children.map((child, ci) => {
              const editingChild = openForm === `edit-${child.id}`;
              return (
                <div key={child.id} className="rounded-md border border-slate-100">
                  <div className="flex items-center gap-2 pl-2">
                    <CornerDownRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <div className="flex-1">
                      <TermLine
                        compact
                        term={child}
                        index={ci}
                        total={term.children.length}
                        busy={busy}
                        onReorder={(dir) =>
                          onReorderChild(term.children, ci, dir)
                        }
                        onToggleMenu={() => onToggleChildMenu(child)}
                        onEdit={() =>
                          setOpenForm(editingChild ? null : `edit-${child.id}`)
                        }
                        onDelete={() => onDeleteChild(child)}
                      />
                    </div>
                  </div>
                  {editingChild && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-3">
                      <TermForm
                        initial={{
                          label: child.label,
                          blurb: child.blurb ?? "",
                          coverImage: child.coverImage ?? "",
                          coverFocal: child.coverFocal ?? "center",
                          showInMenu: child.showInMenu,
                        }}
                        onSave={(draft) => onEditChild(child.id, draft)}
                        onCancel={() => setOpenForm(null)}
                        saving={busy}
                      />
                    </div>
                  )}
                </div>
              );
            })}

          {/* Add sub-category under this main */}
          {addingSub ? (
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 ml-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                New sub-category of {term.label}
              </p>
              <TermForm
                onSave={onAddSub}
                onCancel={() => setOpenForm(null)}
                saving={busy}
                submitLabel="Add sub-category"
              />
            </div>
          ) : (
            <button
              onClick={() => setOpenForm(`addsub-${term.id}`)}
              className="inline-flex items-center gap-1.5 ml-5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add sub-category
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// A single label line with cover thumb, toggle, reorder, edit + delete.
function TermLine({
  term,
  index,
  total,
  busy,
  compact = false,
  onReorder,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  term: TaxonomyTermData;
  index: number;
  total: number;
  busy: boolean;
  compact?: boolean;
  onReorder: (dir: -1 | 1) => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "px-2 py-2" : "p-3"}`}>
      {/* Reorder */}
      <div className="flex flex-col">
        <button
          onClick={() => onReorder(-1)}
          disabled={busy || index === 0}
          aria-label="Move up"
          className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onReorder(1)}
          disabled={busy || index === total - 1}
          aria-label="Move down"
          className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thumb */}
      {term.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={term.coverImage}
          alt={term.label}
          className={`${
            compact ? "h-8 w-8" : "h-10 w-10"
          } rounded-md object-cover border border-slate-200 bg-slate-50 shrink-0`}
        />
      ) : (
        <div
          className={`${
            compact ? "h-8 w-8" : "h-10 w-10"
          } rounded-md border border-dashed border-slate-200 bg-slate-50 grid place-items-center text-slate-300 shrink-0`}
        >
          <Layers className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Label + slug + blurb */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-slate-900 truncate ${
              compact ? "text-sm" : "text-sm"
            }`}
          >
            {term.label}
          </span>
          <span className="text-[11px] font-mono text-slate-400 truncate">
            {term.slug}
          </span>
        </div>
        {term.blurb && !compact && (
          <p className="text-xs text-slate-400 truncate">{term.blurb}</p>
        )}
      </div>

      {/* In-menu toggle */}
      <button
        type="button"
        onClick={onToggleMenu}
        disabled={busy}
        role="switch"
        aria-checked={term.showInMenu}
        title={term.showInMenu ? "Showing in Shop menu" : "Hidden from Shop menu"}
        className="inline-flex items-center shrink-0 cursor-pointer disabled:opacity-60"
      >
        <span
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            term.showInMenu ? "bg-slate-900" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              term.showInMenu ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      {/* Edit + delete */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          disabled={busy}
          className="px-2.5 h-7 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          aria-label={`Delete ${term.label}`}
          className="inline-flex items-center justify-center h-7 w-7 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Add-dimension panel
// ───────────────────────────────────────────────────────────────────────────
function AddDimensionPanel({
  open,
  setOpen,
  onCreate,
  busy,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreate: (draft: {
    label: string;
    hierarchical: boolean;
    showInMenu: boolean;
  }) => Promise<void>;
  busy: boolean;
}) {
  const [label, setLabel] = useState("");
  const [hierarchical, setHierarchical] = useState(false);
  const [showInMenu, setShowInMenu] = useState(true);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    await onCreate({ label: label.trim(), hierarchical, showInMenu });
    setLabel("");
    setHierarchical(false);
    setShowInMenu(true);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 mb-3">New dimension</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 max-w-sm">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Metal, Theme…"
            autoFocus
            disabled={busy}
            className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
          />
          <span className="text-[11px] text-slate-400">
            The web address is generated from this automatically.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => setHierarchical((v) => !v)}
            disabled={busy}
            role="switch"
            aria-checked={hierarchical}
            className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer disabled:opacity-60"
          >
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                hierarchical ? "bg-slate-900" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  hierarchical ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
            Hierarchical (allows sub-terms)
          </button>

          <button
            type="button"
            onClick={() => setShowInMenu((v) => !v)}
            disabled={busy}
            role="switch"
            aria-checked={showInMenu}
            className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer disabled:opacity-60"
          >
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                showInMenu ? "bg-slate-900" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  showInMenu ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
            Show in Shop menu
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Hierarchy can&apos;t be changed once the dimension has terms — choose now.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Create dimension
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
