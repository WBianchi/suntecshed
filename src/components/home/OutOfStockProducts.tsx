"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function OutOfStockProducts() {
  const { data } = useQuery({
    queryKey: ["out-of-stock-products"],
    queryFn: async () => {
      const res = await fetch("/api/products?outOfStock=true&limit=12");
      if (!res.ok) return { products: [] };
      return res.json();
    },
  });

  const products = data?.products || [];

  if (products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1440px] px-4">
        <SectionHeader
          title="Fora de Estoque"
          subtitle="Produtos que estão temporariamente indisponíveis"
          href="/produtos"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
              manageStock={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
