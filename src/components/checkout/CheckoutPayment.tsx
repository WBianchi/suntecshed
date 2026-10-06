"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiCreditCard, FiSmartphone, FiCheck, FiLoader, FiMapPin } from "react-icons/fi";
import { FaWallet } from "react-icons/fa";
import { cn, formatCurrency } from "@/lib/utils";
import { getInstallmentOptions } from "@/lib/installments";

export type PaymentMethod = "pix" | "card" | "wallet";

export interface PaymentData {
  method: PaymentMethod;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: number;
  useWalletBalance: boolean;
  // Endereço de cobrança — usado apenas quando o endereço de entrega
  // está vazio (etiqueta própria) e o método é cartão de crédito.
  billingCep: string;
  billingStreet: string;
  billingNumber: string;
  billingNeighborhood: string;
  billingCity: string;
  billingState: string;
}

interface Props {
  data: PaymentData;
  onChange: (data: PaymentData) => void;
  onNext: () => void;
  onBack: () => void;
  total: number;
  submitting?: boolean;
  /** Exibe os campos de endereço de cobrança quando o endereço de entrega está vazio (etiqueta própria). */
  showBillingAddress?: boolean;
}

const formatCardNumber = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(\d{4})/g, "$1 ").trim();
};

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
};

const formatCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
};

/** Remove uma chave do estado de erros (Record<string, string>). */
const clearError = (prev: Record<string, string>, key: string): Record<string, string> => {
  const next = { ...prev };
  delete next[key];
  return next;
};

const methods = [
  {
    id: "pix" as PaymentMethod,
    label: "PIX",
    desc: "Fast approval",
    icon: FiSmartphone,
    badge: null,
    badgeColor: "",
  },
  {
    id: "card" as PaymentMethod,
    label: "Credit Card",
    desc: "Up to 12x",
    icon: FiCreditCard,
    badge: "12x",
    badgeColor: "bg-primary/10 text-primary",
  },
  {
    id: "wallet" as PaymentMethod,
    label: "Wallet",
    desc: "Pay with your balance",
    icon: FaWallet,
    badge: null,
    badgeColor: "",
  },
];

export function CheckoutPayment({ data, onChange, onNext, onBack, total, submitting, showBillingAddress }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCep, setLoadingCep] = useState(false);

  const { data: wallet } = useQuery<{ balance: number }>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Error loading wallet");
      return res.json();
    },
  });
  const walletBalance = wallet?.balance ?? 0;
  const insufficientBalance = data.method === "wallet" && walletBalance < total;

  const needsBilling = showBillingAddress && data.method === "card";

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length < 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (!json.erro) {
        onChange({
          ...data,
          billingCep: cep,
          billingStreet: json.logradouro || data.billingStreet,
          billingNeighborhood: json.bairro || data.billingNeighborhood,
          billingCity: json.localidade || data.billingCity,
          billingState: json.uf || data.billingState,
        });
        setErrors((prev) => {
          const next = { ...prev };
          delete next.billingCep;
          delete next.billingCity;
          delete next.billingState;
          return next;
        });
      }
    } catch {
      // viacep offline — usuário digita manualmente
    } finally {
      setLoadingCep(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (data.method === "card" && !(data.useWalletBalance && remainingAfterWallet <= 0)) {
      if (data.cardNumber.replace(/\D/g, "").length < 16) e.cardNumber = "Invalid card number";
      if (!data.cardName.trim()) e.cardName = "Name required";
      if (data.cardExpiry.replace(/\D/g, "").length < 4) e.cardExpiry = "Invalid expiry";
      if (data.cardCvv.length < 3) e.cardCvv = "Invalid CVV";
    }

    if (needsBilling) {
      if (data.billingCep.replace(/\D/g, "").length < 8) e.billingCep = "Postal code required";
      if (!data.billingNumber.trim()) e.billingNumber = "Number required";
      if (!data.billingCity.trim()) e.billingCity = "City required";
      if (!data.billingState.trim()) e.billingState = "State required";
    }

    if (data.method === "wallet" && insufficientBalance) e.wallet = "Insufficient balance";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onNext();
  };

  const walletUsed = data.useWalletBalance ? Math.min(walletBalance, total) : 0;
  const remainingAfterWallet = Math.max(0, total - walletUsed);
  const cardBillableTotal = data.useWalletBalance ? remainingAfterWallet : total;
  const installmentOptions = getInstallmentOptions(cardBillableTotal > 0 ? cardBillableTotal : total);

  return (
    <div className="neo-surface p-5 sm:p-8">
      <h2 className="mb-6 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
        Payment Method
      </h2>

      {/* Method Selection */}
      <div className="space-y-3">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange({ ...data, method: m.id })}
            className={cn(
              "neo-pill flex w-full items-center gap-4 p-4 text-left",
              data.method === m.id && "neo-pill-selected"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                data.method === m.id ? "bg-primary text-white" : "bg-gray-200/70 text-gray-500"
              )}
            >
              <m.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                {m.badge && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", m.badgeColor)}>
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{m.desc}</p>
            </div>
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2",
                data.method === m.id ? "border-primary bg-primary" : "border-gray-300"
              )}
            >
              {data.method === m.id && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      {/* PIX */}
      {data.method === "pix" && (
        <div className="neo-inset mt-6 p-5 text-center">
          <p className="text-sm text-gray-600">Amount due:</p>
          <p className="mt-1 text-3xl font-extrabold text-gray-900">
            R$ {total.toFixed(2).replace(".", ",")}
          </p>

          {walletBalance > 0 && (
            <label className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/60 p-3 text-left">
              <input
                type="checkbox"
                checked={data.useWalletBalance}
                onChange={(e) => onChange({ ...data, useWalletBalance: e.target.checked })}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span className="text-xs font-medium text-gray-700">
                Use my wallet balance ({formatCurrency(walletBalance)} available)
              </span>
            </label>
          )}

          {data.useWalletBalance && walletUsed > 0 && (
            <div className="mt-3 space-y-1 rounded-xl bg-white/60 p-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Paid with balance</span>
                <span className="font-semibold text-primary">- {formatCurrency(walletUsed)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200/60 pt-1 font-semibold text-gray-900">
                <span>{remainingAfterWallet > 0 ? "Remaining via Pix" : "Total"}</span>
                <span>{formatCurrency(remainingAfterWallet)}</span>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">
            {data.useWalletBalance && remainingAfterWallet <= 0
              ? "Your balance covers the whole order — no Pix needed."
              : "The QR Code will be generated after order confirmation"}
          </p>
        </div>
      )}

      {/* Card Form */}
      {data.method === "card" && (
        <div className="mt-6 space-y-4">
          {walletBalance > 0 && (
            <label className="flex items-center gap-2 rounded-xl bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={data.useWalletBalance}
                onChange={(e) => onChange({ ...data, useWalletBalance: e.target.checked })}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span className="text-xs font-medium text-gray-700">
                Use my wallet balance ({formatCurrency(walletBalance)} available)
              </span>
            </label>
          )}

          {data.useWalletBalance && walletUsed > 0 && (
            <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Paid with balance</span>
                <span className="font-semibold text-primary">- {formatCurrency(walletUsed)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
                <span>{remainingAfterWallet > 0 ? "Remaining on card" : "Total"}</span>
                <span>{formatCurrency(remainingAfterWallet)}</span>
              </div>
            </div>
          )}

          {data.useWalletBalance && remainingAfterWallet <= 0 ? (
            <p className="rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700">
              Your balance covers the whole order — nothing will be charged to the card.
            </p>
          ) : (
          <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Card number</label>
            <div className="neo-inset">
              <input
                type="text"
                value={data.cardNumber}
                onChange={(e) => onChange({ ...data, cardNumber: formatCardNumber(e.target.value) })}
                placeholder="0000 0000 0000 0000"
                className="h-12 w-full bg-transparent px-4 text-sm font-mono text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
            {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Name on card</label>
            <div className="neo-inset">
              <input
                type="text"
                value={data.cardName}
                onChange={(e) => onChange({ ...data, cardName: e.target.value.toUpperCase() })}
                placeholder="NAME AS ON CARD"
                className="h-12 w-full bg-transparent px-4 text-sm font-mono uppercase text-gray-900 outline-none placeholder:text-gray-400 placeholder:normal-case"
              />
            </div>
            {errors.cardName && <p className="mt-1 text-xs text-red-500">{errors.cardName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Expiry</label>
              <div className="neo-inset">
                <input
                  type="text"
                  value={data.cardExpiry}
                  onChange={(e) => onChange({ ...data, cardExpiry: formatExpiry(e.target.value) })}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="h-12 w-full bg-transparent px-4 text-center text-sm font-mono text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
              {errors.cardExpiry && <p className="mt-1 text-xs text-red-500">{errors.cardExpiry}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">CVV</label>
              <div className="neo-inset">
                <input
                  type="text"
                  value={data.cardCvv}
                  onChange={(e) => onChange({ ...data, cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="000"
                  maxLength={4}
                  className="h-12 w-full bg-transparent px-4 text-center text-sm font-mono text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
              {errors.cardCvv && <p className="mt-1 text-xs text-red-500">{errors.cardCvv}</p>}
            </div>
          </div>

          {/* Endereço de Cobrança (quando etiqueta própria) */}
          {needsBilling && (
            <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <div>
                <p className="text-sm font-semibold text-brand-900">Billing Address</p>
                <p className="text-xs text-brand-700">
                  Since you attached your own label, we need the billing address to process the card.
                </p>
              </div>

              {/* CEP */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Postal code</label>
                <div className="neo-inset relative flex items-center">
                  <FiMapPin className="pointer-events-none absolute left-4 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={data.billingCep}
                    onChange={(e) => {
                      const val = formatCep(e.target.value);
                      onChange({ ...data, billingCep: val });
                      if (errors.billingCep) setErrors((p) => clearError(p, "billingCep"));
                      if (val.replace(/\D/g, "").length === 8) lookupCep(val);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="h-12 w-full bg-transparent pl-11 pr-12 text-sm font-mono text-gray-900 outline-none placeholder:text-gray-400"
                  />
                  {loadingCep && <FiLoader className="absolute right-4 h-4 w-4 animate-spin text-primary" />}
                </div>
                {errors.billingCep && <p className="mt-1 text-xs text-red-500">{errors.billingCep}</p>}
              </div>

              {/* Número */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Number</label>
                <div className="neo-inset">
                  <input
                    type="text"
                    value={data.billingNumber}
                    onChange={(e) => {
                      onChange({ ...data, billingNumber: e.target.value });
                      if (errors.billingNumber) setErrors((p) => clearError(p, "billingNumber"));
                    }}
                    placeholder="Nº"
                    className="h-12 w-full bg-transparent px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
                {errors.billingNumber && <p className="mt-1 text-xs text-red-500">{errors.billingNumber}</p>}
              </div>

              {/* Cidade + Estado */}
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Cidade</label>
                  <div className="neo-inset">
                    <input
                      type="text"
                      value={data.billingCity}
                      onChange={(e) => {
                        onChange({ ...data, billingCity: e.target.value });
                        if (errors.billingCity) setErrors((p) => clearError(p, "billingCity"));
                      }}
                      placeholder="City"
                      className="h-12 w-full bg-transparent px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                  {errors.billingCity && <p className="mt-1 text-xs text-red-500">{errors.billingCity}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">UF</label>
                  <div className="neo-inset">
                    <input
                      type="text"
                      value={data.billingState}
                      onChange={(e) => {
                        onChange({ ...data, billingState: e.target.value.toUpperCase().slice(0, 2) });
                        if (errors.billingState) setErrors((p) => clearError(p, "billingState"));
                      }}
                      placeholder="State"
                      maxLength={2}
                      className="h-12 w-full bg-transparent px-4 text-center font-bold text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                  {errors.billingState && <p className="mt-1 text-xs text-red-500">{errors.billingState}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Installments */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Installments</label>
            <div className="neo-inset">
              <select
                value={data.installments}
                onChange={(e) => onChange({ ...data, installments: Number(e.target.value) })}
                className="h-12 w-full bg-transparent px-4 text-sm text-gray-900 outline-none"
              >
                {installmentOptions.map((o) => (
                  <option key={o.n} value={o.n}>
                    {o.n}x of R$ {o.installmentValue.toFixed(2).replace(".", ",")} {o.hasInterest ? `(total R$ ${o.total.toFixed(2).replace(".", ",")})` : "interest-free"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Carteira */}
      {data.method === "wallet" && (
        <div className="neo-inset mt-6 p-5 text-center">
          <p className="text-sm text-gray-700">Available balance</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{formatCurrency(walletBalance)}</p>
          <p className="mt-3 text-sm text-gray-700">Order total</p>
          <p className="mt-1 text-xl font-bold text-primary">R$ {total.toFixed(2).replace(".", ",")}</p>
          {insufficientBalance ? (
            <p className="mt-3 text-xs font-semibold text-red-500">
              Insufficient balance. You are missing {formatCurrency(total - walletBalance)} — top up your wallet from the icon at the top of the site or choose another payment method.
            </p>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              The amount will be debited from your balance as soon as the order is confirmed.
            </p>
          )}
        </div>
      )}

      {/* Trust */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-gray-400">
        <FiCheck className="h-3.5 w-3.5 text-green-500" />
        100% secure and encrypted environment
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="neo-btn flex h-12 flex-1 items-center justify-center text-sm font-semibold text-gray-700"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || insufficientBalance}
          className="neo-btn flex h-12 flex-[2] items-center justify-center gap-2 bg-primary text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {submitting ? <><FiLoader className="h-4 w-4 animate-spin" /> Processando...</> : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}
