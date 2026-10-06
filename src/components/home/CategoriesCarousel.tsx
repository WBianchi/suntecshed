"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

export function CategoriesCarousel() {
  const { data: allCategories = [] } = useQuery<CategoryFromAPI[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Only show categories that have active products linked
  const categories = allCategories.filter((c) => c.productCount > 0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 2,
    dragFree: true,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (categories.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Categorias
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore nossos departamentos
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="rounded-full border border-border p-2.5 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollNext}
              className="rounded-full border border-border p-2.5 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="group min-w-0 flex-[0_0_calc(50%-8px)] sm:flex-[0_0_calc(33.333%-11px)] md:flex-[0_0_calc(20%-13px)] lg:flex-[0_0_calc(16.666%-14px)]"
              >
                <div className="relative overflow-hidden rounded-[26px]">
                  <div className="relative aspect-square overflow-hidden">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <FiGrid className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
