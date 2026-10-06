"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiAward, FiPlus, FiSearch, FiEdit3, FiTrash2,
  FiLoader, FiX, FiCheck, FiAlertCircle, FiStar,
  FiPlay, FiEye, FiEyeOff, FiUploadCloud, FiFilter,
} from "react-icons/fi";

// ── Types ──────────────────────────────────────────────
interface HallOfFameEntry {
  id: string;
  clientName: string;
  title: string;
  salesValue: number;
  description: string | null;
  youtubeUrl: string;
  youtubeId: string;
  thumbnail: string | null;
  clientPhoto: string | null;
  trophyPhoto: string | null;
  achievementDate: string | null;
  category: string;
  displayOrder: number;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Constants ──────────────────────────────────────────
const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "50k", label: "R$ 50 mil" },
  { value: "100k", label: "R$ 100 mil" },
  { value: "500k", label: "R$ 500 mil" },
  { value: "1m", label: "R$ 1 milhão" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "50k": "bg-brand-100 text-brand-700",
  "100k": "bg-orange-100 text-orange-700",
  "500k": "bg-red-100 text-red-700",
  "1m": "bg-purple-100 text-purple-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  "50k": "R$ 50 mil",
  "100k": "R$ 100 mil",
  "500k": "R$ 500 mil",
  "1m": "R$ 1 milhão",
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

// ── Helpers ────────────────────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("pt-BR");
}

// ── YouTube Helpers ────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  let match = url.match(/(?:youtube\.com\/watch\?v=)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtu\.be\/)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtube\.com\/embed\/)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtube\.com\/live\/)([\w-]{11})/);
  if (match) return match[1];
  return null;
}

function getYouTubeThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

// ── API hooks ──────────────────────────────────────────
function useEntries(search: string, category: string, status: string) {
  return useQuery<HallOfFameEntry[]>({
    queryKey: ["hall-of-fame", search, category, status],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category) p.set("category", category);
      if (status) p.set("status", status);
      const res = await fetch(`/api/admin/hall-of-fame?${p}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar registros");
      return res.json();
    },
  });
}

// ── Main Component ─────────────────────────────────────
export default function HallDaFamaAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<HallOfFameEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<HallOfFameEntry | null>(null);

  const { data: entries = [], isLoading } = useEntries(debouncedSearch, category, status);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__hallSearch);
    (window as any).__hallSearch = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/hall-of-fame/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Erro ao excluir");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hall-of-fame"] }); setDeleteConfirm(null); },
  });

  const activeCount = entries.filter((e) => e.active).length;
  const featuredCount = entries.filter((e) => e.featured).length;
  const totalSales = entries.reduce((acc, e) => acc + (e.salesValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hall da Fama</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie os clientes que viraram cases de sucesso</p>
        </div>
        <button onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all">
          <FiPlus className="h-4 w-4" /> Novo Cliente
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
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 py-2 px-3 text-sm outline-none focus:border-primary">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="relative flex-1 sm:w-56 sm:flex-initial">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              placeholder="Buscar por nome..." />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FiAward className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{entries.length}</p>
              <p className="text-[11px] text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FiEye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{activeCount}</p>
              <p className="text-[11px] text-gray-500">Ativos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
              <FiStar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{featuredCount}</p>
              <p className="text-[11px] text-gray-500">Destaques</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FiFilter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(totalSales)}</p>
              <p className="text-[11px] text-gray-500">Vendas totais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <FiLoader className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <FiAward className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-600">Nenhum registro encontrado</h3>
          <p className="mt-1 text-sm text-gray-400">
            {search ? "Tente outro termo de busca" : "Clique em 'Novo Cliente' para adicionar o primeiro"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Cliente</th>
                <th className="hidden px-4 py-3 text-xs font-semibold text-gray-500 sm:table-cell">Categoria</th>
                <th className="hidden px-4 py-3 text-xs font-semibold text-gray-500 md:table-cell">Vendas</th>
                <th className="hidden px-4 py-3 text-xs font-semibold text-gray-500 lg:table-cell">Data</th>
                <th className="hidden px-4 py-3 text-xs font-semibold text-gray-500 sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-900">
                        {entry.thumbnail ? (
                          <img src={entry.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><FiPlay className="h-4 w-4 text-gray-500" /></div>
                        )}
                        <button onClick={() => setPreviewVideo(entry)}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                          <FiPlay className="h-4 w-4 text-white" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{entry.clientName}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{entry.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[entry.category] || "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-sm font-semibold text-gray-900 md:table-cell">
                    {formatCurrency(entry.salesValue)}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-gray-500 lg:table-cell">
                    {formatDate(entry.achievementDate)}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                      entry.active ? "text-green-600" : "text-gray-400"
                    }`}>
                      {entry.active ? <><FiEye className="h-3 w-3" /> Ativo</> : <><FiEyeOff className="h-3 w-3" /> Inativo</>}
                    </span>
                    {entry.featured && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-yellow-600">
                        <FiStar className="h-3 w-3" /> Destaque
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPreviewVideo(entry)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Visualizar vídeo">
                        <FiPlay className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setEditEntry(entry); setShowForm(true); }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Editar">
                        <FiEdit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(entry.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Excluir">
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <FormModal
          entry={editEntry}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["hall-of-fame"] });
            setShowForm(false);
            setEditEntry(null);
          }}
        />
      )}

      {previewVideo && (
        <VideoModal entry={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <FiAlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h3 className="mt-3 text-center text-lg font-bold text-gray-900">Excluir Registro?</h3>
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

// ── Form Modal (Create / Edit) ─────────────────────────
function FormModal({ entry, onClose, onSuccess }: {
  entry: HallOfFameEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!entry;
  const [clientName, setClientName] = useState(entry?.clientName || "");
  const [title, setTitle] = useState(entry?.title || "");
  const [salesValue, setSalesValue] = useState(entry?.salesValue?.toString() || "");
  const [description, setDescription] = useState(entry?.description || "");
  const [youtubeUrl, setYoutubeUrl] = useState(entry?.youtubeUrl || "");
  const [clientPhoto, setClientPhoto] = useState(entry?.clientPhoto || "");
  const [trophyPhoto, setTrophyPhoto] = useState(entry?.trophyPhoto || "");
  const [achievementDate, setAchievementDate] = useState(
    entry?.achievementDate ? new Date(entry.achievementDate).toISOString().split("T")[0] : ""
  );
  const [category, setCategory] = useState(entry?.category || "50k");
  const [displayOrder, setDisplayOrder] = useState(entry?.displayOrder?.toString() || "0");
  const [active, setActive] = useState(entry?.active ?? true);
  const [featured, setFeatured] = useState(entry?.featured ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload states
  const [uploadingClientPhoto, setUploadingClientPhoto] = useState(false);
  const [uploadingTrophyPhoto, setUploadingTrophyPhoto] = useState(false);
  const clientPhotoInputRef = useRef<HTMLInputElement>(null);
  const trophyPhotoInputRef = useRef<HTMLInputElement>(null);

  // YouTube preview
  const youtubeId = extractYouTubeId(youtubeUrl);
  const thumbnailPreview = youtubeId ? getYouTubeThumbnail(youtubeId) : null;

  const handleUpload = async (file: File, type: "client" | "trophy") => {
    if (!file) return;
    const setter = type === "client" ? setUploadingClientPhoto : setUploadingTrophyPhoto;
    const photoSetter = type === "client" ? setClientPhoto : setTrophyPhoto;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao fazer upload");
      }

      const data = await res.json();
      if (data.files && data.files.length > 0) {
        photoSetter(data.files[0].url);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload da imagem");
    } finally {
      setter(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!clientName.trim()) { setError("Nome do cliente é obrigatório"); return; }
    if (!title.trim()) { setError("Título da conquista é obrigatório"); return; }
    if (!youtubeUrl.trim()) { setError("Link do YouTube é obrigatório"); return; }
    if (!extractYouTubeId(youtubeUrl.trim())) {
      setError("Link do YouTube inválido. Use: youtube.com/watch?v=..., youtu.be/... ou youtube.com/shorts/...");
      return;
    }

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/hall-of-fame/${entry!.id}`
        : "/api/admin/hall-of-fame";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientName: clientName.trim(),
          title: title.trim(),
          salesValue: parseFloat(salesValue) || 0,
          description: description.trim() || null,
          youtubeUrl: youtubeUrl.trim(),
          clientPhoto: clientPhoto || null,
          trophyPhoto: trophyPhoto || null,
          achievementDate: achievementDate || null,
          category,
          displayOrder: parseInt(displayOrder) || 0,
          active,
          featured,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      setSuccess(isEditing ? "Registro atualizado com sucesso!" : "Registro criado com sucesso!");
      setTimeout(onSuccess, 800);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {error && (
            <div className="col-span-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>
          )}
          {success && (
            <div className="col-span-2 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-600">{success}</div>
          )}

          {/* Client Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Nome do Cliente *</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Ex: Maria Silva" />
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Título da Conquista *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Ex: Faturou R$ 100 mil em 3 meses" />
          </div>

          {/* Sales Value */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Valor em Vendas (R$)</label>
            <input type="number" step="0.01" value={salesValue} onChange={(e) => setSalesValue(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Ex: 100000" />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Categoria da Conquista</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary">
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Achievement Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Data da Conquista</label>
            <input type="date" value={achievementDate} onChange={(e) => setAchievementDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          {/* Display Order */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Ordem de Exibição</label>
            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="0" />
          </div>

          {/* YouTube URL */}
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Link do YouTube *</label>
            <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="youtube.com/watch?v=... ou youtu.be/... ou youtube.com/shorts/..." />
            {youtubeUrl && !youtubeId && (
              <p className="mt-1 text-[11px] text-red-500">Link inválido. Use links dos tipos aceitos.</p>
            )}
            {thumbnailPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-900">
                <img
                  src={thumbnailPreview}
                  alt="Preview do vídeo"
                  className="w-full aspect-video object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                  }}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Descrição / Depoimento</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Breve descrição da conquista ou depoimento..." />
          </div>

          {/* Client Photo */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Foto do Cliente</label>
            <input ref={clientPhotoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f, "client");
              }} />
            <div className="flex items-center gap-3">
              <button onClick={() => clientPhotoInputRef.current?.click()}
                disabled={uploadingClientPhoto}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                {uploadingClientPhoto ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiUploadCloud className="h-3.5 w-3.5" />}
                Upload
              </button>
              {clientPhoto && (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <img src={clientPhoto} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setClientPhoto("")}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white">
                    <FiX className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trophy Photo */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Foto da Placa/Troféu (opcional)</label>
            <input ref={trophyPhotoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f, "trophy");
              }} />
            <div className="flex items-center gap-3">
              <button onClick={() => trophyPhotoInputRef.current?.click()}
                disabled={uploadingTrophyPhoto}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                {uploadingTrophyPhoto ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiUploadCloud className="h-3.5 w-3.5" />}
                Upload
              </button>
              {trophyPhoto && (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <img src={trophyPhoto} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setTrophyPhoto("")}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white">
                    <FiX className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status toggles */}
          <div className="col-span-2 flex flex-wrap gap-6 border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <FiStar className="h-3.5 w-3.5 text-yellow-500" /> Destaque
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {saving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
            {isEditing ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Video Preview Modal ────────────────────────────────
function VideoModal({ entry, onClose }: { entry: HallOfFameEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{entry.clientName}</h2>
            <p className="text-xs text-white/50">{entry.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${entry.youtubeId}?autoplay=1&rel=0`}
              title={entry.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
