"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  FiCreditCard, FiDollarSign, FiZap, FiCheckCircle,
  FiShield, FiLock,
} from "react-icons/fi";
import { getInstallmentOptions } from "@/lib/installments";

const creditCards = [
  { name: "Visa", color: "bg-[#1A1F71]" },
  { name: "Mastercard", color: "bg-[#EB001B]" },
  { name: "Elo", color: "bg-[#00A4E0]" },
  { name: "Amex", color: "bg-[#006FCF]" },
  { name: "Hipercard", color: "bg-[#822124]" },
  { name: "Diners", color: "bg-[#0079BE]" },
];

const SIMULATION_VALUE = 299.9;
const installments = getInstallmentOptions(SIMULATION_VALUE).map((o) => ({
  parcelas: `${o.n}x`,
  juros: o.hasInterest,
  exemplo: `R$ ${o.installmentValue.toFixed(2).replace(".", ",")}`,
}));

export default function FormasDePagamentoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Formas de Pagamento" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Formas de Pagamento
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Diversas opções para você comprar com segurança e praticidade
              </p>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid gap-6 lg:grid-cols-3">

              {/* PIX */}
              <div className="group rounded-3xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-white p-6 transition-all hover:border-green-200 hover:shadow-lg sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-white shadow-lg shadow-green-500/20">
                  <FiZap className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>PIX</h2>
                <p className="mt-2 text-sm text-gray-500">Pague com o QR Code gerado no checkout. Confirmação em até algumas horas.</p>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-green-500" /> Sem taxas de banco
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-green-500" /> Sem taxa adicional
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-green-500" /> Disponível 24h, inclusive feriados
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-green-500" /> QR Code gerado no checkout
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-green-100/50 p-3 text-center">
                  <p className="text-xs font-bold text-green-700">⚡ Método mais rápido</p>
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="group rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 transition-all hover:border-blue-200 hover:shadow-lg sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <FiCreditCard className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Cartão de Crédito</h2>
                <p className="mt-2 text-sm text-gray-500">Parcele em até 12x no cartão de crédito.</p>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-blue-500" /> Até 12x no cartão
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-blue-500" /> Aprovação em minutos
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-blue-500" /> Processamento seguro PCI-DSS
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {creditCards.map((c) => (
                    <span key={c.name} className={`rounded-lg ${c.color} px-2.5 py-1 text-[10px] font-bold text-white`}>
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Carteira */}
              <div className="group rounded-3xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 transition-all hover:border-brand-200 hover:shadow-lg sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                  <FiDollarSign className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Carteira</h2>
                <p className="mt-2 text-sm text-gray-500">Pague com o saldo da sua carteira Suntecshed. Confirmação instantânea.</p>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-brand-500" /> Aprovação imediata
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-brand-500" /> Recarregue via Pix ou cartão
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiCheckCircle className="h-4 w-4 text-brand-500" /> Sem taxa adicional
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Installments Table */}
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Parcelamento</span>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                  Tabela de Parcelas
                </h2>
                <p className="mt-2 text-sm text-gray-500">Simulação para uma compra de R$ {SIMULATION_VALUE.toFixed(2).replace(".", ",")}</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parcelas</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Valor</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase">Juros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {installments.map((row) => (
                      <tr key={row.parcelas} className="transition-colors hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-semibold text-gray-800">{row.parcelas}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{row.exemplo}</td>
                        <td className="px-5 py-3 text-right">
                          {row.juros ? (
                            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-600">Com juros</span>
                          ) : (
                            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-600">Sem juros</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-center text-[11px] text-gray-400">
                * Valores de juros podem variar conforme a bandeira do cartão. Simulação ilustrativa.
              </p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 p-8 sm:p-10">
                <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                    <FiShield className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="mt-4 text-xl font-bold text-gray-900 sm:mt-0" style={{ fontFamily: "var(--font-playfair)" }}>
                      Compra 100% Segura
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Todos os pagamentos são processados com criptografia SSL de 256 bits. Nossos gateways de
                      pagamento possuem certificação PCI-DSS nível 1, o mais alto padrão de segurança do mercado.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm">
                        <FiLock className="h-3 w-3 text-green-600" /> SSL Certificado
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm">
                        <FiShield className="h-3 w-3 text-blue-600" /> PCI-DSS
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm">
                        <FiCheckCircle className="h-3 w-3 text-primary" /> Asaas Gateway
                      </span>
                    </div>
                  </div>
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
