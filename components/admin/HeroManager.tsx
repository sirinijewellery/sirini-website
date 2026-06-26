"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ArrowUp, ArrowDown, Loader2, Eye, EyeOff, Smartphone, Monitor, X, ImageIcon } from "lucide-react";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  focalDesktop: string;
  focalMobile: string;
  order: number;
  isActive: boolean;
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Upload failed");
  }
  const { url } = await res.json();
  return url as string;
}

function parseFocal(f: string): { x: number; y: number } {
  const m = f.match(/(\d{1,3})% (\d{1,3})%/);
  return m ? { x: +m[1], y: +m[2] } : { x: 50, y: 50 };
}

export function HeroManager({
  initialSlides,
  initialDurationMs,
  defaultImageUrl,
}: {
  initialSlides: HeroSlide[];
  initialDurationMs: number;
  /** Fallback image the storefront shows when no slides have been added yet. */
  defaultImageUrl?: string;
}) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [durationSec, setDurationSec] = useState(Math.round(initialDurationMs / 1000));
  const [busy, setBusy] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);

  async function addSlide(file: File) {
    setBusy(true);
    try {
      const imageUrl = await uploadImage(file);
      const res = await fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to add");
      const slide = (await res.json()) as HeroSlide;
      setSlides((s) => [...s, slide]);
      toast.success("Slide added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add slide");
    } finally {
      setBusy(false);
    }
  }

  async function patchSlide(id: string, data: Partial<HeroSlide>) {
    setSlides((s) => s.map((x) => (x.id === id ? { ...x, ...data } : x)));
    const res = await fetch(`/api/admin/hero/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) toast.error("Save failed — refresh and retry");
  }

  async function deleteSlide(id: string) {
    if (!confirm("Delete this hero slide?")) return;
    setSlides((s) => s.filter((x) => x.id !== id));
    const res = await fetch(`/api/admin/hero/${id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Delete failed — refresh and retry");
    else toast.success("Slide deleted");
  }

  async function setMobileImage(id: string, file: File) {
    setBusy(true);
    try {
      const url = await uploadImage(file);
      await patchSlide(id, { mobileImageUrl: url });
      toast.success("Mobile image set");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function setFocal(id: string, device: "desktop" | "mobile", e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
    const focal = `${x}% ${y}%`;
    patchSlide(id, device === "desktop" ? { focalDesktop: focal } : { focalMobile: focal });
  }

  async function move(id: string, dir: -1 | 1) {
    const i = slides.findIndex((s) => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const reordered = [...slides];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    setSlides(reordered);
    await Promise.all([
      patchSlide(reordered[i].id, { order: i }),
      patchSlide(reordered[j].id, { order: j }),
    ]);
  }

  async function saveDuration() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroDurationMs: durationSec * 1000 }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Rotation speed saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  const showDefaultCard = slides.length === 0 && !!defaultImageUrl;

  return (
    <div className="space-y-6">
      {/* Rotation duration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Rotation speed</h2>
        <p className="text-xs text-slate-500 mb-3">How long each slide stays on screen before changing (only matters with 2+ active slides).</p>
        <div className="flex items-center gap-3">
          <input
            type="number" min={2} max={30} value={durationSec}
            onChange={(e) => setDurationSec(Math.max(2, Math.min(30, Number(e.target.value) || 6)))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-600">seconds</span>
          <button onClick={saveDuration} disabled={busy} className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer">Save</button>
        </div>
      </div>

      {/* Default image card — shown when no real slides exist yet */}
      {showDefaultCard && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <ImageIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Current hero image (default)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your site is currently showing this built-in image. Upload your own slide below to replace it — you can add as many slides as you like and they will rotate automatically.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Monitor className="h-3.5 w-3.5" /> Desktop preview</div>
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-amber-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaultImageUrl} alt="Default hero" className="w-full h-full object-cover" style={{ objectPosition: "62% 50%" }} />
                <div className="absolute inset-0 bg-amber-900/10 pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Smartphone className="h-3.5 w-3.5" /> Mobile preview</div>
              <div className="relative aspect-[9/16] w-full max-w-[180px] mx-auto rounded-lg overflow-hidden border border-amber-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaultImageUrl} alt="Default hero mobile" className="w-full h-full object-cover" style={{ objectPosition: "62% 50%" }} />
                <div className="absolute inset-0 bg-amber-900/10 pointer-events-none" />
              </div>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-3 font-medium">↓ Upload your first slide below to replace this image</p>
        </div>
      )}

      {/* Add slide */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          {showDefaultCard ? "Upload your own hero image" : "Add another slide"}
        </h2>
        <button
          onClick={() => addRef.current?.click()}
          disabled={busy}
          className="flex flex-col items-center justify-center gap-2 h-28 w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-slate-500" /> : <Upload className="h-6 w-6" />}
          <span className="text-sm font-medium">{busy ? "Working…" : "Click to upload a slide image"}</span>
          <span className="text-xs">JPG / PNG / WebP — max 5 MB</span>
        </button>
        <input ref={addRef} type="file" accept="image/*" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) addSlide(f); e.target.value = ""; }} />
      </div>

      {/* Real slides */}
      {slides.length > 0 && (
        <div className="space-y-4">
          {slides.map((s, i) => {
            const dF = parseFocal(s.focalDesktop);
            const mF = parseFocal(s.focalMobile);
            return (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-900">Slide {i + 1}{!s.isActive && <span className="ml-2 text-xs font-normal text-amber-600">(hidden)</span>}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => move(s.id, -1)} disabled={i === 0} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => move(s.id, 1)} disabled={i === slides.length - 1} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => patchSlide(s.id, { isActive: !s.isActive })} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Toggle visibility">{s.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                    <button onClick={() => deleteSlide(s.id)} className="p-2.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">Click on each preview to set the focus point — that part stays centred when the image is cropped for that device.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Desktop crop */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Monitor className="h-3.5 w-3.5" /> Desktop ({s.focalDesktop})</div>
                    <div onClick={(e) => setFocal(s.id, "desktop", e)} className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 cursor-crosshair touch-none" style={{ touchAction: "none" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.focalDesktop }} />
                      <span className="absolute w-3 h-3 rounded-full border-2 border-white bg-primary/80 shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${dF.x}%`, top: `${dF.y}%` }} />
                    </div>
                  </div>
                  {/* Mobile crop */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Smartphone className="h-3.5 w-3.5" /> Mobile ({s.focalMobile})</div>
                    <div onClick={(e) => setFocal(s.id, "mobile", e)} className="relative aspect-[9/16] w-full max-w-[180px] mx-auto rounded-lg overflow-hidden border border-slate-200 cursor-crosshair touch-none" style={{ touchAction: "none" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.mobileImageUrl || s.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.focalMobile }} />
                      <span className="absolute w-3 h-3 rounded-full border-2 border-white bg-primary/80 shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${mF.x}%`, top: `${mF.y}%` }} />
                    </div>
                    <MobileImageButton slideId={s.id} hasMobile={!!s.mobileImageUrl} onPick={setMobileImage} onClear={() => patchSlide(s.id, { mobileImageUrl: null })} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileImageButton({
  slideId, hasMobile, onPick, onClear,
}: {
  slideId: string;
  hasMobile: boolean;
  onPick: (id: string, file: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
      <button
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
      >
        <Upload className="h-3.5 w-3.5" />
        {hasMobile ? "Replace mobile image" : "Use different image on mobile"}
      </button>
      {hasMobile && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(slideId, f); e.target.value = ""; }} />
    </div>
  );
}
