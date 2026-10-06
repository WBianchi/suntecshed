"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { flattenAdminMenu } from "@/lib/admin-menu";
import {
  FiBell, FiGlobe, FiSun, FiMoon, FiMaximize, FiMinimize,
  FiLogOut, FiChevronDown, FiPackage,
  FiAlertCircle, FiCheckCircle, FiSearch, FiMenu,
  FiHelpCircle, FiExternalLink,
  FiTrendingDown, FiTrendingUp, FiAlertTriangle,
} from "react-icons/fi";

const adminMenuEntries = flattenAdminMenu();

// ─── Dropdown wrapper ────────────────────────────────
function Dropdown({
  trigger,
  children,
  align = "right",
  width = "w-80",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            // Mobile/telas estreitas: preso à tela (não ao ícone que disparou),
            // logo abaixo da topbar — evita o painel sair da tela quando o
            // ícone não está colado na borda direita.
            "fixed inset-x-4 top-16 z-50 max-h-[75vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50",
            "sm:absolute sm:inset-x-auto sm:left-auto sm:top-full sm:mt-2 sm:max-h-none sm:overflow-visible",
            width,
            align === "right" ? "sm:right-0" : "sm:left-0"
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Icon Button ─────────────────────────────────────
function IconBtn({
  children,
  onClick,
  badge,
  active,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700",
        active && "bg-primary/5 text-primary",
        className
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Notifications ───────────────────────────────────
interface AdminNotification {
  id: string;
  type: "order" | "alert" | "success" | "stock_change" | "price_change" | "stock_out";
  title: string;
  desc: string;
  timestamp: string;
}

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
  if (type === "order") return <FiPackage className="h-4 w-4 text-blue-500" />;
  if (type === "alert") return <FiAlertCircle className="h-4 w-4 text-amber-500" />;
  if (type === "success") return <FiCheckCircle className="h-4 w-4 text-green-500" />;
  if (type === "stock_change") return <FiPackage className="h-4 w-4 text-indigo-500" />;
  if (type === "stock_out") return <FiAlertTriangle className="h-4 w-4 text-red-500" />;
  if (type === "price_change") {
    // Será decidido dinamicamente com base no conteúdo, default: verde (aumento)
    return <FiTrendingUp className="h-4 w-4 text-green-500" />;
  }
  return <FiBell className="h-4 w-4 text-gray-400" />;
}

// ─── Languages ───────────────────────────────────────
const languages = [
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
];

// ─── Main Component ──────────────────────────────────
export function AdminTopbar({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState("pt-BR");
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications", { credentials: "include" });
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json() as Promise<{ notifications: AdminNotification[]; unreadCount: number }>;
    },
    refetchInterval: 60_000,
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleDark = () => {
    setIsDark(!isDark);
    // placeholder — hook into next-themes later
  };

  const lang = languages.find((l) => l.code === currentLang);

  /** Retorna o ícone correto para price_change baseado no texto da notificação */
  function PriceIcon({ desc }: { desc: string }) {
    if (desc.includes("desconto")) {
      return <FiTrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <FiTrendingUp className="h-4 w-4 text-green-500" />;
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleMobileSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 md:flex">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar no painel..."
            className="w-56 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 lg:w-72"
          />
          <kbd className="hidden rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 lg:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* ── Voltar ao Site ── */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mr-1 flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 sm:px-3"
        >
          <FiExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar ao Site</span>
        </Link>

        {/* ── Notifications ── */}
        <Dropdown
          width="w-96"
          trigger={
            <IconBtn badge={unreadCount}>
              <FiBell className="h-[18px] w-[18px]" />
            </IconBtn>
          }
        >
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">Nenhuma notificação recente.</p>
              )}
              {notifications.map((n) => {
                const isRecent = Date.now() - new Date(n.timestamp).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 rounded-xl p-3 transition-all hover:bg-gray-50",
                      isRecent && "bg-primary/[0.03]"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      {n.type === "price_change" ? (
                        <PriceIcon desc={n.desc} />
                      ) : (
                        <NotificationIcon type={n.type} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm", isRecent ? "font-semibold text-gray-900" : "text-gray-700")}>
                          {n.title}
                        </p>
                        {isRecent && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{n.desc}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <Link
                href="/admin/vendas/pedidos"
                className="block text-center text-xs font-semibold text-primary hover:underline"
              >
                Ver todos os pedidos
              </Link>
            </div>
          </div>
        </Dropdown>

        {/* ── Language ── */}
        <Dropdown
          width="w-56"
          trigger={
            <IconBtn>
              <FiGlobe className="h-[18px] w-[18px]" />
            </IconBtn>
          }
        >
          <div className="p-2">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Idioma</p>
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setCurrentLang(l.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-gray-50",
                  currentLang === l.code ? "bg-primary/5 font-semibold text-primary" : "text-gray-600"
                )}
              >
                <span className="text-lg">{l.flag}</span>
                <span>{l.label}</span>
                {currentLang === l.code && <FiCheckCircle className="ml-auto h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </Dropdown>

        {/* ── Dark / Light ── */}
        <IconBtn onClick={toggleDark} active={isDark}>
          {isDark ? <FiMoon className="h-[18px] w-[18px]" /> : <FiSun className="h-[18px] w-[18px]" />}
        </IconBtn>

        {/* ── Fullscreen ── */}
        <IconBtn onClick={toggleFullscreen} className="hidden md:flex">
          {isFullscreen ? (
            <FiMinimize className="h-[18px] w-[18px]" />
          ) : (
            <FiMaximize className="h-[18px] w-[18px]" />
          )}
        </IconBtn>

        {/* ── Divider ── */}
        <div className="mx-1 h-8 w-px bg-gray-200" />

        {/* ── Profile ── */}
        <Dropdown
          width="w-72"
          trigger={
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all hover:bg-gray-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name || "Admin"}</p>
                <p className="text-[11px] text-gray-400">Administrador</p>
              </div>
              <FiChevronDown className="hidden h-3.5 w-3.5 text-gray-400 md:block" />
            </button>
          }
        >
          <div>
            {/* Profile Header */}
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name || "Admin C7drop"}</p>
                  <p className="text-xs text-gray-500">{user?.email || "admin@C7drop.com.br"}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items — mesmos da sidebar do admin, fonte única em @/lib/admin-menu */}
            <div className="max-h-[22rem] overflow-y-auto p-2">
              {adminMenuEntries.map((entry, i) =>
                entry.type === "heading" ? (
                  <p
                    key={`h-${i}`}
                    className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 first:pt-1"
                  >
                    {entry.label}
                  </p>
                ) : (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900"
                  >
                    <entry.icon className="h-4 w-4" />
                    {entry.label}
                  </Link>
                )
              )}
              <Link
                href="/ajuda"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900"
              >
                <FiHelpCircle className="h-4 w-4" />
                Central de Ajuda
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={async () => { await logout(); router.push("/entrar"); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 transition-all hover:bg-red-50"
              >
                <FiLogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
