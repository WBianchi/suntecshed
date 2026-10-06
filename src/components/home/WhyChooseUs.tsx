"use client";

import { FiTruck, FiShield, FiRefreshCw, FiCreditCard, FiAward, FiHeadphones } from "react-icons/fi";

const features = [
  {
    icon: FiTruck,
    title: "Envio Rápido",
    description: "Entregamos para todo o Brasil com agilidade",
    highlight: "Todo o Brasil",
  },
  {
    icon: FiShield,
    title: "Compra Segura",
    description: "Ambiente 100% criptografado com certificado SSL e proteção de dados",
    highlight: "SSL Certificado",
  },
  {
    icon: FiRefreshCw,
    title: "Troca Grátis",
    description: "Primeira troca gratuita em até 30 dias após o recebimento do pedido",
    highlight: "30 dias",
  },
  {
    icon: FiCreditCard,
    title: "Parcele no Cartão",
    description: "Parcele suas compras em até 12x no cartão de crédito",
    highlight: "Até 12x",
  },
  {
    icon: FiAward,
    title: "Qualidade Premium",
    description: "Produtos selecionados com os melhores materiais e acabamentos",
    highlight: "13 anos",
  },
  {
    icon: FiHeadphones,
    title: "Atendimento VIP",
    description: "Suporte dedicado via WhatsApp, chat e telefone de seg a sex",
    highlight: "Seg-Sex 8h-18h",
  },
];

export function WhyChooseUs() {
  return (
    <section className="border-t border-gray-100 bg-gray-50/50 py-10 sm:py-14">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="mb-6 text-center sm:mb-10">
          <h2 className="text-xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-poppins)" }}>
            Por que escolher a C7drop?
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-xs text-gray-500 sm:mt-2 sm:text-sm">
            Produtos de qualidade com procedência garantida, em atacado e dropshipping
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 sm:p-6"
            >
              {/* Mobile: compact centered */}
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white sm:h-12 sm:w-12 sm:rounded-2xl">
                  <feat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="mt-2 sm:mt-0">
                  <h3 className="text-xs font-bold text-gray-900 sm:text-base">{feat.title}</h3>
                  <p className="mt-0.5 hidden text-sm leading-relaxed text-gray-500 sm:block">{feat.description}</p>
                  <span className="mt-1 inline-block rounded-full bg-primary/5 px-2 py-0.5 text-[9px] font-semibold text-primary sm:mt-2 sm:px-3 sm:text-[11px]">
                    {feat.highlight}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
