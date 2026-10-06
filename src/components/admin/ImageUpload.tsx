"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { FiUploadCloud, FiX, FiLoader, FiImage } from "react-icons/fi";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "banner";
}

export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  className,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro no upload");
        return;
      }
      const data = await res.json();
      if (data.files?.[0]?.url) {
        onChange(data.files[0].url);
      }
    } catch {
      alert("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) upload(file);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const aspectClass =
    aspectRatio === "banner" ? "aspect-[3/1]" :
    aspectRatio === "video" ? "aspect-video" : "aspect-square";

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>}

      {value ? (
        <div className={cn("relative group overflow-hidden rounded-xl border border-gray-200", aspectClass)}>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow hover:bg-gray-100"
            >
              Trocar
            </button>
            <button
              onClick={() => onChange(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow hover:bg-red-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/40 hover:bg-gray-50",
            aspectClass, "flex flex-col items-center justify-center"
          )}
        >
          {uploading ? (
            <FiLoader className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <FiUploadCloud className="h-6 w-6 text-gray-300" />
          )}
          <p className="mt-1.5 text-xs font-medium text-gray-500">
            {uploading ? "Enviando..." : "Clique ou arraste"}
          </p>
          <p className="text-[10px] text-gray-400">JPG, PNG, WebP — máx. 5MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
        className="hidden"
        onChange={handleSelect}
      />

      {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}

      {/* Manual URL input */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-mono text-gray-500 outline-none focus:border-primary"
          placeholder="ou cole a URL da imagem"
        />
      </div>
    </div>
  );
}
