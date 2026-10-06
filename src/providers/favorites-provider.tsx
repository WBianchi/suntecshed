"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";

export interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  count: number;
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (product: FavoriteProduct) => void;
  isFavorite: (id: string) => boolean;
  isOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

function mapServerFavorite(fav: any): FavoriteProduct {
  const product = fav.product;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    image: product.images?.[0]?.url || "",
  };
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  // Convidado (não logado): favoritos ficam só no localStorage
  useEffect(() => {
    if (user) return;
    try {
      const stored = localStorage.getItem("C7drop_favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, [user]);

  useEffect(() => {
    if (!hydrated || user) return;
    localStorage.setItem("C7drop_favorites", JSON.stringify(favorites));
  }, [favorites, hydrated, user]);

  // Logado: os favoritos vivem no banco (mesma fonte usada em /minha-conta),
  // pra não divergir do que aparece na aba "Meus Favoritos". Ao logar, faz
  // merge único dos favoritos salvos localmente como convidado.
  useEffect(() => {
    if (!user) { mergedForUser.current = null; return; }
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    (async () => {
      try {
        const res = await fetch("/api/favorites", { credentials: "include" });
        const data = res.ok ? await res.json() : { favorites: [] };
        const serverFavorites: FavoriteProduct[] = (data.favorites || []).map(mapServerFavorite);

        let localFavorites: FavoriteProduct[] = [];
        try {
          const stored = localStorage.getItem("C7drop_favorites");
          if (stored) localFavorites = JSON.parse(stored);
        } catch {}

        const toMerge = localFavorites.filter((lf) => !serverFavorites.some((sf) => sf.id === lf.id));
        for (const item of toMerge) {
          try {
            await fetch("/api/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ productId: item.id }),
            });
          } catch {}
        }

        localStorage.removeItem("C7drop_favorites");
        setFavorites([...serverFavorites, ...toMerge]);
      } finally {
        setHydrated(true);
      }
    })();
  }, [user]);

  const count = favorites.length;

  const syncServer = useCallback((productId: string) => {
    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId }),
    }).catch(() => {});
  }, []);

  const addFavorite = useCallback((product: FavoriteProduct) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === product.id)) return prev;
      return [...prev, product];
    });
    if (user) syncServer(product.id);
    setIsOpen(true);
  }, [user, syncServer]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    if (user) syncServer(id);
  }, [user, syncServer]);

  // Abre o painel de favoritos ao adicionar — mesmo feedback visual que
  // adicionar ao carrinho já dá, pra ficar claro que o clique funcionou.
  const toggleFavorite = useCallback((product: FavoriteProduct) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === product.id)) {
        return prev.filter((f) => f.id !== product.id);
      }
      return [...prev, product];
    });
    if (user) syncServer(product.id);
    setIsOpen(true);
  }, [user, syncServer]);

  const isFavorite = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites]);
  const openFavorites = useCallback(() => setIsOpen(true), []);
  const closeFavorites = useCallback(() => setIsOpen(false), []);

  return (
    <FavoritesContext.Provider
      value={{ favorites, count, addFavorite, removeFavorite, toggleFavorite, isFavorite, isOpen, openFavorites, closeFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
