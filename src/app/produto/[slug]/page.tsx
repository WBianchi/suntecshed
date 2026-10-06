"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CategoriesCarousel } from "@/components/home/CategoriesCarousel";
import { BuyTogetherSection } from "@/components/product/BuyTogetherSection";
import { MiniCategoriesCarousel } from "@/components/product/MiniCategoriesCarousel";
import { stripHtml } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { FiLoader } from "react-icons/fi";

async function fetchProduct(slug: string) {
  const res = await fetch(`/api/products/${slug}`);
  if (!res.ok) throw new Error("Produto não encontrado");
  return res.json();
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <FiLoader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-500">Carregando produto...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Produto não encontrado</h1>
            <p className="mt-2 text-gray-500">O produto que você procura não existe ou foi removido.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Map images
  const galleryImages = product.images?.length > 0
    ? product.images.map((img: any) => ({ src: img.url, alt: img.alt || product.name }))
    : [{ src: "https://placehold.co/800x800?text=Sem+Imagem", alt: product.name }];

  // Discount
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : undefined;

  // Category breadcrumb
  const mainCategory = product.categories?.[0]?.category;

  // Build specs from product fields
  const specs: { label: string; value: string }[] = [];
  if (product.sku) specs.push({ label: "SKU", value: product.sku });
  if (product.barcode) specs.push({ label: "Código de Barras", value: product.barcode });
  if (product.gtin) specs.push({ label: "GTIN", value: product.gtin });
  if (product.ncm) specs.push({ label: "NCM", value: product.ncm });
  if (product.anatelHomologation) specs.push({ label: "Homologação Anatel", value: product.anatelHomologation });
  if (product.weight) specs.push({ label: "Peso", value: `${product.weight}g` });
  if (product.width) specs.push({ label: "Largura", value: `${product.width}cm` });
  if (product.height) specs.push({ label: "Altura", value: `${product.height}cm` });
  if (product.length) specs.push({ label: "Comprimento", value: `${product.length}cm` });
  if (product.manageStock && product.stock !== undefined) specs.push({ label: "Estoque", value: `${product.stock} unidades` });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-36 md:pb-0">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1440px] px-4 py-4">
          <Breadcrumb
            items={[
              ...(mainCategory
                ? [{ label: mainCategory.name, href: `/categoria/${mainCategory.slug}` }]
                : []),
              { label: product.name },
            ]}
          />
        </div>

        {/* Product Main */}
        <section className="mx-auto max-w-[1440px] px-4 pb-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery images={galleryImages} discount={discount} productName={product.name} />
            <ProductInfo
              id={product.id}
              slug={product.slug}
              image={galleryImages[0].src}
              name={product.name}
              price={product.price}
              compareAtPrice={product.compareAtPrice || undefined}
              description={stripHtml(product.shortDescription || product.description || "", 220)}
              sku={product.sku || ""}
              gtin={product.gtin}
              ncm={product.ncm}
              anatelHomologation={product.anatelHomologation}
              manageStock={product.manageStock}
              baseStock={product.stock}
              variants={product.variants || []}
              isVip={user?.isVip || false}
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="border-t border-gray-100">
          <div className="mx-auto max-w-[1440px] px-4">
            <ProductTabs
              productId={product.id}
              description={product.description || "<p>Sem descrição detalhada.</p>"}
              specs={specs}
            />
          </div>
        </section>

        {/* Categories Carousel */}
        <CategoriesCarousel />

        {/* Buy Together */}
        <BuyTogetherSection products={(product.buyTogether || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image || "https://placehold.co/400x400?text=Sem+Imagem",
          price: p.price,
          compareAtPrice: p.compareAtPrice,
        }))} />

        {/* Related Products */}
        {product.related && product.related.length > 0 && (
          <section className="border-t border-gray-100 py-12">
            <div className="mx-auto max-w-[1440px] px-4">
              <SectionHeader
                title="Produtos Relacionados"
                subtitle="Quem viu este produto também gostou"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {product.related.map((rel: any) => (
                  <ProductCard
                    key={rel.id}
                    id={rel.id}
                    name={rel.name}
                    slug={rel.slug}
                    price={rel.price}
                    compareAtPrice={rel.compareAtPrice}
                    image={rel.image || "https://placehold.co/600x600?text=Sem+Imagem"}
                    isNew={rel.isNew}
                    bestSeller={rel.bestSeller}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mini Categories Carousel */}
        <MiniCategoriesCarousel />
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
