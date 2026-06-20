"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  initialUsername: string;
  initialName: string;
  initialEmail: string;
}

export function AccountForm({ initialUsername, initialName, initialEmail }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword || confirmPassword) {
      if (newPassword.length < 4) {
        toast.error("New password must be at least 4 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirmation do not match");
        return;
      }
    }
    if (!currentPassword) {
      toast.error("Enter your current password to save changes");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, currentPassword, newPassword: newPassword || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      toast.success(data.message || "Account updated");
      if (data.reauth) {
        toast("Use your new email/password the next time you sign in.", { duration: 7000 });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
      {/* Username + name + email */}
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="acc-username">Username</label>
          <input id="acc-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="e.g. nishit.savla" autoComplete="username" />
          <p className="text-xs text-slate-500 mt-1">You sign in with this (case-insensitive). Lowercase letters, numbers, dots, hyphens.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="acc-name">Display name</label>
          <input id="acc-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
        </div>
        <div>
          <label className={labelClass} htmlFor="acc-email">Login email</label>
          <input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
          <p className="text-xs text-slate-500 mt-1">You can also sign in with this email.</p>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Password change */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            For security, your existing password can&apos;t be shown — it&apos;s stored encrypted. Leave these blank to keep it unchanged.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="acc-newpw">New password</label>
          <input id="acc-newpw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 4 characters" autoComplete="new-password" />
        </div>
        <div>
          <label className={labelClass} htmlFor="acc-confirmpw">Confirm new password</label>
          <input id="acc-confirmpw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Re-type the new password" autoComplete="new-password" />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Confirmation gate */}
      <div>
        <label className={labelClass} htmlFor="acc-currentpw">Current password <span className="text-rose-600">*</span></label>
        <input id="acc-currentpw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="Required to save any change" autoComplete="current-password" required />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-wait cursor-pointer"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
