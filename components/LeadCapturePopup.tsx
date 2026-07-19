"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// One-time-per-browser email capture. Renders nothing until a ~8s timer fires
// on a visitor's first ever visit, then opens an elegant, compact dialog.
// The localStorage flag `sirini_lead_popup_done` is set both when the visitor
// subscribes AND when they dismiss, so the popup is shown at most once, ever.
// Mirrors AbandonedCartNudge's timer + guarded-storage structure (all storage
// access wrapped in try/catch for privacy mode / blocked storage).

const DONE_FLAG = "sirini_lead_popup_done";
const OPEN_DELAY_MS = 8_000;

// Module-level (survives client-side navigations, resets on full reload). Guards
// against a re-show within the same SPA session when the localStorage write
// failed — e.g. private mode / blocked storage — so we don't nag repeatedly.
let shownThisSession = false;

export function LeadCapturePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isExcludedPage =
    pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // On navigating INTO an excluded page, close an already-open dialog too —
    // not just suppress opening a new one.
    if (isExcludedPage) {
      setOpen(false);
      return;
    }

    // Already shown this SPA session — don't re-arm even if the storage write
    // failed (private mode). Belt-and-braces with the localStorage flag below.
    if (shownThisSession) return;

    // Only ever show once per browser. Storage access can throw
    // (private mode / blocked storage) — never crash, just bail.
    try {
      if (localStorage.getItem(DONE_FLAG)) return;
    } catch {
      return;
    }

    const timer = window.setTimeout(() => {
      // Re-check the guards at fire time — a submit elsewhere or a second
      // mount may have set the flag since the timer was armed.
      if (shownThisSession) return;
      try {
        if (localStorage.getItem(DONE_FLAG)) return;
      } catch {
        // Storage unreadable (private mode) — still show once for this session.
      }
      shownThisSession = true;
      setOpen(true);
    }, OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isExcludedPage]);

  // Persist the one-time flag and close. Called on both dismiss and success.
  function markDone() {
    try {
      localStorage.setItem(DONE_FLAG, "1");
    } catch {
      // Non-fatal — worst case the popup could reappear next session.
    }
  }

  function handleOpenChange(next: boolean) {
    // Any close (X or backdrop click) counts as "seen" — never nag again.
    if (!next) {
      markDone();
      setOpen(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });

      if (res.ok) {
        toast.success("You're on the list — welcome to Sirini.");
        markDone();
        setEmail("");
        setOpen(false);
      } else if (res.status === 429) {
        toast.error("That's a few tries in a row — please try again shortly.");
      } else {
        // 400 (invalid email) or any other non-ok — keep it friendly, no raw errors.
        toast.error("Please enter a valid email address.");
      }
    } catch {
      toast.error("Couldn't reach us just now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-8 bg-background text-center">
        <DialogHeader className="items-center gap-3">
          <DialogTitle className="font-display text-2xl text-on-surface leading-tight">
            Welcome to Sirini
          </DialogTitle>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            Leave your email and be first to see our new arrivals.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="mt-2 flex flex-col gap-4 text-left"
        >
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address"
            className="w-full bg-transparent border-b border-outline py-3 px-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 text-on-primary font-label-caps text-label-caps font-semibold hover:bg-on-primary-fixed-variant transition-colors duration-300 animate-shimmer-btn disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Adding you…" : "Keep me posted"}
          </button>
        </form>

        <p className="mt-1 font-body-md text-xs text-on-surface-variant/70">
          Occasional updates only. Reply unsubscribe anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
