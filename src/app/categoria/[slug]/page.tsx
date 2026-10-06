"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { CategoryFilters } from "@/components/category/CategoryFilters";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FiGrid, FiList, FiLoader } from "react-icons/fi";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");

  // Fetch category info
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const category = categories.find((c: any) => c.slug === slug);

  // Fetch products for this category
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["category-products", slug, currentPage, sortBy],
    queryFn: async () => {
      const res = await fetch(`/api/products?category=${slug}&page=${currentPage}&limit=24&sort=${sortBy}`);
      if (!res.ok) return { products: [], total: 0, totalPages: 0 };
      return res.json();
    },
    enabled: !!slug,
  });

  const products = productsData?.products || [];
  const total = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 1;

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // volta pra página 1 ao mudar ordenação
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1440px] px-4 py-4">
          <Breadcrumb
            items={[
              { label: category?.name || slug },
            ]}
          />
        </div>

        {/* Category Header Banner */}
        <div className="mx-auto max-w-[1440px] px-4 pb-8">
          <CategoryHeader
            name={category?.name || slug}
            description={category?.description || ""}
            productCount={total}
            image={category?.image}
          />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[1440px] px-4 pb-20 md:pb-12">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <div className="hidden w-[280px] shrink-0 lg:block">
              <CategoryFilters categorySlug={slug} sortBy={sortBy} onSortChange={handleSortChange} />
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar - Mobile filter button + Sort */}
              <div className="mb-6 lg:hidden">
                <CategoryFilters categorySlug={slug} sortBy={sortBy} onSortChange={handleSortChange} />
              </div>

              {/* Desktop toolbar */}
              <div className="mb-6 hidden items-center justify-between lg:flex">
                <p className="text-sm text-gray-500">
                  Exibindo <span className="font-semibold text-gray-900">{products.length}</span> de{" "}
                  <span className="font-semibold text-gray-900">{total}</span> produtos
                </p>

                {/* Grid Toggle */}
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
                  <button
                    onClick={() => setGridCols(3)}
                    className={cn(
                      "rounded-lg p-2 transition-all",
                      gridCols === 3 ? "bg-primary text-white" : "text-gray-400 hover:text-gray-700"
                    )}
                  >
                    <FiGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={cn(
                      "rounded-lg p-2 transition-all",
                      gridCols === 4 ? "bg-primary text-white" : "text-gray-400 hover:text-gray-700"
                    )}
                  >
                    <FiList className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <FiLoader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length > 0 ? (
                <div className={cn(
                  "grid gap-4 sm:gap-6",
                  "grid-cols-2",
                  gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                )}>
                  {products.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={product.price}
                      compareAtPrice={product.compareAtPrice}
                      image={product.image || "https://placehold.co/600x600?text=Sem+Imagem"}
                      isNew={product.isNew}
                      bestSeller={product.bestSeller}
                      stock={product.stock}
                      manageStock={product.manageStock}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-500">
                  Nenhum produto encontrado nesta categoria.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all",
                        currentPage === page
                          ? "bg-primary text-white"
                          : "border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
