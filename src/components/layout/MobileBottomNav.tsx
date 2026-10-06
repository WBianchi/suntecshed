"use client";

import { FiHome, FiSearch, FiHeart, FiUser } from "react-icons/fi";
import { FiShoppingBag } from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { useAuth } from "@/providers/auth-provider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { count: favCount, openFavorites } = useFavorites();
  const { user } = useAuth();

  // Hide on product pages — sticky add-to-cart bar replaces it
  if (pathname.startsWith("/produto/")) return null;

  const accountHref = user
    ? user.role === "ADMIN" ? "/admin" : "/minha-conta"
    : "/entrar";

  const focusSearch = () => {
    const el = document.getElementById("mobile-search-bar");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => el?.querySelector("input")?.focus(), 350);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/95 md:hidden">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-medium transition-colors",
            pathname === "/" ? "text-primary" : "text-gray-400"
          )}
        >
          <FiHome className={cn("h-5 w-5", pathname === "/" && "stroke-[2.5]")} />
          <span>Início</span>
        </Link>

        {/* Abre a mesma busca expansiva que já fica sob o header no mobile,
            em vez de navegar pra uma página de busca separada. */}
        <button
          onClick={focusSearch}
          className="flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-medium text-gray-400 transition-colors"
        >
          <FiSearch className="h-5 w-5" />
          <span>Buscar</span>
        </button>

        {/* Center Cart Button */}
        <div className="relative -mt-5 flex flex-col items-center">
          <Link
            href="/carrinho"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <FiShoppingBag className="h-6 w-6 text-white" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <span className="mt-1 text-[10px] font-medium text-primary">Carrinho</span>
        </div>

        {/* Abre o mesmo painel de favoritos do header, em vez de navegar
            pra uma página de favoritos que não existe. */}
        <button
          onClick={openFavorites}
          className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-medium text-gray-400 transition-colors"
        >
          <FiHeart className="h-5 w-5" />
          {favCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
              {favCount}
            </span>
          )}
          <span>Favoritos</span>
        </button>

        <Link
          href={accountHref}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-medium transition-colors",
            pathname === accountHref ? "text-primary" : "text-gray-400"
          )}
        >
          <FiUser className={cn("h-5 w-5", pathname === accountHref && "stroke-[2.5]")} />
          <span>{user ? "Conta" : "Entrar"}</span>
        </Link>
      </div>
    </nav>
  );
}
