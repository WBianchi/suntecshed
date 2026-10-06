"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import {
  FiVideo, FiUploadCloud, FiSearch, FiFilter, FiPlay, FiTrash2,
  FiEdit3, FiClock, FiLoader, FiX, FiCheck, FiAlertCircle,
  FiHardDrive, FiGrid, FiList, FiPlus, FiFile,
} from "react-icons/fi";

// ── Types ──────────────────────────────────────────────
interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  videoUrl: string;
  duration: number | null;
  fileSize: number | null;
  status: string;
  createdAt: string;
}

interface UploadResult {
  videoUrl: string;
  thumbnail: string | null;
  duration: number;
  fileSize: number;
  originalName: string;
}

// ── Constants ──────────────────────────────────────────
const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "geral", label: "Geral" },
  { value: "vendas", label: "Vendas" },
  { value: "produtos", label: "Produtos" },
  { value: "atendimento", label: "Atendimento" },
  { value: "sistema", label: "Sistema" },
  { value: "processos", label: "Processos" },
];

// ── Helpers ────────────────────────────────────────────
const formatDuration = (seconds: number | null) => {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "--";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// ── API hooks ──────────────────────────────────────────
function useVideos(search: string, category: string) {
  return useQuery<TrainingVideo[]>({
    queryKey: ["training-videos", search, category],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category) p.set("category", category);
      const res = await fetch(`/api/admin/training?${p}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar vídeos");
      return res.json();
    },
  });
}

// ── Main Component ─────────────────────────────────────
export default function TreinamentoPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal states
  const [showUpload, setShowUpload] = useState(false);
  const [showPlayer, setShowPlayer] = useState<TrainingVideo | null>(null);
  const [editVideo, setEditVideo] = useState<TrainingVideo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: videos = [], isLoading } = useVideos(debouncedSearch, category);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__trainingSearch);
    (window as any).__trainingSearch = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/training/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Erro ao excluir");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["training-videos"] }); setDeleteConfirm(null); },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treinamento</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie os vídeos de treinamento da equipe</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all">
          <FiPlus className="h-4 w-4" /> Novo Vídeo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                category === c.value ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56 sm:flex-initial">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              placeholder="Buscar vídeos..." />
          </div>
          <div className="flex rounded-lg border border-gray-200">
            <button onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600"}`}>
              <FiGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600"}`}>
              <FiList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FiVideo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{videos.length}</p>
              <p className="text-[11px] text-gray-500">Total de vídeos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatDuration(videos.reduce((acc, v) => acc + (v.duration || 0), 0))}
              </p>
              <p className="text-[11px] text-gray-500">Tempo total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FiHardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatFileSize(videos.reduce((acc, v) => acc + (v.fileSize || 0), 0))}
              </p>
              <p className="text-[11px] text-gray-500">Armazenamento</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FiFilter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {new Set(videos.map((v) => v.category)).size}
              </p>
              <p className="text-[11px] text-gray-500">Categorias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <FiLoader className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <FiVideo className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-600">Nenhum vídeo encontrado</h3>
          <p className="mt-1 text-sm text-gray-400">
            {search ? "Tente outro termo de busca" : "Clique em 'Novo Vídeo' para adicionar o primeiro"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v}
              onPlay={() => setShowPlayer(v)}
              onEdit={() => setEditVideo(v)}
              onDelete={() => setDeleteConfirm(v.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((v) => (
            <VideoRow key={v.id} video={v}
              onPlay={() => setShowPlayer(v)}
              onEdit={() => setEditVideo(v)}
              onDelete={() => setDeleteConfirm(v.id)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["training-videos"] });
          setShowUpload(false);
        }} />
      )}

      {showPlayer && (
        <PlayerModal video={showPlayer} onClose={() => setShowPlayer(null)} />
      )}

      {editVideo && (
        <EditModal video={editVideo} onClose={() => setEditVideo(null)} onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["training-videos"] });
          setEditVideo(null);
        }} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <FiAlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h3 className="mt-3 text-center text-lg font-bold text-gray-900">Excluir Vídeo?</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Video Card (Grid) ──────────────────────────────────
function VideoCard({ video, onPlay, onEdit, onDelete }: {
  video: TrainingVideo; onPlay: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const catLabel = CATEGORIES.find((c) => c.value === video.category)?.label || video.category;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-primary/20 hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video cursor-pointer bg-gray-900" onClick={onPlay}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <FiVideo className="h-10 w-10 text-gray-600" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg">
            <FiPlay className="ml-1 h-6 w-6" />
          </div>
        </div>
        {/* Duration badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            {formatDuration(video.duration)}
          </span>
        )}
        {/* Status badge */}
        {video.status === "processing" && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
            <FiLoader className="h-3 w-3 animate-spin" /> Processando
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {catLabel}
          </span>
          {video.fileSize && (
            <span className="text-[10px] text-gray-400">{formatFileSize(video.fileSize)}</span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-bold text-gray-900">{video.title}</h3>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{video.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {new Date(video.createdAt).toLocaleDateString("pt-BR")}
          </span>
          <div className="flex gap-1">
            <button onClick={onPlay} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <FiPlay className="h-3.5 w-3.5" />
            </button>
            <button onClick={onEdit} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
              <FiEdit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Video Row (List) ───────────────────────────────────
function VideoRow({ video, onPlay, onEdit, onDelete }: {
  video: TrainingVideo; onPlay: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const catLabel = CATEGORIES.find((c) => c.value === video.category)?.label || video.category;

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-primary/20 hover:shadow-sm">
      <div className="relative h-16 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-gray-900" onClick={onPlay}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center"><FiVideo className="h-5 w-5 text-gray-600" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <FiPlay className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-gray-900">{video.title}</h3>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{catLabel}</span>
          <span className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {formatDuration(video.duration)}</span>
          <span>{formatFileSize(video.fileSize)}</span>
          <span>{new Date(video.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button onClick={onPlay} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><FiPlay className="h-4 w-4" /></button>
        <button onClick={onEdit} className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600"><FiEdit3 className="h-4 w-4" /></button>
        <button onClick={onDelete} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><FiTrash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ── Upload Modal ───────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) handleFile(f);
  }, [title]);

  const handleSubmit = async () => {
    if (!file || !title.trim()) { setError("Selecione um vídeo e preencha o título"); return; }
    setUploading(true);
    setError("");
    setProgress(5);

    try {
      // Step 1: Upload video directly to Vercel Blob (client upload, no size limit)
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/training/upload",
        onUploadProgress: ({ percentage }) => {
          setProgress(Math.round(percentage * 0.8)); // 0-80%
        },
      });
      setProgress(85);

      // Step 2: Create video record
      const createRes = await fetch("/api/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          videoUrl: blob.url,
          thumbnail: null,
          duration: 0,
          fileSize: file.size,
        }),
      });

      if (!createRes.ok) throw new Error("Erro ao salvar vídeo");
      setProgress(100);

      setTimeout(onSuccess, 300);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Novo Vídeo de Treinamento</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><FiX className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              file ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <input ref={inputRef} type="file" accept="video/*" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            {file ? (
              <div>
                <FiCheck className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{formatFileSize(file.size)}</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-2 text-xs font-medium text-red-500 hover:underline">Remover</button>
              </div>
            ) : (
              <div>
                <FiUploadCloud className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm font-semibold text-gray-600">Arraste o vídeo aqui ou clique para selecionar</p>
                <p className="mt-1 text-xs text-gray-400">MP4, WebM, MOV, AVI, MKV — até 2GB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Ex: Como cadastrar um produto" />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Descrição</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Breve descrição do conteúdo..." />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary">
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>Enviando e convertendo...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Upload direto para o cloud storage</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} disabled={uploading}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={uploading || !file || !title.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {uploading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUploadCloud className="h-4 w-4" />}
            {uploading ? "Enviando..." : "Enviar Vídeo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Player Modal ───────────────────────────────────────
function PlayerModal({ video, onClose }: { video: TrainingVideo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{video.title}</h2>
            <p className="text-xs text-white/50">
              {formatDuration(video.duration)} · {formatFileSize(video.fileSize)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="w-full"
            style={{ maxHeight: "75vh" }}
          />
        </div>
        {video.description && (
          <p className="mt-3 text-sm text-white/60">{video.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────
function EditModal({ video, onClose, onSuccess }: { video: TrainingVideo; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || "");
  const [category, setCategory] = useState(video.category);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setError("Título obrigatório"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/training/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, category }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Editar Vídeo</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><FiX className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-6">
          {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Descrição</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary">
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {saving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
