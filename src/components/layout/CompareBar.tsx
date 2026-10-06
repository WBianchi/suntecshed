"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiX, FiBarChart2, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { cn, formatCurrency } from "@/lib/utils";
import { useCompare } from "@/providers/compare-provider";
import { useCart } from "@/providers/cart-provider";

export function CompareBar() {
  const { items, count, maxItems, removeItem, clear } = useCompare();
  const { addItem: addToCart } = useCart();
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      {/* Floating bar */}
      <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 md:bottom-6">
        <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl shadow-black/10">
          <div className="flex -space-x-3">
            {items.map((item) => (
              <div key={item.id} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white">
                <Image src={item.image} alt={item.name} fill sizes="40px" className="object-contain p-1" />
              </div>
            ))}
          </div>
          <p className="flex-1 text-xs font-medium text-gray-600">
            {count}/{maxItems} produtos selecionados
          </p>
          <button
            onClick={clear}
            title="Limpar comparação"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(true)}
            disabled={count < 2}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-white disabled:opacity-50"
          >
            <FiBarChart2 className="h-3.5 w-3.5" />
            Comparar
          </button>
        </div>
      </div>

      {/* Comparison modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <FiBarChart2 className="h-4 w-4 text-primary" /> Comparar Produtos
              </h2>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-64px)] overflow-auto p-6">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(180px, 1fr))` }}>
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col rounded-2xl border border-gray-100 p-4">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/produto/${item.slug}`} onClick={() => setOpen(false)} className="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
                      <Image src={item.image} alt={item.name} fill sizes="200px" className="object-contain p-1" />
                    </Link>
                    <Link href={`/produto/${item.slug}`} onClick={() => setOpen(false)}>
                      <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 hover:text-primary">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={cn("h-3 w-3", i < (item.rating || 0) ? "text-amber-400" : "text-gray-200")} />
                      ))}
                      {!!item.reviewCount && <span className="ml-1 text-[10px] text-gray-400">({item.reviewCount})</span>}
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-primary">{formatCurrency(item.price)}</span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">{formatCurrency(item.compareAtPrice)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart({ id: item.id, name: item.name, slug: item.slug, price: item.price, compareAtPrice: item.compareAtPrice, image: item.image })}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/90"
                    >
                      <FiShoppingCart className="h-3.5 w-3.5" />
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
