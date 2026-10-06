"use client";

import Image from "next/image";
import { FiShield, FiLock } from "react-icons/fi";
import { useCart } from "@/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

interface Props {
  shippingCost?: number;
  couponDiscount?: number;
}

export function CheckoutOrderSummary({ shippingCost = 0, couponDiscount = 0 }: Props) {
  const { items, subtotal, itemCount } = useCart();

  const afterCoupon = subtotal - couponDiscount;
  const finalTotal = afterCoupon + shippingCost;

  return (
    <div className="neo-surface p-4 sm:p-6">
      <h3 className="mb-4 text-base font-bold text-gray-900">Order Summary</h3>

      {/* Items */}
      <div className="max-h-60 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
              <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[9px] font-bold text-white">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">{item.name}</p>
              {item.tier && (
                <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  Purchase: {item.tier}
                </span>
              )}
              {item.color && <p className="text-[10px] text-gray-400">{item.color}{item.size ? ` • ${item.size}` : ""}</p>}
            </div>
            <p className="shrink-0 text-xs font-bold text-gray-900">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-2 border-t border-gray-200/60 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="font-medium text-green-600">- {formatCurrency(couponDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className={`font-medium ${shippingCost === 0 ? "text-green-600" : "text-gray-900"}`}>
            {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
          </span>
        </div>

        <div className="flex justify-between border-t border-gray-200/60 pt-3">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-xl font-extrabold text-gray-900">{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="mt-4 flex items-center justify-center gap-4 border-t border-gray-200/60 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <FiShield className="h-3.5 w-3.5" /> Compra Segura
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <FiLock className="h-3.5 w-3.5" /> SSL Certificado
        </div>
      </div>
    </div>
  );
}
