"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  quantity: number;
  color?: string;
  colorHex?: string;
  size?: string;
  sku?: string;
  tier?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  days: string;
  company: string;
}

interface CartContextType {
  items: CartProduct[];
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  addItem: (product: Omit<CartProduct, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  shipping: ShippingOption | null;
  setShipping: (option: ShippingOption | null) => void;
}

const ATACADO_MIN_QTY = 6;

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [shipping, setShipping] = useState<ShippingOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("Suntecshed_cart");
      if (stored) setItems(JSON.parse(stored));
      const storedShipping = localStorage.getItem("Suntecshed_shipping");
      if (storedShipping) setShipping(JSON.parse(storedShipping));
    } catch {}
    setHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("Suntecshed_cart", JSON.stringify(items));
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (shipping) {
      localStorage.setItem("Suntecshed_shipping", JSON.stringify(shipping));
    } else {
      localStorage.removeItem("Suntecshed_shipping");
    }
  }, [shipping, hydrated]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSavings = items.reduce(
    (sum, item) => sum + (item.compareAtPrice ? (item.compareAtPrice - item.price) * item.quantity : 0),
    0
  );

  const addItem = useCallback((product: Omit<CartProduct, "quantity"> & { quantity?: number }) => {
    const qty = product.quantity || 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        // Atacado exige quantidade mínima de 6 unidades — não deixa reduzir abaixo disso.
        const clamped = i.tier === "Atacado" ? Math.max(quantity, ATACADO_MIN_QTY) : quantity;
        return { ...i, quantity: clamped };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setShipping(null);
  }, []);
  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        totalSavings,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        isOpen,
        openCart,
        closeCart,
        shipping,
        setShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
