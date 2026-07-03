"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MailOpen, Mail, Trash2 } from "lucide-react";

export function MessageActions({
  id,
  isRead,
}: {
  id: string;
  isRead: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleRead() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !isRead }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Could not update the message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this message permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Message deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the message. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={toggleRead}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-sans text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isRead ? (
          <>
            <Mail className="h-3.5 w-3.5" />
            Mark unread
          </>
        ) : (
          <>
            <MailOpen className="h-3.5 w-3.5" />
            Mark read
          </>
        )}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-white font-sans text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
        aria-label="Delete message"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}
