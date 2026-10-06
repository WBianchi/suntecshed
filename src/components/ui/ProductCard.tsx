"use client";

import { FiHeart, FiShoppingCart, FiBarChart2, FiDownload } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { cn, formatCurrency, formatDiscount, downloadFiles } from "@/lib/utils";
import { bestInstallmentPitch } from "@/lib/installments";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { useCompare } from "@/providers/compare-provider";
import Image from "next/image";
import Link from "next/link";
import { useProductClick } from "@/hooks/use-tracking";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  isNew?: boolean;
  bestSeller?: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  manageStock?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  image,
  isNew,
  bestSeller,
  rating = 0,
  reviewCount = 0,
  stock,
  manageStock,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleItem, isComparing } = useCompare();
  const trackClick = useProductClick();
  const favorited = isFavorite(id);
  const comparing = isComparing(id);
  const discount = compareAtPrice ? formatDiscount(price, compareAtPrice) : 0;
  const outOfStock = manageStock === true && typeof stock === "number" && stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({ id, name, slug, price, compareAtPrice: compareAtPrice ?? undefined, image });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id, name, slug, price, compareAtPrice: compareAtPrice ?? undefined, image });
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({ id, name, slug, price, compareAtPrice: compareAtPrice ?? undefined, image, rating, reviewCount });
  };

  const handleDownloadImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    downloadFiles([{ url: image, name: `${slugBase || "produto"}.jpg` }]);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5">
      {/* Image */}
      <Link href={`/produto/${slug}`} onClick={() => trackClick(id)} className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-2 sm:top-2">
          {outOfStock ? (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
              Esgotado
            </span>
          ) : (
            <span className="rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
              Em Estoque
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
              -{discount}%
            </span>
          )}
          {isNew && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
              Novo
            </span>
          )}
          {bestSeller && (
            <span className="rounded-full bg-primary/80 px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
              Top
            </span>
          )}
        </div>

        {/* Quick Actions — sempre visíveis (mini cards não dependem de hover, principalmente no mobile) */}
        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1.5 sm:right-2 sm:top-2">
          <button
            onClick={handleToggleFavorite}
            title="Favoritar"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 sm:h-8 sm:w-8",
              favorited ? "text-red-500" : "text-gray-500 hover:text-red-500"
            )}
          >
            <FiHeart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", favorited && "fill-current")} />
          </button>
          <button
            onClick={handleToggleCompare}
            title="Comparar"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 sm:h-8 sm:w-8",
              comparing ? "text-primary" : "text-gray-500 hover:text-primary"
            )}
          >
            <FiBarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={handleDownloadImage}
            title="Baixar imagem"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:text-primary sm:h-8 sm:w-8"
          >
            <FiDownload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Add to Cart — botão circular fixo no canto, funciona em touch */}
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          title={outOfStock ? "Produto esgotado" : "Adicionar ao carrinho"}
          className={cn(
            "absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition-all sm:bottom-2 sm:right-2 sm:h-9 sm:w-9",
            outOfStock ? "cursor-not-allowed bg-gray-300" : "bg-primary hover:scale-110"
          )}
        >
          <FiShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        {/* Rating — espaço sempre reservado, mesmo sem avaliações, pra manter os cards simétricos */}
        <div className={cn("mb-1 flex items-center gap-0.5", rating <= 0 && "invisible")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className={cn(
                "h-2.5 w-2.5 sm:h-3 sm:w-3",
                i < rating ? "text-amber-400" : "text-gray-200 dark:text-gray-700"
              )}
            />
          ))}
          {reviewCount > 0 && (
            <span className="ml-1 text-[9px] text-muted-foreground sm:text-[10px]">
              ({reviewCount})
            </span>
          )}
        </div>

        <Link href={`/produto/${slug}`}>
          <h3 className="line-clamp-2 min-h-[2.2em] text-[11px] font-semibold leading-tight text-foreground transition-colors hover:text-primary sm:text-sm">
            {name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-wrap items-baseline gap-1 pt-2 sm:gap-1.5">
          <span className="text-xs font-bold text-primary sm:text-base">
            {formatCurrency(price)}
          </span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-[10px] text-muted-foreground line-through sm:text-xs">
              {formatCurrency(compareAtPrice)}
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-[9px] text-muted-foreground sm:text-[11px]">
          ou em até {bestInstallmentPitch(price).n}x de {formatCurrency(bestInstallmentPitch(price).installmentValue)}
        </p>
      </div>
    </div>
  );
}
