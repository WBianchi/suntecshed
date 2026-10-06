"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { FiGrid } from "react-icons/fi";

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  featured: boolean;
  parentId: string | null;
  productCount: number;
}

export function HighlightBanners() {
  const { data: allCategories = [] } = useQuery<CategoryFromAPI[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Top-level categories with active products — featured ones first, max 4
  const banners = allCategories
    .filter((c) => c.parentId === null && c.productCount > 0)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 4);

  if (banners.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={`/categoria/${banner.slug}`}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {banner.image ? (
                  <Image
                    src={banner.image}
                    alt={banner.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <FiGrid className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8">
                {banner.featured && (
                  <span className="mb-2 inline-block w-fit rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Destaque
                  </span>
                )}
                <h3
                  className="text-2xl font-bold text-white sm:text-3xl"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  {banner.name}
                </h3>
                {banner.description && (
                  <p className="mt-1 max-w-xs text-sm text-white/80 line-clamp-2">{banner.description}</p>
                )}
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all group-hover:bg-primary group-hover:px-6">
                  Ver mais
                  <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
