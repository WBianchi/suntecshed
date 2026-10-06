"use client";

import { FiHeart, FiX, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { cn, formatCurrency } from "@/lib/utils";
import { useFavorites } from "@/providers/favorites-provider";
import { useCart } from "@/providers/cart-provider";
import Image from "next/image";
import Link from "next/link";

export function FavoritesPanel() {
  const { favorites, count, removeFavorite, isOpen, openFavorites, closeFavorites } = useFavorites();
  const { addItem } = useCart();

  const handleAddToCart = (fav: typeof favorites[0]) => {
    addItem({
      id: fav.id,
      name: fav.name,
      slug: fav.slug,
      price: fav.price,
      compareAtPrice: fav.compareAtPrice,
      image: fav.image,
    });
  };

  return (
    <>
      <button
        onClick={openFavorites}
        className="relative flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <FiHeart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={closeFavorites}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-bold">
            Favoritos{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({count})
            </span>
          </h3>
          <button
            onClick={closeFavorites}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiHeart className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <p className="text-lg font-semibold text-foreground">Nenhum favorito</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Salve seus produtos preferidos aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group flex gap-3 rounded-xl border border-border p-3 transition-all hover:shadow-md"
                >
                  <Link href={`/produto/${item.slug}`} onClick={closeFavorites} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-contain p-1.5 transition-transform group-hover:scale-105"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/produto/${item.slug}`} onClick={closeFavorites}>
                        <p className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary">
                          {item.name}
                        </p>
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(item.price)}
                        </span>
                        {item.compareAtPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(item.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        <FiShoppingCart className="h-3 w-3" />
                        Adicionar
                      </button>
                      <button
                        onClick={() => removeFavorite(item.id)}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
