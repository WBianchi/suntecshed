"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiPlus, FiShoppingCart, FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface ComboProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
}

interface BuyTogetherSectionProps {
  products?: ComboProduct[];
}

export function BuyTogetherSection({ products = [] }: BuyTogetherSectionProps) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (products.length >= 2) {
      setSelected([products[0].id, products[1].id]);
    } else if (products.length === 1) {
      setSelected([products[0].id]);
    }
  }, [products]);

  if (products.length === 0) return null;

  const comboProducts = products;
  const [added, setAdded] = useState(false);

  const toggleProduct = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const selectedProducts = comboProducts.filter((p) => selected.includes(p.id));
  const totalOriginal = selectedProducts.reduce((sum, p) => sum + (p.compareAtPrice || p.price), 0);
  const totalCombo = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const comboDiscount = totalOriginal > totalCombo ? Math.round((1 - totalCombo / totalOriginal) * 100) : 5;
  const finalPrice = totalCombo * 0.95;

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className="border-t border-gray-100 py-12">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
            Buy Together & Save
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Combine products and get <span className="font-semibold text-primary">5% extra discount</span>
          </p>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {comboProducts.map((product) => {
            const isSelected = selected.includes(product.id);
            return (
              <button
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                    : "border-gray-100 bg-white hover:border-gray-300"
                )}
              >
                {/* Checkbox */}
                <div className={cn(
                  "absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white"
                )}>
                  {isSelected && <FiCheck className="h-3.5 w-3.5" />}
                </div>

                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className={cn(
                      "object-contain p-2 transition-all duration-300",
                      isSelected ? "brightness-100" : "brightness-95 group-hover:brightness-100"
                    )}
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="line-clamp-2 text-xs font-medium leading-tight text-gray-700">
                    {product.name}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-[10px] text-gray-400 line-through">
                        R$ {product.compareAtPrice.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {selectedProducts.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex -space-x-2 sm:-space-x-3">
                  {selectedProducts.slice(0, 3).map((p) => (
                    <div key={p.id} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm sm:h-12 sm:w-12">
                      <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                  ))}
                  {selectedProducts.length > 3 && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] font-bold text-white shadow-sm sm:h-12 sm:w-12 sm:text-xs">
                      +{selectedProducts.length - 3}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                    {selectedProducts.length} {selectedProducts.length === 1 ? "product" : "products"}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                    {totalOriginal > totalCombo && (
                      <span className="text-[10px] text-gray-400 line-through sm:text-xs">R$ {totalOriginal.toFixed(2).replace(".", ",")}</span>
                    )}
                    <span className="text-base font-extrabold text-primary sm:text-lg">
                      R$ {finalPrice.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary sm:px-2 sm:text-[10px]">
                      -{comboDiscount}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleAdd}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wide transition-all sm:w-auto sm:px-8 sm:text-sm",
                  added
                    ? "bg-green-500 text-white"
                    : "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]"
                )}
              >
                {added ? (
                  <><FiCheck className="h-4 w-4 sm:h-5 sm:w-5" /> Added!</>
                ) : (
                  <><FiShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" /> Add Combo</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
