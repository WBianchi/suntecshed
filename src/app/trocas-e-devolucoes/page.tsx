"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  FiRefreshCw, FiPackage, FiMessageCircle, FiTruck, FiCheckCircle,
  FiDollarSign, FiClock, FiAlertCircle, FiPhone, FiMail,
  FiChevronRight, FiShield, FiXCircle,
} from "react-icons/fi";

const steps = [
  {
    step: 1,
    icon: FiMessageCircle,
    title: "Entre em Contato",
    desc: "Fale conosco pelo WhatsApp, e-mail ou telefone informando o número do pedido e o motivo da troca ou devolução.",
    color: "bg-primary",
  },
  {
    step: 2,
    icon: FiCheckCircle,
    title: "Aprovação",
    desc: "Nossa equipe analisará a solicitação em até 24h e enviará as instruções para envio do produto.",
    color: "bg-primary",
  },
  {
    step: 3,
    icon: FiTruck,
    title: "Envie o Produto",
    desc: "Embale o produto na embalagem original e envie para o endereço informado nas instruções.",
    color: "bg-primary",
  },
  {
    step: 4,
    icon: FiPackage,
    title: "Recebimento e Análise",
    desc: "Ao recebermos o produto, faremos a inspeção de qualidade em até 3 dias úteis.",
    color: "bg-primary",
  },
  {
    step: 5,
    icon: FiDollarSign,
    title: "Troca ou Reembolso",
    desc: "Enviaremos o novo produto ou processaremos o reembolso na forma de pagamento original.",
    color: "bg-primary",
  },
];

const rules = [
  { icon: FiClock, title: "Prazo para troca", desc: "Até 30 dias corridos após o recebimento", ok: true },
  { icon: FiClock, title: "Direito de arrependimento", desc: "Até 7 dias corridos após o recebimento (CDC Art. 49)", ok: true },
  { icon: FiRefreshCw, title: "Primeira troca", desc: "Frete de devolução gratuito na primeira troca", ok: true },
  { icon: FiPackage, title: "Embalagem original", desc: "O produto deve estar na embalagem original, sem sinais de uso", ok: true },
  { icon: FiDollarSign, title: "Reembolso", desc: "Processado em até 10 dias úteis na forma de pagamento original", ok: true },
  { icon: FiAlertCircle, title: "Lacre de garantia", desc: "Produtos com o lacre/selo de garantia rompido seguem política específica", ok: false },
];

const notAccepted = [
  "Produtos com sinais de uso, mau uso ou alteração",
  "Produtos sem embalagem original ou com danos na embalagem",
  "Produtos com o lacre/selo de garantia rompido — exceto defeito de fabricação",
  "Produtos com mais de 30 dias desde o recebimento",
];

export default function TrocasDevolucoes() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Trocas e Devoluções" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Trocas e Devoluções
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Sua satisfação é nossa prioridade. Primeira troca gratuita em até 30 dias.
              </p>
            </div>
          </div>
        </section>

        {/* Highlight Banner */}
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FiRefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">1ª Troca Grátis</h3>
                  <p className="text-xs text-gray-500">Frete por nossa conta</p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-6 sm:px-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FiClock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">30 Dias</h3>
                  <p className="text-xs text-gray-500">Prazo para solicitar troca</p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-6 sm:pl-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FiShield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Garantia</h3>
                  <p className="text-xs text-gray-500">Produtos com defeito são substituídos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-8 text-center sm:mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Passo a passo</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Como Funciona
              </h2>
            </div>

            {/* Desktop timeline */}
            <div className="hidden sm:block">
              <div className="relative">
                <div className="absolute left-0 right-0 top-8 h-0.5 bg-gray-200" />
                <div className="grid grid-cols-5 gap-4">
                  {steps.map((s) => (
                    <div key={s.step} className="relative text-center">
                      <div className={`relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${s.color} text-white shadow-lg`}>
                        <s.icon className="h-6 w-6" />
                      </div>
                      <div className="absolute -top-1 right-1/2 translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-gray-500 shadow-sm ring-2 ring-gray-100">
                        {s.step}
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-gray-900">{s.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-3 sm:hidden">
              {steps.map((s) => (
                <div key={s.step} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.color} text-white`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">PASSO {s.step}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{s.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Condições</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Regras da Política
              </h2>
            </div>
            <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rules.map((r) => (
                <div key={r.title} className={`rounded-2xl border p-5 transition-all ${r.ok ? "border-gray-100 bg-white hover:border-primary/30" : "border-primary/20 bg-primary/5"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${r.ok ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"}`}>
                      <r.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{r.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{r.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Not Accepted */}
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FiXCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Trocas Não Aceitas</h2>
                </div>
                <ul className="space-y-2">
                  {notAccepted.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <FiXCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-primary to-primary/80 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
              Precisa de ajuda com sua troca?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
              Nossa equipe está pronta para ajudar. Entre em contato e resolveremos tudo para você.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href="https://wa.me/5521998792729" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary hover:shadow-lg transition-all">
                <FiMessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href="mailto:contato@C7drop.com.br"
                className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all">
                <FiMail className="h-4 w-4" /> E-mail
              </a>
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
