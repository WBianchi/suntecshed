"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  featured: boolean;
  productCount: number;
}

export function MiniCategoriesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: allCategories = [] } = useQuery<CategoryFromAPI[]>({
    queryKey: ["public-categories-mini"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mesma regra do carrossel da home: só as categorias marcadas como destaque
  const comProduto = allCategories.filter((c) => c.productCount > 0);
  const destaques = comProduto.filter((c) => c.featured);
  const categories = destaques.length > 0 ? destaques : comProduto;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className="border-t border-gray-100 py-8 sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 sm:text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
              Explore Categories
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 sm:mt-1 sm:text-sm">Discover more products you'll love</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-all hover:border-primary hover:text-primary"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-all hover:border-primary hover:text-primary"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="group flex shrink-0 items-center gap-3 rounded-full border border-gray-100 bg-white py-2 pl-2 pr-5 transition-all hover:border-primary hover:shadow-md hover:shadow-primary/5"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="48px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <FiGrid className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary">
                  {cat.name}
                </p>
                <p className="text-[10px] text-gray-400">{cat.productCount} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
