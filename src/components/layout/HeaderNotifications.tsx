"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  FiBell,
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
} from "react-icons/fi";
import Link from "next/link";
import type { AppNotification } from "@/app/api/notifications/route";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "stock_change")
    return <FiPackage className="h-4 w-4 text-indigo-500" />;
  if (type === "stock_out")
    return <FiAlertTriangle className="h-4 w-4 text-red-500" />;
  if (type === "price_change")
    return <FiTrendingUp className="h-4 w-4 text-green-500" />;
  return <FiBell className="h-4 w-4 text-gray-400" />;
}

function PriceIcon({ desc }: { desc: string }) {
  if (desc.includes("desconto")) {
    return <FiTrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <FiTrendingUp className="h-4 w-4 text-green-500" />;
}

export function HeaderNotifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data } = useQuery({
    queryKey: ["header-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=5", { credentials: "include" });
      if (!res.ok) return { notifications: [], unreadCount: 0, totalCount: 0 };
      return res.json() as Promise<{
        notifications: AppNotification[];
        unreadCount: number;
        totalCount: number;
      }>;
    },
    refetchInterval: 60_000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalCount = data?.totalCount || 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100"
      >
        <FiBell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop em mobile */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 sm:w-96">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                </h3>
                {totalCount > 5 && (
                  <Link
                    href="/minha-conta/notificacoes"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    See all ({totalCount})
                    <FiArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-400">
                    No recent notifications.
                  </p>
                )}
                {notifications.map((n) => {
                  const isRecent =
                    Date.now() - new Date(n.timestamp).getTime() <
                    24 * 60 * 60 * 1000;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex gap-3 rounded-xl p-3 transition-all hover:bg-gray-50",
                        isRecent && "bg-primary/[0.03]"
                      )}
                    >
                      {n.imageUrl ? (
                        <Link
                          href={`/produto/${n.productId}`}
                          onClick={() => setOpen(false)}
                          className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                        >
                          <img
                            src={n.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </Link>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
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
                              "text-sm",
                              isRecent
                                ? "font-semibold text-gray-900"
                                : "text-gray-700"
                            )}
                          >
                            {n.title}
                          </p>
                          {isRecent && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {n.desc}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {timeAgo(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Link para central de notificações */}
              <Link
                href="/minha-conta/notificacoes"
                onClick={() => setOpen(false)}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-primary"
              >
                Notification Center
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
