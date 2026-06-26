"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ArrowUp, ArrowDown, Loader2, Eye, EyeOff, Smartphone, Monitor, X, ImageIcon, Replace } from "lucide-react";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  focalDesktop: string;
  focalMobile: string;
  brightness: number;
  contrast: number;
  overlayOpacity: number;
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

  async function replaceImage(id: string, file: File) {
    setBusy(true);
    try {
      const url = await uploadImage(file);
      await patchSlide(id, { imageUrl: url });
      toast.success("Image replaced");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
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

      {/* Default image card */}
      {showDefaultCard && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <ImageIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Current hero image (default)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your site is currently showing this built-in image. Upload your own slide below to replace it.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Monitor className="h-3.5 w-3.5" /> Desktop preview</div>
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-amber-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaultImageUrl} alt="Default hero" className="w-full h-full object-cover" style={{ objectPosition: "62% 50%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Smartphone className="h-3.5 w-3.5" /> Mobile preview</div>
              <div className="relative aspect-[9/16] w-full max-w-[180px] mx-auto rounded-lg overflow-hidden border border-amber-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaultImageUrl} alt="Default hero mobile" className="w-full h-full object-cover" style={{ objectPosition: "62% 50%" }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-3 font-medium">Upload your first slide below to replace this image</p>
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
          <span className="text-sm font-medium">{busy ? "Working..." : "Click to upload a slide image"}</span>
          <span className="text-xs">JPG / PNG / WebP — max 5 MB</span>
        </button>
        <input ref={addRef} type="file" accept="image/*" className="sr-only" multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files) Array.from(files).forEach((f) => addSlide(f));
            e.target.value = "";
          }} />
      </div>

      {/* Slides */}
      {slides.length > 0 && (
        <div className="space-y-6">
          {slides.map((s, i) => (
            <SlideEditor
              key={s.id}
              slide={s}
              index={i}
              total={slides.length}
              busy={busy}
              onPatch={(data) => patchSlide(s.id, data)}
              onDelete={() => deleteSlide(s.id)}
              onMove={(dir) => move(s.id, dir)}
              onReplace={(file) => replaceImage(s.id, file)}
              onSetMobile={(file) => setMobileImage(s.id, file)}
              onClearMobile={() => patchSlide(s.id, { mobileImageUrl: null })}
              onSetFocal={(device, e) => setFocal(s.id, device, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideEditor({
  slide: s,
  index: i,
  total,
  busy,
  onPatch,
  onDelete,
  onMove,
  onReplace,
  onSetMobile,
  onClearMobile,
  onSetFocal,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  busy: boolean;
  onPatch: (data: Partial<HeroSlide>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onReplace: (file: File) => void;
  onSetMobile: (file: File) => void;
  onClearMobile: () => void;
  onSetFocal: (device: "desktop" | "mobile", e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const dF = parseFocal(s.focalDesktop);
  const mF = parseFocal(s.focalMobile);
  const cssFilter = `brightness(${s.brightness}) contrast(${s.contrast})`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900">Slide {i + 1}</span>
          {!s.isActive && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Hidden</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => replaceRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50" title="Replace image">
            <Replace className="h-3.5 w-3.5" /> Replace
          </button>
          <input ref={replaceRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); e.target.value = ""; }} />
          <button onClick={() => onMove(-1)} disabled={i === 0} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
          <button onClick={() => onMove(1)} disabled={i === total - 1} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
          <button onClick={() => onPatch({ isActive: !s.isActive })} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Toggle visibility">{s.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
          <button onClick={onDelete} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Crop / focal point */}
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-1">Focal Point</h3>
          <p className="text-xs text-slate-500 mb-3">Click on each preview to set the focus point — that part stays centred when the image is cropped for that device.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Monitor className="h-3.5 w-3.5" /> Desktop ({s.focalDesktop})</div>
              <div onClick={(e) => onSetFocal("desktop", e)} className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 cursor-crosshair touch-none" style={{ touchAction: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.focalDesktop, filter: cssFilter }} />
                <span className="absolute w-4 h-4 rounded-full border-2 border-white bg-primary/90 shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-2 ring-primary/30" style={{ left: `${dF.x}%`, top: `${dF.y}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5"><Smartphone className="h-3.5 w-3.5" /> Mobile ({s.focalMobile})</div>
              <div onClick={(e) => onSetFocal("mobile", e)} className="relative aspect-[9/16] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border border-slate-200 cursor-crosshair touch-none" style={{ touchAction: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mobileImageUrl || s.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.focalMobile, filter: cssFilter }} />
                <span className="absolute w-4 h-4 rounded-full border-2 border-white bg-primary/90 shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-2 ring-primary/30" style={{ left: `${mF.x}%`, top: `${mF.y}%` }} />
              </div>
              <MobileImageButton hasMobile={!!s.mobileImageUrl} inputRef={mobileRef} onClear={onClearMobile} />
              <input ref={mobileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSetMobile(f); e.target.value = ""; }} />
            </div>
          </div>
        </div>

        {/* Adjustments */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">Adjustments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <SliderField label="Brightness" value={s.brightness} min={0.3} max={1.8} step={0.05} onChange={(v) => onPatch({ brightness: v })} />
            <SliderField label="Contrast" value={s.contrast} min={0.3} max={1.8} step={0.05} onChange={(v) => onPatch({ contrast: v })} />
            <SliderField label="Overlay darkness" value={s.overlayOpacity} min={0} max={0.9} step={0.05} onChange={(v) => onPatch({ overlayOpacity: v })} />
          </div>
        </div>

        {/* Live preview */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-1">Live Preview</h3>
          <p className="text-xs text-slate-500 mb-3">Exactly how visitors will see this slide on the storefront.</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-5">
            {/* Desktop preview */}
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Desktop</div>
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.focalDesktop, filter: cssFilter }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" style={{ opacity: s.overlayOpacity / 0.4 }} />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="text-[8px] uppercase tracking-[0.2em] opacity-70 mb-0.5">Sirini Jewellery</div>
                  <div className="text-sm font-light tracking-tight">The Heritage of Elegance</div>
                </div>
              </div>
            </div>
            {/* Mobile preview */}
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mobile</div>
              <div className="relative aspect-[9/16] w-full max-w-[140px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mobileImageUrl || s.imageUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.focalMobile, filter: cssFilter }} />
                <div className="absolute bottom-2 left-2 text-white">
                  <div className="text-[6px] uppercase tracking-[0.15em] opacity-70">Sirini Jewellery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs tabular-nums text-slate-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow"
      />
    </div>
  );
}

function MobileImageButton({ hasMobile, inputRef, onClear }: {
  hasMobile: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
      <button
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
      >
        <Upload className="h-3.5 w-3.5" />
        {hasMobile ? "Replace mobile image" : "Use different image on mobile"}
      </button>
      {hasMobile && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      )}
    </div>
  );
}
