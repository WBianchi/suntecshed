"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  FiSearch, FiPackage, FiLoader, FiTruck, FiCheckCircle,
  FiClock, FiMapPin, FiAlertCircle, FiBox, FiShoppingBag,
  FiArrowRight, FiCreditCard,
} from "react-icons/fi";

interface TrackingResult {
  orderId: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  items: { name: string; qty: number; image: string | null }[];
  trackingCode: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  events: { date: string; status: string; desc: string; location?: string }[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  PENDING: { icon: FiClock, color: "text-brand-600", bg: "bg-brand-50" },
  CONFIRMED: { icon: FiCheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
  PROCESSING: { icon: FiBox, color: "text-purple-600", bg: "bg-purple-50" },
  SHIPPED: { icon: FiTruck, color: "text-cyan-600", bg: "bg-cyan-50" },
  DELIVERED: { icon: FiCheckCircle, color: "text-green-600", bg: "bg-green-50" },
  CANCELLED: { icon: FiAlertCircle, color: "text-red-600", bg: "bg-red-50" },
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em Preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export default function RastrearPedidoPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Pedido não encontrado");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Não foi possível rastrear seu pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Rastrear Pedido" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Rastrear Pedido
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Acompanhe o status da sua encomenda em tempo real
              </p>

              {/* Search Form */}
              <form onSubmit={handleTrack} className="mt-6 flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-sm shadow-lg outline-none placeholder:text-gray-400"
                    placeholder="Número do pedido, e-mail ou código de rastreio" />
                </div>
                <button type="submit" disabled={loading || !query.trim()}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-all">
                  {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiSearch className="h-5 w-5" />}
                  <span className="hidden sm:inline">{loading ? "Buscando..." : "Rastrear"}</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">

            {/* Error */}
            {error && (
              <div className="mx-auto max-w-2xl rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <FiAlertCircle className="mx-auto h-10 w-10 text-red-400" />
                <h3 className="mt-3 text-sm font-bold text-red-800">{error}</h3>
                <p className="mt-1 text-xs text-red-600">Verifique os dados e tente novamente. Certifique-se de usar o número exato do pedido ou o e-mail cadastrado.</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Order Header */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Pedido</p>
                      <p className="text-lg font-bold text-gray-900">#{result.orderId}</p>
                      <p className="mt-0.5 text-xs text-gray-500">Realizado em {new Date(result.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      {(() => {
                        const cfg = statusConfig[result.status] || statusConfig.PENDING;
                        const Icon = cfg.icon;
                        return (
                          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${cfg.bg} ${cfg.color}`}>
                            <Icon className="h-4 w-4" /> {statusLabels[result.status] || result.statusLabel}
                          </span>
                        );
                      })()}
                      {result.trackingCode && (
                        <p className="mt-2 text-xs text-gray-500">
                          Rastreio: <strong className="text-gray-700">{result.trackingCode}</strong>
                          {result.carrier && ` · ${result.carrier}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {result.estimatedDelivery && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700">
                      <FiTruck className="h-4 w-4" /> Previsão de entrega: <strong>{new Date(result.estimatedDelivery).toLocaleDateString("pt-BR")}</strong>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {result.events && result.events.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
                    <h3 className="mb-5 text-sm font-bold text-gray-900">Histórico de Rastreamento</h3>
                    <div className="relative space-y-4 pl-8">
                      <div className="absolute left-3 top-2 h-[calc(100%-16px)] w-0.5 bg-gray-100" />
                      {result.events.map((ev, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-5 top-1 h-4 w-4 rounded-full border-4 ${i === 0 ? "border-primary bg-white" : "border-gray-200 bg-white"}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${i === 0 ? "text-primary" : "text-gray-700"}`}>{ev.status}</p>
                              <span className="text-[10px] text-gray-400">{new Date(ev.date).toLocaleString("pt-BR")}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">{ev.desc}</p>
                            {ev.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                                <FiMapPin className="h-3 w-3" /> {ev.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                {result.items && result.items.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
                    <h3 className="mb-4 text-sm font-bold text-gray-900">Itens do Pedido</h3>
                    <div className="space-y-3">
                      {result.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <FiShoppingBag className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-400">Qtd: {item.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
              <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center sm:p-16">
                  <FiPackage className="mx-auto h-16 w-16 text-gray-200" />
                  <h3 className="mt-4 text-lg font-bold text-gray-600">Insira seus dados acima</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Use o número do pedido, seu e-mail cadastrado ou o código de rastreio para acompanhar sua encomenda.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                    <FiCreditCard className="mx-auto h-6 w-6 text-primary" />
                    <h4 className="mt-2 text-xs font-bold text-gray-800">Número do Pedido</h4>
                    <p className="mt-1 text-[10px] text-gray-400">Ex: HRM-12345</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                    <FiSearch className="mx-auto h-6 w-6 text-primary" />
                    <h4 className="mt-2 text-xs font-bold text-gray-800">E-mail</h4>
                    <p className="mt-1 text-[10px] text-gray-400">E-mail cadastrado na compra</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
                    <FiTruck className="mx-auto h-6 w-6 text-primary" />
                    <h4 className="mt-2 text-xs font-bold text-gray-800">Código de Rastreio</h4>
                    <p className="mt-1 text-[10px] text-gray-400">Código dos Correios/transportadora</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
