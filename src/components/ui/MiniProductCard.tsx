"use client";

import { cn, formatCurrency, formatDiscount } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import Image from "next/image";
import Link from "next/link";

interface MiniProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  isNew?: boolean;
  bestSeller?: boolean;
}

export function MiniProductCard({
  id, name, slug, price, compareAtPrice, image, isNew, bestSeller,
}: MiniProductCardProps) {
  const { addItem } = useCart();
  const discount = compareAtPrice ? formatDiscount(price, compareAtPrice) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, slug, price, compareAtPrice: compareAtPrice ?? undefined, image });
  };

  return (
    <Link
      href={`/produto/${slug}`}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-border bg-card transition-all hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
          className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
        />
        {(discount > 0 || isNew || bestSeller) && (
          <span
            className={cn(
              "absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white",
              discount > 0 ? "bg-primary" : isNew ? "bg-primary" : "bg-primary/80"
            )}
          >
            {discount > 0 ? `-${discount}%` : isNew ? "New" : "Top"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="text-xs font-medium text-foreground line-clamp-2">{name}</h3>
        <div className="mt-auto flex items-baseline gap-1.5 pt-1.5">
          <span className="text-sm font-bold text-primary">{formatCurrency(price)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatCurrency(compareAtPrice)}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="mt-2 rounded-full bg-primary/10 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Add
        </button>
      </div>
    </Link>
  );
}
