"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlay, FiX, FiSearch, FiFilter, FiAward, FiStar,
  FiShare2, FiTrendingUp, FiDollarSign, FiLoader, FiChevronDown,
} from "react-icons/fi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

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
  "50k": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "100k": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "500k": "bg-red-500/10 text-red-400 border-red-500/20",
  "1m": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const CATEGORY_BADGES: Record<string, string> = {
  "50k": "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
  "100k": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
  "500k": "bg-gradient-to-r from-red-600 to-rose-600 text-white",
  "1m": "bg-gradient-to-r from-purple-600 to-violet-600 text-white",
};

const CATEGORY_LABELS: Record<string, string> = {
  "50k": "R$ 50 mil",
  "100k": "R$ 100 mil",
  "500k": "R$ 500 mil",
  "1m": "R$ 1 milhão",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Mais Recentes" },
  { value: "biggest", label: "Maiores Resultados" },
];

// ── Helpers ────────────────────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR");
}

function getYoutubeThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

function getYoutubeFallback(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

/** Prioriza a foto do cliente como thumbnail; se não houver, usa a capa do YouTube */
function getThumbnailSrc(entry: HallOfFameEntry): string | null {
  if (entry.clientPhoto) return entry.clientPhoto;
  if (entry.youtubeId) return getYoutubeThumbnail(entry.youtubeId);
  return null;
}

function getThumbnailFallback(entry: HallOfFameEntry): string | null {
  if (entry.clientPhoto) return null; // sem fallback para foto do cliente
  if (entry.youtubeId) return getYoutubeFallback(entry.youtubeId);
  return null;
}

// ── API ────────────────────────────────────────────────
function useHallOfFame(search: string, category: string, sort: string) {
  return useQuery<{ entries: HallOfFameEntry[]; featured: HallOfFameEntry | null }>({
    queryKey: ["hall-of-fame-public", search, category, sort],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category) p.set("category", category);
      if (sort) p.set("sort", sort);

      // Busca entradas normais
      const res = await fetch(`/api/hall-of-fame?${p}`);
      if (!res.ok) throw new Error("Erro ao buscar");
      const entries = await res.json();

      // Busca destaque
      const featRes = await fetch(`/api/hall-of-fame?featured=1&sort=biggest`);
      const featuredEntries = featRes.ok ? await featRes.json() : [];
      const featured = featuredEntries.length > 0 ? featuredEntries[0] : null;

      return { entries, featured };
    },
  });
}

// ── Main Component ─────────────────────────────────────
export default function HallDaFamaPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [selectedEntry, setSelectedEntry] = useState<HallOfFameEntry | null>(null);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());

  const { data, isLoading } = useHallOfFame(debouncedSearch, category, sort);
  const entries = data?.entries || [];
  const featured = data?.featured;

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__hallPublicSearch);
    (window as any).__hallPublicSearch = setTimeout(() => setDebouncedSearch(val), 400);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedEntry) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedEntry]);

  const handleShare = async (entry: HallOfFameEntry) => {
    const url = `${window.location.origin}/hall-da-fama`;
    const text = `Veja a conquista de ${entry.clientName} no Hall da Fama C7 DROP: ${formatCurrency(entry.salesValue)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Hall da Fama C7 DROP", text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copiado!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-gray-950 to-gray-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />

          <div className="relative mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:pb-20 sm:pt-12">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex justify-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                <FiAward className="h-3.5 w-3.5" /> HALL DA FAMA
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center text-3xl font-bold text-white sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Hall da Fama{" "}
              <span className="text-primary">C7 DROP</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-4 max-w-2xl text-center text-sm text-gray-400 sm:text-base"
            >
              Conheça os clientes que transformaram oportunidades em grandes resultados com a C7 DROP.
            </motion.p>

            {/* Featured Entry */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mx-auto mt-10 max-w-4xl"
              >
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl shadow-primary/5 cursor-pointer"
                  onClick={() => setSelectedEntry(featured)}>
                  {/* Thumbnail */}
                  <div className="relative aspect-video sm:aspect-[21/9] bg-gray-900">
                    {getThumbnailSrc(featured) && (
                      <img
                        src={getThumbnailSrc(featured)!}
                        alt={featured.clientName}
                        className={`h-full w-full transition-all duration-500 group-hover:opacity-80 group-hover:scale-105 opacity-60 ${
                          featured.clientPhoto ? "object-contain" : "object-cover"
                        }`}
                        onError={(e) => {
                          const fallback = getThumbnailFallback(featured);
                          if (fallback) (e.target as HTMLImageElement).src = fallback;
                        }}
                        loading="lazy"
                      />
                    )}
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
                        <FiPlay className="ml-1 h-7 w-7 sm:h-8 sm:w-8" />
                      </div>
                    </div>
                    {/* Category badge */}
                    <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_BADGES[featured.category]}`}>
                        {CATEGORY_LABELS[featured.category]}
                      </span>
                    </div>
                  </div>

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-medium text-primary">DEPOIMENTO EM DESTAQUE</p>
                        <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{featured.clientName}</h2>
                        <p className="mt-1 text-sm text-gray-300 line-clamp-1">{featured.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Resultado alcançado</p>
                        <p className="text-xl font-bold text-primary sm:text-2xl">{formatCurrency(featured.salesValue)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedEntry(featured); }}
                      className="mt-3 flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-black transition-all hover:bg-primary/90 hover:scale-105"
                    >
                      <FiPlay className="h-4 w-4" /> Assistir Depoimento
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Filters Bar */}
        <section className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
          <div className="mx-auto max-w-[1440px] px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 sm:hidden"
              >
                <FiFilter className="h-4 w-4" />
                Filtros
                <FiChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {/* Category pills - desktop always visible */}
              <div className={`flex-wrap gap-1.5 ${showFilters ? "flex" : "hidden"} sm:flex`}>
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setCategory(c.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      category === c.value
                        ? "bg-primary text-black"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-56 sm:flex-initial">
                  <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-primary/50"
                    placeholder="Buscar cliente..." />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 outline-none focus:border-primary/50"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-gray-900 text-white">{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <FiLoader className="h-8 w-8 animate-spin text-gray-600" />
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-white/5 p-16 text-center">
                <FiAward className="mx-auto h-12 w-12 text-gray-700" />
                <h3 className="mt-4 text-lg font-bold text-gray-400">Nenhum resultado encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? "Tente outro termo de busca" : "Em breve novos clientes farão parte do Hall da Fama"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <EntryCard
                      entry={entry}
                      onSelect={() => setSelectedEntry(entry)}
                      thumbnailLoaded={loadedThumbnails.has(entry.id)}
                      onThumbnailLoad={() => setLoadedThumbnails((prev) => new Set(prev).add(entry.id))}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-gray-900 border border-primary/20 p-8 sm:p-12 text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <div className="relative">
                <FiStar className="mx-auto h-8 w-8 text-primary" />
                <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                  Quer fazer parte do Hall da Fama?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-gray-400 sm:text-base">
                  Conheça nosso catálogo e comece sua jornada de sucesso com a C7 DROP
                </p>
                <a href="/produtos"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-black shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30">
                  <FiTrendingUp className="h-4 w-4" /> Explorar Produtos
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
      <MobileBottomNav />

      {/* Entry Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryModal
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            onShare={() => handleShare(selectedEntry)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Entry Card ─────────────────────────────────────────
function EntryCard({ entry, onSelect, thumbnailLoaded, onThumbnailLoad }: {
  entry: HallOfFameEntry;
  onSelect: () => void;
  thumbnailLoaded: boolean;
  onThumbnailLoad: () => void;
}) {
  const thumbSrc = getThumbnailSrc(entry);
  const isClientPhoto = !!entry.clientPhoto && thumbSrc === entry.clientPhoto;

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-gray-900/50 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800 overflow-hidden">
        {thumbSrc && (
          <img
            src={thumbSrc}
            alt={entry.clientName}
            className={`h-full w-full transition-all duration-700 group-hover:scale-105 ${
              isClientPhoto ? "object-contain" : "object-cover"
            } ${
              thumbnailLoaded ? "opacity-70" : "opacity-0"
            }`}
            onLoad={onThumbnailLoad}
            onError={(e) => {
              const fallback = getThumbnailFallback(entry);
              if (fallback) (e.target as HTMLImageElement).src = fallback;
            }}
            loading="lazy"
          />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-black shadow-lg shadow-black/30 opacity-0 transition-all group-hover:opacity-100 group-hover:scale-100 scale-90">
            <FiPlay className="ml-1 h-5 w-5" />
          </div>
        </div>
        {/* Category badge */}
        <div className="absolute left-3 top-3">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[entry.category]}`}>
            {CATEGORY_LABELS[entry.category]}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white line-clamp-1">{entry.clientName}</h3>
          {entry.featured && (
            <FiStar className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400 line-clamp-1">{entry.title}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FiDollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{formatCurrency(entry.salesValue)}</span>
          </div>
          {entry.achievementDate && (
            <span className="text-[10px] text-gray-500">{formatDate(entry.achievementDate)}</span>
          )}
        </div>
        {entry.description && (
          <p className="mt-2 text-xs text-gray-500 line-clamp-2">{entry.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Entry Detail Modal ─────────────────────────────────
function EntryModal({ entry, onClose, onShare }: {
  entry: HallOfFameEntry;
  onClose: () => void;
  onShare: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 backdrop-blur-md p-4 py-8"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl my-auto"
      >
        {/* Close button */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Hall da Fama</p>
            <h2 className="text-xl font-bold text-white">{entry.clientName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <FiShare2 className="h-4 w-4" /> Compartilhar
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
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

        {/* Details */}
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {/* Main info */}
          <div className="sm:col-span-2 space-y-4">
            <div>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${CATEGORY_COLORS[entry.category]}`}>
                {CATEGORY_LABELS[entry.category]}
              </span>
              {entry.featured && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-bold text-yellow-400">
                  <FiStar className="h-3 w-3" /> Destaque
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white">{entry.title}</h3>

            <div className="flex items-center gap-2 rounded-xl bg-white/5 p-4 border border-white/5">
              <FiDollarSign className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-gray-400">Resultado alcançado</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(entry.salesValue)}</p>
              </div>
            </div>

            {entry.description && (
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-1">Depoimento</p>
                <p className="text-sm leading-relaxed text-gray-400">{entry.description}</p>
              </div>
            )}

            {entry.achievementDate && (
              <p className="text-xs text-gray-500">
                Conquista alcançada em {formatDate(entry.achievementDate)}
              </p>
            )}
          </div>

          {/* Photos sidebar */}
          <div className="space-y-4">
            {entry.clientPhoto && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">CLIENTE</p>
                <div className="overflow-hidden rounded-2xl border border-white/5">
                  <img
                    src={entry.clientPhoto}
                    alt={entry.clientName}
                    className="w-full aspect-[3/4] object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            {entry.trophyPhoto && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">PLACA / TROFÉU</p>
                <div className="overflow-hidden rounded-2xl border border-white/5">
                  <img
                    src={entry.trophyPhoto}
                    alt="Placa ou troféu"
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
