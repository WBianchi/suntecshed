"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiStar, FiCheck, FiXCircle, FiTrash2, FiExternalLink,
  FiMessageSquare, FiUser, FiPackage, FiClock,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? <FaStar key={i} className="h-3 w-3 text-amber-400" /> : <FaRegStar key={i} className="h-3 w-3 text-gray-300" />
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews", searchDebounced, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/reviews?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });

  const approveMut = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__reviewSearchTimer);
    (window as any).__reviewSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const reviews = data?.reviews || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const pendingCount = reviews.filter((r: any) => !r.approved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} avaliações no total</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2">
            <FiClock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por produto, cliente ou comentário..." />
          {search && (
            <button onClick={() => { setSearch(""); setSearchDebounced(""); }} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todas</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
        </select>

        <button onClick={() => refetch()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && reviews.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiMessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhuma avaliação encontrada</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchDebounced || statusFilter ? "Tente alterar os filtros" : "As avaliações dos clientes aparecerão aqui"}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!isLoading && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review: any) => {
            const productImg = review.product?.images?.[0]?.url;
            return (
              <div key={review.id}
                className={cn(
                  "rounded-2xl border bg-white p-5 transition-all",
                  review.approved ? "border-gray-100" : "border-amber-200 bg-amber-50/30"
                )}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Product thumbnail */}
                  <div className="flex items-center gap-3 sm:w-48 shrink-0">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {productImg ? (
                        <Image src={productImg} alt={review.product.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><FiPackage className="h-4 w-4 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">{review.product?.name}</p>
                      <Link href={`/produto/${review.product?.slug}`} target="_blank"
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                        Ver produto <FiExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Review content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{review.user?.name}</p>
                        <p className="text-[10px] text-gray-400">{review.user?.email} · {formatDateTime(review.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Stars rating={review.rating} />
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        review.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {review.approved ? "Aprovada" : "Pendente"}
                      </span>
                    </div>

                    {review.title && <h4 className="mt-2 text-sm font-bold text-gray-900">{review.title}</h4>}
                    {review.comment && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 sm:flex-col">
                    {!review.approved ? (
                      <button onClick={() => approveMut.mutate({ id: review.id, approved: true })}
                        disabled={approveMut.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50">
                        <FiCheck className="h-3.5 w-3.5" /> Aprovar
                      </button>
                    ) : (
                      <button onClick={() => approveMut.mutate({ id: review.id, approved: false })}
                        disabled={approveMut.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                        <FiXCircle className="h-3.5 w-3.5" /> Rejeitar
                      </button>
                    )}
                    <button onClick={() => {
                      if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
                        deleteMut.mutate(review.id);
                      }
                    }}
                      disabled={deleteMut.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                      <FiTrash2 className="h-3.5 w-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">
            Mostrando <strong>{(page - 1) * limit + 1}</strong>–<strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <FiChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pn = page <= 3 ? i + 1 : page + i - 2;
              if (pn < 1 || pn > totalPages) return null;
              return (
                <button key={pn} onClick={() => setPage(pn)}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium", page === pn ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50")}>
                  {pn}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
