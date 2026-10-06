"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiCreditCard, FiLock, FiAlertCircle } from "react-icons/fi";
import type { ShippingOption } from "./CartShipping";
import { bestInstallmentPitch } from "@/lib/installments";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  shipping: ShippingOption | null;
}

export function CartSummary({ subtotal, itemCount, shipping }: CartSummaryProps) {
  const router = useRouter();
  const [shippingError, setShippingError] = useState(false);
  const shippingCost = shipping?.price ?? 0;
  const total = subtotal + shippingCost;
  const bestInstallment = bestInstallmentPitch(total);

  const handleCheckout = () => {
    if (!shipping) {
      setShippingError(true);
      const visible = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-shipping]"))
        .find((el) => el.offsetParent !== null);
      visible?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShippingError(false);
    router.push("/checkout");
  };

  return (
    <div className="rounded-[26px] border border-gray-100 bg-white p-5">
      <h3 className="text-base font-bold text-gray-900">Resumo do Pedido</h3>

      <div className="mt-4 space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
          <span className="font-medium text-gray-900">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Frete</span>
          {shipping ? (
            <span className={`font-medium ${shipping.price === 0 ? "text-green-600" : "text-gray-900"}`}>
              {shipping.price === 0 ? "Grátis" : `R$ ${shipping.price.toFixed(2).replace(".", ",")}`}
            </span>
          ) : (
            <span className="text-xs text-gray-400">Calcule acima</span>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-extrabold text-gray-900">
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Installments */}
          <p className="mt-2 text-center text-xs text-gray-500">
            ou em até <span className="font-semibold text-gray-700">{bestInstallment.n}x de R$ {bestInstallment.installmentValue.toFixed(2).replace(".", ",")}</span>
          </p>
        </div>
      </div>

      {/* CTA */}
      {shippingError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          Selecione uma forma de frete antes de continuar
        </div>
      )}
      <button
        onClick={handleCheckout}
        className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
        style={{ height: "52px" }}
      >
        <FiLock className="h-4 w-4" />
        Finalizar Compra
      </button>

      <Link
        href="/produtos"
        className="mt-2 flex h-11 w-full items-center justify-center rounded-full border border-gray-200 text-sm font-medium text-gray-700 transition-all hover:border-primary hover:text-primary"
      >
        Continuar Comprando
      </Link>

      {/* Trust */}
      <div className="mt-5 flex items-center justify-center gap-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <FiShield className="h-3.5 w-3.5" /> Compra Segura
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <FiCreditCard className="h-3.5 w-3.5" /> Em até 12x no cartão
        </div>
      </div>

      {/* Payment icons */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {["Visa", "Master", "Elo", "Pix", "Carteira"].map((m) => (
          <span key={m} className="rounded-md border border-gray-200 px-2 py-1 text-[9px] font-medium text-gray-500">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
