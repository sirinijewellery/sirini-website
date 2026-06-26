"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, Plus, Palette, ExternalLink } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ColorTerm {
  id: string;
  label: string;
  slug: string;
  hexColor: string | null;
  sortOrder: number;
  showInMenu: boolean;
  productCount: number;
}

interface Props {
  groupId: string;
  initialTerms: ColorTerm[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Swatch({ hex }: { hex: string | null }) {
  return (
    <span
      className="inline-block h-6 w-6 rounded-full border border-gray-200 shadow-sm shrink-0"
      style={{ backgroundColor: hex ?? "#E2E2E2" }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Inline hex editor for a single row
// ---------------------------------------------------------------------------
function HexEditor({
  termId,
  initialHex,
  onSaved,
  onCancel,
}: {
  termId: string;
  initialHex: string | null;
  onSaved: (hex: string | null) => void;
  onCancel: () => void;
}) {
  const [hex, setHex] = useState<string>(initialHex ?? "#000000");
  const [saving, setSaving] = useState(false);

  // Keep the text input and colour picker in sync
  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHex(e.target.value);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setHex(val);
  }

  async function handleSave() {
    // Basic validation: must be a 3- or 6-digit hex colour or empty string
    const trimmed = hex.trim();
    const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
    if (trimmed && !valid) {
      toast.error("Enter a valid hex colour, e.g. #FF5733");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/taxonomy/terms/${termId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hexColor: trimmed || null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error((json as { error?: string }).error ?? "Failed to save colour");
        return;
      }
      toast.success("Colour saved");
      onSaved(trimmed || null);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Native colour picker */}
      <input
        type="color"
        value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex) ? hex : "#000000"}
        onChange={handleColorChange}
        className="h-7 w-7 rounded border border-gray-300 cursor-pointer p-0.5"
        aria-label="Pick colour"
      />
      {/* Hex text input */}
      <input
        type="text"
        value={hex}
        onChange={handleTextChange}
        maxLength={7}
        placeholder="#RRGGBB"
        className="font-mono text-xs w-24 h-7 px-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="Hex colour value"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-green-200 text-xs font-medium text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors disabled:opacity-50 cursor-pointer"
        aria-label="Save colour"
      >
        <Check className="h-3 w-3" />
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-gray-200 text-xs font-medium text-slate-500 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
        aria-label="Cancel"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add-colour inline form
// ---------------------------------------------------------------------------
function AddColourForm({
  groupId,
  onAdded,
  onCancel,
}: {
  groupId: string;
  onAdded: (term: ColorTerm) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("#000000");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      toast.error("Colour name is required");
      return;
    }
    const trimmedHex = hex.trim();
    const hexValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmedHex);
    if (trimmedHex && !hexValid) {
      toast.error("Enter a valid hex colour, e.g. #FF5733");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/taxonomy/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          label: trimmedLabel,
          hexColor: trimmedHex || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error((json as { error?: string }).error ?? "Failed to add colour");
        return;
      }
      const data = await res.json() as { term: { id: string; label: string; slug: string; hexColor: string | null; sortOrder: number; showInMenu: boolean } };
      const newTerm: ColorTerm = {
        id: data.term.id,
        label: data.term.label,
        slug: data.term.slug,
        hexColor: data.term.hexColor,
        sortOrder: data.term.sortOrder,
        showInMenu: data.term.showInMenu,
        productCount: 0,
      };
      toast.success(`Colour "${newTerm.label}" added`);
      onAdded(newTerm);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4"
    >
      <p className="text-sm font-semibold text-slate-700 mb-4">New Colour</p>
      <div className="flex flex-wrap items-end gap-3">
        {/* Label */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="new-colour-label">
            Name
          </label>
          <input
            id="new-colour-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Ruby Red"
            className="text-sm h-9 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
            autoFocus
          />
        </div>

        {/* Hex picker */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="new-colour-hex-text">
            Hex colour
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex) ? hex : "#000000"}
              onChange={(e) => setHex(e.target.value)}
              className="h-9 w-9 rounded border border-gray-300 cursor-pointer p-0.5"
              aria-label="Pick colour"
            />
            <input
              id="new-colour-hex-text"
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              maxLength={7}
              placeholder="#RRGGBB"
              className="font-mono text-sm h-9 px-3 w-28 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Preview swatch */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Preview</span>
          <div className="h-9 flex items-center">
            <Swatch hex={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex) ? hex : null} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "Adding…" : "Add colour"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ColorsClient({ groupId, initialTerms }: Props) {
  const [terms, setTerms] = useState<ColorTerm[]>(initialTerms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function handleHexSaved(id: string, hex: string | null) {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, hexColor: hex } : t))
    );
    setEditingId(null);
  }

  function handleAdded(term: ColorTerm) {
    setTerms((prev) => [term, ...prev]);
    setIsAdding(false);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {!isAdding && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add colour
          </button>
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <AddColourForm
          groupId={groupId}
          onAdded={handleAdded}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {terms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Palette className="h-8 w-8 opacity-40" />
            <p className="font-sans text-sm">
              {groupId
                ? "No colour terms yet. Add one above."
                : "No “colour” taxonomy group found. Create it in the Shop admin first."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left w-10">
                    Swatch
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">
                    Name
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-left hidden md:table-cell">
                    Products
                  </th>
                  <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {terms.map((term) => (
                  <tr
                    key={term.id}
                    className="hover:bg-gray-50/70 transition-colors duration-100"
                  >
                    {/* Swatch */}
                    <td className="px-4 py-3">
                      <Swatch hex={term.hexColor} />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">
                        {term.label}
                      </span>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-slate-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {term.slug}
                      </span>
                    </td>

                    {/* Product count */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {term.productCount}{" "}
                        {term.productCount === 1 ? "product" : "products"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {editingId === term.id ? (
                        <div className="flex justify-end">
                          <HexEditor
                            termId={term.id}
                            initialHex={term.hexColor}
                            onSaved={(hex) => handleHexSaved(term.id, hex)}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setIsAdding(false);
                              setEditingId(term.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            aria-label={`Edit hex for ${term.label}`}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit hex
                          </button>
                          <a
                            href={`/shop?colour=${term.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 h-7 rounded border border-gray-200 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            aria-label={`View products tagged ${term.label}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View products
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {terms.length > 0 && (
        <p className="font-sans text-xs text-slate-400">
          {terms.length} {terms.length === 1 ? "colour" : "colours"} total
        </p>
      )}
    </div>
  );
}
