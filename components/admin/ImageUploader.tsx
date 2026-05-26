"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFiles(files: FileList) {
    if (!files.length) return;
    setUploading(true);
    setUploadingCount(files.length);

    const newUrls: string[] = [];
    let remaining = files.length;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const { url } = await res.json();
          newUrls.push(url);
        } else {
          const err = await res.json();
          toast.error(err.error ?? "Upload failed");
        }
      } catch {
        toast.error("Network error during upload");
      }

      remaining--;
      setUploadingCount(remaining);
    }

    if (newUrls.length) {
      onChange([...images, ...newUrls]);
    }

    setUploading(false);
    setUploadingCount(0);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) handleFiles(files);
  }

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center gap-2 h-32 w-full rounded-xl border-2 border-dashed
          cursor-pointer transition-colors duration-200 select-none
          ${isDragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-500"
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium text-primary">
              Uploading {uploadingCount > 1 ? `${uploadingCount} files` : "file"}…
            </span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6" />
            <div className="text-center">
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs block mt-0.5">or drag and drop images here</span>
            </div>
            <span className="text-xs text-gray-400">PNG, JPG, WebP — max 5 MB each</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-start justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5">
                  <ImageIcon className="h-2.5 w-2.5 text-white" />
                  <span className="text-[10px] font-medium text-white">Cover</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-xs text-gray-400 text-center">No images yet — upload at least one.</p>
      )}
    </div>
  );
}
