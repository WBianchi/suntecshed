"use client";

import { FiShoppingCart, FiX, FiMinus, FiPlus, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { CartShipping } from "@/components/cart/CartShipping";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ATACADO_MIN_QTY = 6;

export function MiniCart() {
  const {
    items, itemCount, subtotal, isOpen, openCart, closeCart, updateQuantity, removeItem,
    shipping,
  } = useCart();
  const router = useRouter();
  const [shippingError, setShippingError] = useState(false);

  const shippingCost = shipping?.price ?? 0;
  const total = Math.max(0, subtotal + shippingCost);

  const handleCheckout = () => {
    if (!shipping) {
      setShippingError(true);
      const visible = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-shipping]"))
        .find((el) => el.offsetParent !== null);
      visible?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShippingError(false);
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      <button
        onClick={openCart}
        className="relative flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <FiShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white badge-pulse">
            {itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-bold">
            Meu Carrinho{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({itemCount} {itemCount === 1 ? "item" : "itens"})
            </span>
          </h3>
          <button
            onClick={closeCart}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <p className="text-lg font-semibold text-foreground">Carrinho vazio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione produtos para continuar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border p-3 transition-shadow hover:shadow-md"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground line-clamp-2">
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {item.tier && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                item.tier === "Grupo Vip"
                                  ? "bg-primary/10 text-primary"
                                  : item.tier === "Atacado"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {item.tier}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs text-muted-foreground">{item.color}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.tier === "Atacado" && item.quantity <= ATACADO_MIN_QTY}
                          title={item.tier === "Atacado" && item.quantity <= ATACADO_MIN_QTY ? "Quantidade mínima do Atacado: 6 unidades" : undefined}
                          className="rounded-full p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <FiMinus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <FiPlus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-border px-6 py-4">
            <CartShipping />

            {/* Summary */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                {shipping ? (
                  <span className={cn("font-medium", shipping.price === 0 ? "text-green-600" : "text-foreground")}>
                    {shipping.price === 0 ? "Grátis" : formatCurrency(shipping.price)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Calcule acima</span>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                <span className="font-bold">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {shippingError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                Selecione uma forma de frete antes de continuar
              </div>
            )}
            <button
              onClick={handleCheckout}
              className={cn(
                "flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]",
                shippingError ? "mt-3" : "mt-4"
              )}
            >
              Finalizar Compra
            </button>
            <Link
              href="/carrinho"
              onClick={closeCart}
              className="mt-2 flex w-full items-center justify-center rounded-full border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Ver Carrinho Completo
            </Link>
            <button
              onClick={closeCart}
              className="mt-2 w-full rounded-full py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
