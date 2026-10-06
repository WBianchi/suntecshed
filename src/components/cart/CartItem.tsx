"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2, FiHeart } from "react-icons/fi";

export interface CartItemData {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  color?: string;
  colorHex?: string;
  size?: string;
  sku?: string;
  tier?: string;
}

const ATACADO_MIN_QTY = 6;

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 300);
  };

  const discount = item.compareAtPrice
    ? Math.round((1 - item.price / item.compareAtPrice) * 100)
    : 0;

  return (
    <div
      className={`flex gap-4 rounded-[26px] border border-gray-100 bg-white p-4 transition-all sm:p-5 ${
        removing ? "scale-95 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      {/* Image */}
      <Link href={`/produto/${item.slug}`} className="shrink-0">
        <div className="relative h-24 w-24 overflow-hidden rounded-xl sm:h-28 sm:w-28">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="112px"
            className="object-contain p-1.5 transition-transform duration-300 hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/produto/${item.slug}`} className="group">
              <h3 className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary sm:text-base">
                {item.name}
              </h3>
            </Link>
            <div className="flex shrink-0 gap-1">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
                title="Mover para favoritos"
              >
                <FiHeart className="h-4 w-4" />
              </button>
              <button
                onClick={handleRemove}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Remover"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Variants */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {item.tier && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.tier === "Grupo Vip"
                    ? "bg-primary/10 text-primary"
                    : item.tier === "Atacado"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.tier}
              </span>
            )}
            {item.color && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600">
                {item.colorHex && (
                  <span className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: item.colorHex }} />
                )}
                {item.color}
              </span>
            )}
            {item.size && (
              <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600">
                {item.size}
              </span>
            )}
            {item.sku && (
              <span className="hidden text-[10px] text-gray-400 sm:inline">SKU: {item.sku}</span>
            )}
          </div>
        </div>

        {/* Bottom: Qty + Price */}
        <div className="mt-3 flex items-end justify-between">
          {/* Quantity */}
          <div className="flex items-center rounded-full border border-gray-200">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1 || (item.tier === "Atacado" && item.quantity <= ATACADO_MIN_QTY)}
              title={item.tier === "Atacado" && item.quantity <= ATACADO_MIN_QTY ? "Quantidade mínima do Atacado: 6 unidades" : undefined}
              className="flex h-8 w-8 items-center justify-center rounded-l-full text-gray-500 transition-colors hover:bg-gray-50 disabled:text-gray-300"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 w-10 items-center justify-center text-sm font-semibold text-gray-900">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-r-full text-gray-500 transition-colors hover:bg-gray-50"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            {item.compareAtPrice && (
              <p className="text-xs text-gray-400 line-through">
                R$ {(item.compareAtPrice * item.quantity).toFixed(2).replace(".", ",")}
              </p>
            )}
            <p className="text-base font-bold text-gray-900 sm:text-lg">
              R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] text-gray-400">
                R$ {item.price.toFixed(2).replace(".", ",")} cada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
