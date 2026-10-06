"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  FiTruck, FiMapPin, FiClock, FiSearch, FiLoader, FiCheckCircle,
  FiPackage, FiDollarSign, FiAlertCircle, FiBox, FiZap,
} from "react-icons/fi";

const regions = [
  { region: "Goiânia e Região Metropolitana", prazo: "1 a 3 dias úteis", frete: "Calculado no checkout", color: "bg-green-50 border-green-200 text-green-700" },
  { region: "Interior de Goiás", prazo: "3 a 5 dias úteis", frete: "Calculado no checkout", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { region: "Centro-Oeste (DF, MT, MS)", prazo: "4 a 7 dias úteis", frete: "Calculado no checkout", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { region: "Sudeste (SP, RJ, MG, ES)", prazo: "5 a 10 dias úteis", frete: "Calculado no checkout", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { region: "Sul (PR, SC, RS)", prazo: "6 a 12 dias úteis", frete: "Calculado no checkout", color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  { region: "Nordeste", prazo: "7 a 15 dias úteis", frete: "Calculado no checkout", color: "bg-brand-50 border-brand-200 text-brand-700" },
  { region: "Norte", prazo: "8 a 18 dias úteis", frete: "Calculado no checkout", color: "bg-orange-50 border-orange-200 text-orange-700" },
];

const carriers = [
  { name: "Correios (PAC)", desc: "Entrega econômica para todo o Brasil", prazo: "5 a 18 dias úteis", icon: FiPackage },
  { name: "Correios (SEDEX)", desc: "Entrega expressa com rastreamento", prazo: "2 a 8 dias úteis", icon: FiZap },
  { name: "Transportadora Parceira", desc: "Para pedidos maiores e região Centro-Oeste", prazo: "1 a 7 dias úteis", icon: FiTruck },
];

interface FreteResult {
  carrier: string;
  service: string;
  price: number;
  days: number;
}

export default function PrazoDeEntregaPage() {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FreteResult[] | null>(null);
  const [error, setError] = useState("");

  const handleCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) { setError("CEP inválido. Informe 8 dígitos."); return; }
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch(`/api/shipping/calculate?cep=${cleanCep}&weight=1`);
      if (!res.ok) throw new Error("Não foi possível calcular");
      const data = await res.json();
      setResults(data.options || data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao calcular frete");
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Prazo de Entrega" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Prazo de Entrega
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Calcule o frete e confira os prazos de entrega para sua região
              </p>
            </div>
          </div>
        </section>

        {/* CEP Calculator */}
        <section className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 sm:p-8">
                <div className="mb-5 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                    <FiTruck className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-gray-900 sm:text-xl" style={{ fontFamily: "var(--font-playfair)" }}>
                    Calcular Frete
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Informe seu CEP para ver as opções de envio</p>
                </div>

                <form onSubmit={handleCalc} className="flex gap-2">
                  <div className="relative flex-1">
                    <FiMapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input value={cep} onChange={(e) => setCep(formatCep(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors"
                      placeholder="00000-000" maxLength={9} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSearch className="h-4 w-4" />}
                    Calcular
                  </button>
                </form>

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600">
                    <FiAlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                {results && results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{r.carrier} — {r.service}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <FiClock className="h-3 w-3" /> {r.days} dias úteis
                          </p>
                        </div>
                        <div className="text-right">
                          {r.price === 0 ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">Grátis</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              R$ {r.price.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results && results.length === 0 && (
                  <div className="mt-4 rounded-xl bg-brand-50 p-3 text-center text-xs text-brand-700">
                    Nenhuma opção de entrega disponível para este CEP. Tente outro.
                  </div>
                )}

                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer"
                  className="mt-3 block text-center text-[11px] text-primary hover:underline">
                  Não sabe seu CEP? Consulte aqui
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Regional Table */}
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Prazos estimados</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Prazo por Região
              </h2>
              <p className="mt-2 text-sm text-gray-500">Prazos estimados após a confirmação do pagamento</p>
            </div>
            <div className="mx-auto max-w-3xl space-y-3">
              {regions.map((r) => (
                <div key={r.region} className={`rounded-2xl border p-4 sm:p-5 ${r.color}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <FiMapPin className="h-4 w-4 shrink-0" />
                      <h3 className="text-sm font-bold">{r.region}</h3>
                    </div>
                    <div className="flex gap-4 pl-7 sm:pl-0">
                      <span className="flex items-center gap-1 text-xs font-semibold">
                        <FiClock className="h-3 w-3" /> {r.prazo}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <FiDollarSign className="h-3 w-3" /> {r.frete}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Carriers */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Transportadoras</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Nossas Parceiras de Entrega
              </h2>
            </div>
            <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
              {carriers.map((c) => (
                <div key={c.name} className="rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:border-primary/20 hover:shadow-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-gray-900">{c.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{c.desc}</p>
                  <p className="mt-2 rounded-full bg-gray-50 px-3 py-1 text-[10px] font-semibold text-gray-600 inline-block">
                    {c.prazo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info */}
        <section className="border-t border-gray-100 bg-gray-50/50 py-10 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mx-auto max-w-2xl rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6">
              <div className="flex gap-3">
                <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Informações Importantes</p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-600">
                    <li>• Prazos contados a partir da <strong>confirmação do pagamento</strong></li>
                    <li>• Boletos bancários levam 1-2 dias úteis para compensar</li>
                    <li>• Em períodos de alta demanda (Black Friday, Natal), prazos podem ser maiores</li>
                    <li>• Áreas de risco ou de difícil acesso podem ter prazo adicional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
