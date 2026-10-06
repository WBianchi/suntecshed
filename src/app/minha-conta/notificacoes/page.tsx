"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiBell,
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
} from "react-icons/fi";
import type { AppNotification } from "@/app/api/notifications/route";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dia${days === 1 ? "" : "s"} atrás`;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "stock_change")
    return <FiPackage className="h-5 w-5 text-indigo-500" />;
  if (type === "stock_out")
    return <FiAlertTriangle className="h-5 w-5 text-red-500" />;
  if (type === "price_change")
    return <FiTrendingUp className="h-5 w-5 text-green-500" />;
  return <FiBell className="h-5 w-5 text-gray-400" />;
}

function PriceIcon({ desc }: { desc: string }) {
  if (desc.includes("desconto")) {
    return <FiTrendingDown className="h-5 w-5 text-red-500" />;
  }
  return <FiTrendingUp className="h-5 w-5 text-green-500" />;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsCenterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (search.trim()) queryParams.set("q", search.trim());

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-center", page, search],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!res.ok)
        return { notifications: [], totalCount: 0, totalPages: 0, page: 1 };
      return res.json() as Promise<{
        notifications: AppNotification[];
        totalCount: number;
        totalPages: number;
        page: number;
      }>;
    },
    placeholderData: (prev) => prev,
  });

  const notifications = data?.notifications || [];
  const totalPages = data?.totalPages || 1;

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!user) {
    router.replace("/entrar");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/minha-conta"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary"
            >
              <FiArrowLeft className="h-4 w-4" />
              Voltar para Minha Conta
            </Link>
            <h1
              className="text-3xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Central de Notificações
            </h1>
            <p className="mt-1 text-gray-500">
              Acompanhe todas as alterações de estoque e preço dos produtos.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome do produto..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Notifications list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FiBell className="h-7 w-7 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {search.trim()
                  ? "Nenhuma notificação encontrada"
                  : "Nenhuma notificação"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {search.trim()
                  ? `Nenhum resultado para "${search.trim()}".`
                  : "As notificações de alterações de estoque e preço aparecerão aqui."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((n) => {
                  const isRecent =
                    Date.now() - new Date(n.timestamp).getTime() <
                    24 * 60 * 60 * 1000;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex gap-4 rounded-2xl border p-4 transition-colors hover:bg-gray-50",
                        isRecent
                          ? "border-primary/10 bg-primary/[0.02]"
                          : "border-gray-100"
                      )}
                    >
                      {/* Product image or icon */}
                      {n.imageUrl ? (
                        <Link
                          href={`/produto/${n.productId}`}
                          className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                        >
                          <img
                            src={n.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </Link>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                          {n.type === "price_change" ? (
                            <PriceIcon desc={n.desc} />
                          ) : (
                            <NotificationIcon type={n.type} />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "font-semibold",
                              isRecent ? "text-gray-900" : "text-gray-700"
                            )}
                          >
                            {n.title}
                          </p>
                          {isRecent && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{n.desc}</p>
                        <p className="mt-1.5 text-xs text-gray-400">
                          {formatDate(n.timestamp)} · {timeAgo(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, current, and neighbors
                      if (p === 1 || p === totalPages) return true;
                      if (Math.abs(p - page) <= 1) return true;
                      return false;
                    })
                    .map((p, idx, arr) => {
                      const showEllipsis =
                        idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <div key={p} className="flex items-center gap-2">
                          {showEllipsis && (
                            <span className="px-1 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            className={cn(
                              "flex h-10 min-w-[40px] items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors",
                              p === page
                                ? "border-primary bg-primary text-white"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
