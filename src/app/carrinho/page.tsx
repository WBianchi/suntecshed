"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CartItem } from "@/components/cart/CartItem";
import { CartShipping } from "@/components/cart/CartShipping";
import { CartSummary } from "@/components/cart/CartSummary";
import { MiniProductCard } from "@/components/ui/MiniProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCart } from "@/providers/cart-provider";
import { FiShoppingBag, FiTrash2, FiArrowLeft } from "react-icons/fi";

async function fetchSuggestedProducts() {
  const res = await fetch("/api/products?sort=bestseller&limit=12");
  if (!res.ok) return [];
  const data = await res.json();
  return data.products || [];
}

export default function CarrinhoPage() {
  const { items, itemCount, subtotal, totalSavings, updateQuantity, removeItem, clearCart, shipping } = useCart();
  const { data: suggestedProducts = [] } = useQuery({
    queryKey: ["cart-suggested-products"],
    queryFn: fetchSuggestedProducts,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50/50 pb-20 md:pb-0">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1440px] px-4 py-4">
          <Breadcrumb items={[{ label: "Cart" }]} />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-12">
          {/* Page Title */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
                <FiShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                  My Cart
                </h1>
                <p className="text-sm text-gray-500">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                  {totalSavings > 0 && (
                    <span className="ml-2 text-green-600">
                      (saving R$ {totalSavings.toFixed(2).replace(".", ",")})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <FiTrash2 className="h-3.5 w-3.5" /> Limpar carrinho
              </button>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty Cart */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <FiShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                Your cart is empty
              </h2>
              <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
                Add products to your cart to continue. Great deals are waiting for you!
              </p>
              <Link
                href="/produtos"
                className="mt-6 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            /* Cart Content */
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left — Items + Shipping + Coupon */}
              <div className="min-w-0 space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>

                {/* Shipping on mobile (shown below items) */}
                <div className="space-y-4 lg:hidden">
                  <CartShipping />
                </div>

                {/* Back to shop */}
                <div className="pt-2">
                  <Link
                    href="/produtos"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <FiArrowLeft className="h-3.5 w-3.5" /> Continuar comprando
                  </Link>
                </div>
              </div>

              {/* Right — Sidebar */}
              <div className="min-w-0 space-y-4">
                {/* Desktop Shipping */}
                <div className="hidden lg:block">
                  <CartShipping />
                </div>

                {/* Summary */}
                <div className="lg:sticky lg:top-44">
                  <CartSummary
                    subtotal={subtotal}
                    itemCount={itemCount}
                    shipping={shipping}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Suggested Products */}
          <section className="mt-14 border-t border-gray-200 pt-10">
            <SectionHeader
              title="You may also like"
              subtitle="Products that match your picks"
              href="/produtos"
            />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6">
              {suggestedProducts.map((product: any) => (
                <MiniProductCard
                  key={product.id}
                  {...product}
                  image={product.image || "https://placehold.co/400x400?text=No+Image"}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
