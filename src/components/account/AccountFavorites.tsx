"use client";

import { useFavorites } from "@/providers/favorites-provider";
import { FiHeart, FiX } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function AccountFavorites() {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="py-12 text-center">
        <FiHeart className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-500">Você ainda não tem favoritos</p>
        <p className="mt-1 text-xs text-gray-400">Clique no coração dos produtos que gostar para salvá-los aqui</p>
        <Link href="/produtos" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90">
          Explorar Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {favorites.map((product) => (
        <div key={product.id}
          className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition-all hover:border-primary/20 hover:shadow-md">
          <Link href={`/produto/${product.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill sizes="64px" className="object-contain p-1" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiHeart className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </Link>
          <Link href={`/produto/${product.slug}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary">{product.name}</p>
            <p className="mt-0.5 text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
          </Link>
          <button onClick={() => removeFavorite(product.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
            <FiX className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
