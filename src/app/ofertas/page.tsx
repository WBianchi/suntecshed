"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryHeader } from "@/components/category/CategoryHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { FiLoader } from "react-icons/fi";

export default function OfertasPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["ofertas-products", currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(currentPage), limit: "24", onSale: "true" });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) return { products: [], total: 0, totalPages: 0 };
      return res.json();
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1440px] px-4 py-4">
          <Breadcrumb
            items={[
              { label: "Ofertas" },
            ]}
          />
        </div>

        {/* Header Banner */}
        <div className="mx-auto max-w-[1440px] px-4 pb-8">
          <CategoryHeader
            name="Ofertas Especiais"
            description="Aproveite nossos melhores descontos em eletrônicos e acessórios. Produtos selecionados com preços imperdíveis por tempo limitado."
            productCount={total}
            image="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600"
          />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[1440px] px-4 pb-20 md:pb-12">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <FiLoader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-20 text-center text-sm text-gray-500">Nenhuma oferta disponível no momento.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product: any) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                        currentPage === page
                          ? "bg-primary text-white"
                          : "border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
