"use client";

import { FiCheck, FiCopy, FiMail, FiPackage, FiAlertTriangle, FiClock } from "react-icons/fi";
import { useState } from "react";
import Link from "next/link";
import type { PersonalData } from "./CheckoutPersonalData";
import type { AddressData } from "./CheckoutAddress";
import type { PaymentData } from "./CheckoutPayment";
import { calculateInstallment } from "@/lib/installments";
import { formatCurrency } from "@/lib/utils";

export interface PaymentResult {
  method: "pix" | "card" | "wallet";
  status: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiration?: string;
  pixKey?: string;
  pixKeyLabel?: string;
  invoiceUrl?: string;
  dueDate?: string;
  walletAmountUsed?: number;
  remainingTotal?: number;
}

interface Props {
  personal: PersonalData;
  address: AddressData;
  payment: PaymentData;
  total: number;
  orderNumber: string;
  paymentResult?: PaymentResult | null;
  paymentWarning?: string | null;
}

export function CheckoutConfirmation({ personal, address, payment, total, orderNumber, paymentResult, paymentWarning }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const cardInstallment = payment.method === "card" ? calculateInstallment(total, payment.installments) : null;
  const finalTotal = cardInstallment ? cardInstallment.total : total;
  const cardApproved = paymentResult?.method === "card" && ["CONFIRMED", "RECEIVED"].includes(paymentResult.status);

  const copyOrder = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPix = () => {
    if (!paymentResult?.pixCopyPaste) return;
    navigator.clipboard.writeText(paymentResult.pixCopyPaste);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const copyKey = () => {
    if (!paymentResult?.pixKey) return;
    navigator.clipboard.writeText(paymentResult.pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };


  return (
    <div className="mx-auto max-w-lg">
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <FiCheck className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
          Pedido Realizado!
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Obrigado, {personal.name.split(" ")[0]}! Seu pedido foi recebido com sucesso.
        </p>
      </div>

      {/* Order Number */}
      <div className="neo-inset mb-6 p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-primary/70">Número do pedido</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-xl font-extrabold text-primary">{orderNumber}</span>
          <button
            onClick={copyOrder}
            className="rounded-lg p-1.5 text-primary/60 transition-colors hover:bg-primary/10"
          >
            {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Payment warning (gateway unavailable) */}
      {paymentWarning && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">{paymentWarning}</p>
        </div>
      )}

      {/* Uso parcial do saldo da carteira */}
      {!!paymentResult?.walletAmountUsed && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-primary">{formatCurrency(paymentResult.walletAmountUsed)}</span> pagos com o saldo da sua carteira
          </p>
          {paymentResult.remainingTotal ? (
            <p className="mt-1 text-xs text-gray-500">
              Restante de {formatCurrency(paymentResult.remainingTotal)} {paymentResult.method === "pix" ? "via Pix abaixo" : "cobrado no cartão"}
            </p>
          ) : (
            <p className="mt-1 text-xs text-green-600">Saldo cobriu o pedido inteiro — nenhuma cobrança adicional.</p>
          )}
        </div>
      )}

      {/* PIX QR Code */}
      {paymentResult?.method === "pix" && paymentResult.pixQrCode && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-white p-5 text-center">
          <h3 className="text-sm font-bold text-gray-900">Pague com PIX</h3>
          <p className="mt-1 text-xs text-gray-500">
            Escaneie o QR Code abaixo com o app do seu banco
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${paymentResult.pixQrCode}`}
            alt="QR Code PIX"
            className="mx-auto mt-4 h-52 w-52 rounded-xl border border-gray-100"
          />
          {paymentResult.pixExpiration && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <FiClock className="h-3.5 w-3.5" />
              Válido até {new Date(paymentResult.pixExpiration).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {paymentResult.pixCopyPaste && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-gray-600">Ou copie o código PIX:</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={paymentResult.pixCopyPaste}
                  onFocus={(e) => e.target.select()}
                  className="h-10 flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-3 font-mono text-[11px] text-gray-600 outline-none"
                />
                <button
                  onClick={copyPix}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-green-600 px-4 text-xs font-bold text-white transition-all hover:bg-green-700"
                >
                  {copiedPix ? <FiCheck className="h-3.5 w-3.5" /> : <FiCopy className="h-3.5 w-3.5" />}
                  {copiedPix ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}
          {paymentResult.pixKey && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-600">
                Chave PIX ({paymentResult.pixKeyLabel || "chave"}):
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={paymentResult.pixKey}
                  onFocus={(e) => e.target.select()}
                  className="h-10 flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-3 font-mono text-[11px] text-gray-600 outline-none"
                />
                <button
                  onClick={copyKey}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-green-600 px-4 text-xs font-bold text-green-700 transition-all hover:bg-green-50"
                >
                  {copiedKey ? <FiCheck className="h-3.5 w-3.5" /> : <FiCopy className="h-3.5 w-3.5" />}
                  {copiedKey ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">
            Após identificarmos o pagamento, seu pedido entrará em preparação. Isso pode levar algumas horas.
          </p>
        </div>
      )}

      {/* Carteira */}
      {paymentResult?.method === "wallet" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <FiCheck className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm text-green-800">
            Pagamento realizado com o saldo da sua carteira. Seu pedido já está em preparação.
          </p>
        </div>
      )}

      {/* Card status */}
      {paymentResult?.method === "card" && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${
            cardApproved ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"
          }`}
        >
          {cardApproved ? (
            <FiCheck className="h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <FiClock className="h-5 w-5 shrink-0 text-blue-500" />
          )}
          <p className={`text-sm ${cardApproved ? "text-green-800" : "text-blue-800"}`}>
            {cardApproved
              ? "Pagamento aprovado! Seu pedido já está em preparação."
              : "Pagamento em processamento. Você receberá a confirmação por e-mail em instantes."}
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="space-y-4">
        {/* Payment Info */}
        <div className="neo-surface-sm p-5">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Pagamento</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Método</span>
              <span className="font-medium text-gray-900">
                {payment.method === "pix" ? "PIX" : payment.method === "card" ? "Cartão de Crédito" : "Carteira"}
              </span>
            </div>
            {payment.method === "card" && (
              <div className="flex justify-between">
                <span className="text-gray-500">Parcelas</span>
                <span className="font-medium text-gray-900">
                  {payment.installments}x de R$ {(finalTotal / payment.installments).toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200/60 pt-2">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-extrabold text-primary">
                R$ {finalTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="neo-surface-sm p-5">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Entrega</h3>
          <p className="text-sm text-gray-600">
            {address.street}, {address.number}
            {address.complement && ` - ${address.complement}`}
          </p>
          <p className="text-sm text-gray-600">
            {address.neighborhood}, {address.city} - {address.state}
          </p>
          <p className="text-sm text-gray-600">CEP: {address.cep}</p>
          {address.recipientName && (
            <p className="mt-2 border-t border-gray-200/60 pt-2 text-sm text-gray-600">
              Destinatário: <span className="font-medium text-gray-900">{address.recipientName}</span>
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="neo-surface-sm p-5">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Contato</h3>
          <p className="text-sm text-gray-600">{personal.name} {personal.lastName}</p>
          <p className="text-sm text-gray-600">{personal.email}</p>
          <p className="text-sm text-gray-600">{personal.phone}</p>
        </div>
      </div>

      {/* Email notice */}
      <div className="neo-inset mt-6 flex items-center gap-2 px-4 py-3">
        <FiMail className="h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">
          Enviamos os detalhes do pedido para <span className="font-semibold">{personal.email}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <Link
          href="/minha-conta?tab=pedidos"
          className="neo-btn flex h-12 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white"
        >
          <FiPackage className="h-4 w-4" />
          Acompanhar Pedido
        </Link>
        <Link
          href="/"
          className="neo-btn flex h-12 w-full items-center justify-center text-sm font-semibold text-gray-700"
        >
          Voltar à Loja
        </Link>
      </div>
    </div>
  );
}
