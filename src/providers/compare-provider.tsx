"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
}

const MAX_COMPARE = 4;

interface CompareContextType {
  items: CompareProduct[];
  count: number;
  maxItems: number;
  isFull: boolean;
  addItem: (product: CompareProduct) => void;
  removeItem: (id: string) => void;
  toggleItem: (product: CompareProduct) => void;
  isComparing: (id: string) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("C7drop_compare");
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("C7drop_compare", JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: CompareProduct) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, product];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleItem = useCallback((product: CompareProduct) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, product];
    });
  }, []);

  const isComparing = useCallback((id: string) => items.some((p) => p.id === id), [items]);
  const clear = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider
      value={{
        items,
        count: items.length,
        maxItems: MAX_COMPARE,
        isFull: items.length >= MAX_COMPARE,
        addItem,
        removeItem,
        toggleItem,
        isComparing,
        clear,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
