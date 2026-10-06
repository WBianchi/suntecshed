"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FiPackage, FiTruck, FiShield, FiTarget, FiEye, FiTag } from "react-icons/fi";

const howItWorks = [
  { icon: FiTag, title: "1. Sua loja vende", desc: "Você anuncia e vende os produtos na sua loja, pelo preço que quiser." },
  { icon: FiPackage, title: "2. Envia a etiqueta", desc: "Depois da venda, você nos envia a etiqueta de transação com os dados do cliente final." },
  { icon: FiTruck, title: "3. Nós enviamos", desc: "Cuidamos de todo o processo de envio direto para o seu cliente, com agilidade e segurança." },
];

const values = [
  { icon: FiShield, title: "Procedência", desc: "Trabalhamos com produtos de alta qualidade e procedência garantida.", color: "bg-primary/10 text-primary" },
  { icon: FiTruck, title: "Agilidade", desc: "Processos otimizados para envio rápido em todo o Brasil.", color: "bg-primary/10 text-primary" },
  { icon: FiPackage, title: "Atacado e Dropshipping", desc: "Estrutura pensada tanto para quem revende quanto para quem compra em volume.", color: "bg-primary/10 text-primary" },
];

export default function QuemSomosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Quem Somos" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Quem Somos
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Fornecedor para Dropshipping e Atacado
              </p>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Quem somos</span>
                <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                  Fornecedor para Atacado e Dropshipping
                </h2>
                <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                  <p>
                    A <strong className="text-gray-900">C7 Drop</strong> fornece produtos de alta qualidade e procedência,
                    tanto no modelo de <strong>Atacado</strong> quanto de <strong>Dropshipping</strong>.
                  </p>
                  <p>
                    No dropshipping, sua loja faz a venda do produto e nos envia a etiqueta dessa transação —
                    somos nós que cuidamos de todo o processo de envio diretamente para o seu cliente final,
                    com agilidade e segurança.
                  </p>
                  <p>
                    Já no atacado, você compra em volume com preços diferenciados pra revender do seu jeito.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-8 sm:p-10">
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-lg shadow-primary/10">
                      <img src="/logo.png" alt="C7 Drop" className="h-12 w-auto object-contain" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      C7 Drop
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-gray-500">
                      Fornecedor para atacado e dropshipping
                    </p>
                    <div className="mt-6 flex gap-3">
                      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                        <FiTarget className="h-3.5 w-3.5 text-primary" /> Missão
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                        <FiEye className="h-3.5 w-3.5 text-primary" /> Visão
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-8 text-center sm:mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Dropshipping</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Como funciona
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {howItWorks.map((step) => (
                <div key={step.title} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Missão, Visão, Valores */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-6 grid gap-6 sm:mb-10 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-primary/5 to-transparent p-6 sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                  <FiTarget className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Nossa Missão</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Fornecer produtos de alta qualidade e procedência para lojistas de dropshipping e atacado,
                  com agilidade e segurança em cada envio.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-primary/5 p-6 sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                  <FiEye className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Nossa Visão</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Ser referência como fornecedor de dropshipping e atacado no Brasil, reconhecida pela
                  qualidade dos produtos e pela confiabilidade no envio.
                </p>
              </div>
            </div>

            <div className="mb-6 text-center sm:mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">O que nos move</span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Nossos Valores
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {values.map((v) => (
                <div key={v.title} className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 sm:p-6">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${v.color} transition-transform group-hover:scale-110`}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-gray-900 sm:text-base">{v.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary to-primary/80 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
              Vamos trabalhar juntos?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/70 sm:text-base">
              Conheça nosso catálogo e comece a vender em atacado ou dropshipping
            </p>
            <a href="/produtos"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-primary shadow-lg transition-all hover:shadow-xl hover:scale-105">
              Explorar Produtos
            </a>
          </div>
        </section>

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
