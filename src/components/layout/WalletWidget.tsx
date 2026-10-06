"use client";

import { useEffect, useRef, useState } from "react";
import { getRecaptchaToken } from "@/lib/recaptcha-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TbWallet } from "react-icons/tb";
import {
  FiCreditCard, FiLoader, FiClock, FiArrowLeft,
} from "react-icons/fi";
import { formatCurrency, cn } from "@/lib/utils";
import { getInstallmentOptions } from "@/lib/installments";

interface WalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string | null;
  source: string;
  createdAt: string;
}

interface WalletResponse {
  balance: number;
  transactions: WalletTransaction[];
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Ajuste",
  RECHARGE_PIX: "Recarga Pix",
  RECHARGE_CARD: "Card top-up",
  ORDER_CASHBACK: "Order credit",
  ORDER_PAYMENT: "Purchase",
  MIGRATION: "History",
};

const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function WalletWidget() {
  const [open, setOpen] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const [amount, setAmount] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [installments, setInstallments] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery<WalletResponse>({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Error loading wallet");
      return res.json();
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetRecharge = () => {
    setRecharging(false);
    setAmount("");
    setCard({ number: "", name: "", expiry: "", cvv: "" });
    setInstallments(1);
    setError("");
  };

  const handleRecharge = async () => {
    setError("");
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) { setError("Enter a valid amount"); return; }

    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken("wallet_recharge");
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "card",
          amount: value,
          card,
          installments,
          recaptchaToken,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao processar recarga");

      qc.invalidateQueries({ queryKey: ["wallet"] });
      resetRecharge();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions || [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 md:pl-2.5"
      >
        <TbWallet className="h-[20px] w-[20px] text-gray-600" strokeWidth={1.75} />
        <span className="hidden text-xs font-bold text-gray-700 sm:block">{formatCurrency(balance)}</span>
      </button>

      {open && (
        <div
          className={cn(
            // Mobile: preso à tela (não ao ícone), alinhado logo abaixo do header —
            // evita que o painel de 320px saia da tela quando o ícone não está na borda.
            "fixed inset-x-4 top-16 z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/5",
            "sm:absolute sm:inset-x-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
          )}
        >
          {/* Header / balance */}
          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Wallet balance</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{formatCurrency(balance)}</p>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-5">
            {/* Main view: recarga button + extrato */}
            {!recharging && (
              <>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Recarregar</p>
                <button
                  onClick={() => setRecharging(true)}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-gray-200 py-3 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary"
                >
                  <FiCreditCard className="h-4 w-4" /> Credit card
                </button>

                <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">Extrato recente</p>
                {transactions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center">
                    <FiClock className="mx-auto h-5 w-5 text-gray-300" />
                    <p className="mt-1.5 text-[11px] text-gray-400">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {transactions.slice(0, 8).map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-700">{t.description || SOURCE_LABELS[t.source] || t.source}</p>
                          <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <span className={cn("shrink-0 font-bold", t.type === "CREDIT" ? "text-green-600" : "text-red-500")}>
                          {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Card recharge form */}
            {recharging && (
              <div className="space-y-3">
                <button onClick={resetRecharge} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
                  <FiArrowLeft className="h-3.5 w-3.5" /> Voltar
                </button>
                {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Valor a recarregar (R$)</label>
                  <input value={amount} onChange={(e) => { setAmount(e.target.value); setInstallments(1); }} placeholder="0,00" inputMode="decimal"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <input value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                  placeholder="Card number" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-primary" />
                <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                  placeholder="Name on card" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/AA" maxLength={5} className="w-1/2 rounded-xl border border-gray-200 px-3 py-2.5 text-center text-sm font-mono outline-none focus:border-primary" />
                  <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="CVV" maxLength={4} className="w-1/2 rounded-xl border border-gray-200 px-3 py-2.5 text-center text-sm font-mono outline-none focus:border-primary" />
                </div>
                {Number(amount.replace(",", ".")) > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Parcelas</label>
                    <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                      {getInstallmentOptions(Number(amount.replace(",", "."))).map((o) => (
                        <option key={o.n} value={o.n}>
                          {o.n}x de {formatCurrency(o.installmentValue)} {o.hasInterest ? `(total ${formatCurrency(o.total)})` : "interest-free"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button onClick={handleRecharge} disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCreditCard className="h-4 w-4" />}
                  Recarregar agora
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
