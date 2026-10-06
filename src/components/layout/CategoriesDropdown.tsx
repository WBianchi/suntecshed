"use client";

import { useState, useRef, useEffect } from "react";
import { FiGrid, FiChevronDown } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";
import Link from "next/link";

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  featured: boolean;
  productCount: number;
}

export function CategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: categories = [] } = useQuery<CategoryFromAPI[]>({
    queryKey: ["public-categories-megamenu"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const childrenMap = new Map<string, CategoryFromAPI[]>();
  for (const cat of categories) {
    if (cat.parentId && cat.productCount > 0) {
      const siblings = childrenMap.get(cat.parentId) || [];
      siblings.push(cat);
      childrenMap.set(cat.parentId, siblings);
    }
  }

  const parentCategories = categories.filter(
    (c) => c.parentId === null && (c.productCount > 0 || (childrenMap.get(c.id)?.length ?? 0) > 0)
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-gray-200"
      >
        <FiGrid className="h-4 w-4" />
        Categories
        <FiChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && parentCategories.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-3 w-[860px] max-w-[92vw] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:bg-gray-900 animate-fade-in-up">
          <div className="grid grid-cols-3 gap-x-10 gap-y-8 p-8">
            {parentCategories.map((cat, i) => {
              const subs = childrenMap.get(cat.id) || [];
              const Icon = getCategoryIcon(cat.slug);
              const hasDividerBefore = i % 3 !== 0;
              return (
                <div
                  key={cat.slug}
                  className={cn(hasDividerBefore && "border-l border-gray-100 pl-6")}
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-2.5 pb-3 text-sm font-bold text-foreground transition-colors hover:text-primary"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex items-center gap-1.5">
                      {cat.name}
                      {cat.featured && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                    </span>
                  </Link>
                  {subs.length > 0 && (
                    <div className="space-y-2.5 border-t border-gray-50 pt-3">
                      {subs.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/categoria/${sub.slug}`}
                          onClick={() => setOpen(false)}
                          className="block text-[13px] text-muted-foreground transition-all hover:translate-x-1 hover:text-primary"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 px-8 py-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Deals</span>
              <p className="text-sm text-muted-foreground">
                Check out <strong className="text-foreground">this week's discounts</strong> on selected products
              </p>
            </div>
            <Link
              href="/ofertas"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
            >
              See Deals
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
