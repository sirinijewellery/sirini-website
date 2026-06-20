"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Pencil, Trash2, X, Check } from "lucide-react";

export interface AdminRow {
  id: string;
  username: string | null;
  email: string;
  name: string | null;
  createdAt: string | Date;
}

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20";

export function AdminsManager({
  initialAdmins,
  currentUserId,
}: {
  initialAdmins: AdminRow[];
  currentUserId: string;
}) {
  const [admins, setAdmins] = useState<AdminRow[]>(initialAdmins);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // create form
  const [newUser, setNewUser] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");

  // edit form
  const [editUser, setEditUser] = useState("");
  const [editPass, setEditPass] = useState("");

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUser, name: newName || undefined, password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create admin"); return; }
      setAdmins((a) => [...a, data]);
      setNewUser(""); setNewName(""); setNewPass("");
      toast.success(`Admin "${data.username}" created`);
    } catch {
      toast.error("Something went wrong");
    } finally { setBusy(false); }
  }

  function startEdit(a: AdminRow) {
    setEditingId(a.id);
    setEditUser(a.username ?? "");
    setEditPass("");
  }

  async function saveEdit(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: editUser || undefined, password: editPass || "" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Update failed"); return; }
      if (data.id) setAdmins((a) => a.map((x) => (x.id === id ? { ...x, ...data } : x)));
      setEditingId(null);
      toast.success("Saved");
    } catch {
      toast.error("Something went wrong");
    } finally { setBusy(false); }
  }

  async function removeAdmin(a: AdminRow) {
    if (!confirm(`Remove admin "${a.username ?? a.email}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${a.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      setAdmins((list) => list.filter((x) => x.id !== a.id));
      toast.success(data.message || "Removed");
    } catch {
      toast.error("Something went wrong");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      {/* Existing admins */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {admins.map((a) => {
          const isYou = a.id === currentUserId;
          const realEmail = a.email.endsWith("@sirini.local") ? null : a.email;
          return (
            <div key={a.id} className="p-4">
              {editingId === a.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                      <input className={input} value={editUser} onChange={(e) => setEditUser(e.target.value)} autoComplete="off" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">New password (optional)</label>
                      <input className={input} type="text" value={editPass} onChange={(e) => setEditPass(e.target.value)} placeholder="Leave blank to keep current" autoComplete="off" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveEdit(a.id)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer">
                      <Check className="h-4 w-4" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">{a.username ?? a.email}</span>
                      {isYou && <span className="text-[10px] uppercase tracking-wide font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">You</span>}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {a.name}{realEmail ? ` · ${realEmail}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    {!isYou && (
                      <button onClick={() => removeAdmin(a)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create new admin */}
      <form onSubmit={createAdmin} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><UserPlus className="h-4 w-4" /> Add a new admin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
            <input className={input} value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="e.g. priya.shah" required autoComplete="off" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Display name (optional)</label>
            <input className={input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Priya Shah" autoComplete="off" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input className={input} type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Set a password" required autoComplete="new-password" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer">
          {busy ? "Working…" : "Create admin"}
        </button>
        <p className="text-xs text-slate-400">Admins sign in with their username (case-insensitive). Usernames use lowercase letters, numbers, dots, hyphens.</p>
      </form>
    </div>
  );
}
