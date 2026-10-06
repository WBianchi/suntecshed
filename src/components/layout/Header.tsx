"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "./SearchBar";
import { MiniCart } from "./MiniCart";
import { WalletWidget } from "./WalletWidget";
import { FavoritesPanel } from "./FavoritesPanel";
import { CategoriesDropdown } from "./CategoriesDropdown";
import { HeaderNotifications } from "./HeaderNotifications";
import { useAuth } from "@/providers/auth-provider";
import { getCategoryIcon } from "@/lib/category-icons";
import { flattenAdminMenu, type AdminMenuEntry } from "@/lib/admin-menu";
import {
  FiUser, FiChevronDown, FiLogOut, FiMenu, FiX,
  FiPackage, FiHeart, FiTruck, FiHome, FiPhone, FiStar, FiSettings,
  FiChevronRight, FiShoppingBag, FiPercent, FiHeadphones,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
}

type MenuEntry = AdminMenuEntry;

// Mesmos módulos (e mesma ordem) do accordion de /minha-conta — o link já
// abre direto na aba certa via ?tab=.
const clientMenuEntries: MenuEntry[] = [
  { type: "link", label: "My Profile", href: "/minha-conta?tab=perfil", icon: FiUser },
  { type: "link", label: "My Orders", href: "/minha-conta?tab=pedidos", icon: FiPackage },
  { type: "link", label: "My Favorites", href: "/minha-conta?tab=favoritos", icon: FiHeart },
  { type: "link", label: "My Reviews", href: "/minha-conta?tab=avaliacoes", icon: FiStar },
  { type: "link", label: "Track Order", href: "/minha-conta?tab=rastrear", icon: FiTruck },
  { type: "link", label: "Settings", href: "/minha-conta?tab=config", icon: FiSettings },
];

// Mesmos itens (e mesmos links) da sidebar do admin — fonte única em
// @/lib/admin-menu, pra nunca ficar dessincronizado.
const adminMenuEntries: MenuEntry[] = flattenAdminMenu();

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: mobileCategories = [] } = useQuery<CategoryFromAPI[]>({
    queryKey: ["public-categories-megamenu"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const topLevelMobileCategories = mobileCategories.filter((c) => c.parentId === null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

  const menuEntries = user?.role === "ADMIN" ? adminMenuEntries : clientMenuEntries;

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Main Header */}
      <div className="border-b border-border bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 md:gap-4 md:py-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img src="/logo.png" alt="Suntecshed" className="h-14 w-auto object-contain md:h-[72px]" />
          </Link>

          {/* Categories dropdown - hidden on mobile */}
          <div className="hidden md:block">
            <CategoriesDropdown />
          </div>

          {/* Search - hidden on mobile (use bottom nav search) */}
          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>

          {/* Atendimento — CTA do header */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <a
              href="https://wa.me/553898842080"
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-transform hover:scale-105"
            >
              <FiHeadphones className="h-3.5 w-3.5" />
              Support
            </a>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Desktop: carteira antes dos ícones, como já era */}
            {user && <div className="hidden md:block"><WalletWidget /></div>}

            <FavoritesPanel />

            {/* Mobile: carteira logo depois dos favoritos */}
            {user && <div className="md:hidden"><WalletWidget /></div>}

            {/* Notificações (sininho) — visível apenas para usuário logado */}
            {user && <HeaderNotifications />}

            <MiniCart />

            {/* User Area */}
            {loading ? (
              <div className="hidden h-10 w-20 animate-pulse rounded-full bg-gray-100 md:block" />
            ) : user ? (
              <div ref={menuRef} className="relative hidden md:block">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-left lg:block">
                    <p className="max-w-[120px] truncate text-xs font-semibold text-gray-900 leading-tight">
                      {user.name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {user.role === "ADMIN" ? "Admin" : "Customer"}
                    </p>
                  </div>
                  <FiChevronDown className={`hidden h-3.5 w-3.5 text-gray-400 transition-transform lg:block ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/5">
                    {/* User Info */}
                    <div className="border-b border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                          <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {user.role === "ADMIN" ? "Administrador" : "Customer"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="max-h-[26rem] overflow-y-auto py-1.5 scrollbar-thin">
                      {menuEntries.map((entry, i) =>
                        entry.type === "heading" ? (
                          <p
                            key={`h-${i}`}
                            className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 first:pt-1.5"
                          >
                            {entry.label}
                          </p>
                        ) : (
                          <Link
                            key={entry.href}
                            href={entry.href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
                          >
                            <entry.icon className="h-4 w-4 text-gray-400" />
                            {entry.label}
                          </Link>
                        )
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/entrar"
                className="hidden items-center gap-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 md:flex"
              >
                <FiUser className="h-5 w-5" />
                <span className="hidden text-sm font-semibold lg:block">Sign in</span>
              </Link>
            )}

            {/* Mobile hamburger — sempre o último ícone, mais à direita */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div id="mobile-search-bar" className="border-t border-border px-4 py-2 md:hidden">
          <SearchBar />
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
            <img src="/logo.png" alt="Suntecshed" className="h-14 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Section */}
          {user ? (
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b border-gray-100 px-5 py-4">
              <Link
                href="/entrar"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white"
              >
                <FiUser className="h-4 w-4" />
                Sign in / Create account
              </Link>
            </div>
          )}

          {/* Nav Links */}
          <div className="border-b border-gray-100 py-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FiHome className="h-4 w-4 text-gray-400" /> Home
            </Link>
            <Link href="/produtos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FiShoppingBag className="h-4 w-4 text-gray-400" /> All Products
            </Link>
            <Link href="/ofertas" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FiPercent className="h-4 w-4 text-gray-400" /> Deals
            </Link>
          </div>

          {/* Categories — expansível */}
          <div className="border-b border-gray-100 py-2">
            <button
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400"
            >
              Categories
              <FiChevronDown className={cn("h-4 w-4 transition-transform", mobileCategoriesOpen && "rotate-180")} />
            </button>
            <div className={cn("overflow-hidden transition-all", mobileCategoriesOpen ? "max-h-[600px] overflow-y-auto" : "max-h-0")}>
              {topLevelMobileCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    href={`/categoria/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{cat.name}</span>
                    <FiChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu Items */}
          {user && (
            <div className="border-b border-gray-100 py-2">
              <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {user.role === "ADMIN" ? "Admin" : "My Account"}
              </p>
              {menuEntries.map((entry, i) =>
                entry.type === "heading" ? (
                  <p
                    key={`h-${i}`}
                    className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 first:pt-1"
                  >
                    {entry.label}
                  </p>
                ) : (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <entry.icon className="h-4 w-4 text-gray-400" />
                    {entry.label}
                  </Link>
                )
              )}
            </div>
          )}

          {/* Help */}
          <div className="py-2">
            <Link href="/ajuda" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50">
              <FiPhone className="h-4 w-4 text-gray-400" /> Help Center
            </Link>
          </div>
        </div>

        {/* Mobile Menu Footer */}
        {user && (
          <div className="border-t border-gray-100 px-5 py-3">
            <button
              onClick={async () => { setMobileMenuOpen(false); await logout(); router.push("/"); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <FiLogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
