"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FiFileText, FiCheckCircle, FiAlertTriangle, FiShoppingCart, FiCreditCard, FiPackage, FiRotateCw, FiBookOpen } from "react-icons/fi";

const sections = [
  {
    id: "aceitacao",
    icon: FiCheckCircle,
    title: "1. Aceitação dos Termos",
    content: `
      <p>Ao acessar e utilizar o site da Suntecshed (Suntecshed.com.br), você concorda integralmente com estes Termos de Uso. Caso não concorde com algum dos termos, recomendamos que não utilize nossos serviços.</p>
      <p>Reservamo-nos o direito de alterar estes termos a qualquer momento, sendo que a versão atualizada será sempre publicada nesta página com a data da última revisão.</p>
    `,
  },
  {
    id: "cadastro",
    icon: FiCheckCircle,
    title: "2. Cadastro e Conta",
    content: `
      <p>Para realizar compras, é necessário criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você é responsável por:</p>
      <ul>
        <li>Manter a confidencialidade de suas credenciais de acesso</li>
        <li>Todas as atividades realizadas em sua conta</li>
        <li>Notificar imediatamente qualquer uso não autorizado</li>
        <li>Manter seus dados cadastrais atualizados</li>
      </ul>
      <p>A Suntecshed reserva-se o direito de suspender ou cancelar contas que violem estes termos ou que apresentem indícios de fraude.</p>
    `,
  },
  {
    id: "compras",
    icon: FiShoppingCart,
    title: "3. Compras e Pedidos",
    content: `
      <p>Ao realizar uma compra em nosso site:</p>
      <ul>
        <li>Os preços exibidos incluem impostos aplicáveis e são expressos em Reais (BRL)</li>
        <li>Promoções e descontos possuem condições específicas e prazo de validade</li>
        <li>A confirmação do pedido está sujeita à disponibilidade de estoque</li>
        <li>Reservamo-nos o direito de cancelar pedidos com indício de fraude</li>
        <li>Fotos são ilustrativas; cores podem apresentar pequenas variações conforme o monitor</li>
        <li>A disponibilidade de produtos é atualizada em tempo real, mas pode haver divergências pontuais</li>
      </ul>
    `,
  },
  {
    id: "pagamento",
    icon: FiCreditCard,
    title: "4. Pagamento",
    content: `
      <p>Aceitamos as seguintes formas de pagamento:</p>
      <ul>
        <li><strong>Cartão de crédito:</strong> Visa, Mastercard, Elo, Amex, Hipercard — em até 12x</li>
        <li><strong>PIX:</strong> pagamento instantâneo, com confirmação em até algumas horas</li>
        <li><strong>Carteira:</strong> pagamento com o saldo da carteira Suntecshed, com confirmação imediata</li>
      </ul>
      <p>Todos os pagamentos são processados por gateways certificados PCI-DSS, garantindo máxima segurança nas transações. A Suntecshed não armazena dados de cartão de crédito.</p>
    `,
  },
  {
    id: "entrega",
    icon: FiPackage,
    title: "5. Entrega",
    content: `
      <ul>
        <li>Os prazos de entrega são estimados e contados a partir da confirmação do pagamento</li>
        <li>O frete é calculado no checkout conforme o CEP de entrega</li>
        <li>O prazo pode variar conforme a região de entrega e disponibilidade das transportadoras</li>
        <li>Em caso de ausência no endereço, a transportadora realizará até 3 tentativas de entrega</li>
        <li>Pedidos podem ser rastreados diretamente em nosso site na seção "Rastrear Pedido"</li>
      </ul>
    `,
  },
  {
    id: "trocas",
    icon: FiRotateCw,
    title: "6. Trocas e Devoluções",
    content: `
      <p>Conforme o Código de Defesa do Consumidor:</p>
      <ul>
        <li><strong>Direito de arrependimento:</strong> até 7 dias corridos após o recebimento para desistência da compra</li>
        <li><strong>Primeira troca gratuita:</strong> em até 30 dias após o recebimento</li>
        <li>O produto deve estar em sua embalagem original, sem sinais de uso</li>
        <li>O reembolso é processado na mesma forma de pagamento original em até 10 dias úteis</li>
      </ul>
      <p>Para mais detalhes, consulte nossa <a href="/trocas-e-devolucoes" class="text-primary hover:underline font-semibold">Política de Trocas e Devoluções</a>.</p>
    `,
  },
  {
    id: "propriedade",
    icon: FiBookOpen,
    title: "7. Propriedade Intelectual",
    content: `
      <p>Todo o conteúdo do site é propriedade da Suntecshed ou de seus licenciadores:</p>
      <ul>
        <li>Textos, imagens, logotipos, ícones e layout são protegidos por direitos autorais</li>
        <li>Marcas registradas não podem ser utilizadas sem autorização prévia por escrito</li>
        <li>É proibida a reprodução, distribuição ou modificação do conteúdo sem autorização</li>
        <li>Fotos de produtos são de uso exclusivo da Suntecshed</li>
      </ul>
    `,
  },
  {
    id: "responsabilidades",
    icon: FiAlertTriangle,
    title: "8. Limitação de Responsabilidade",
    content: `
      <p>A Suntecshed não se responsabiliza por:</p>
      <ul>
        <li>Danos decorrentes de interrupções temporárias do site por manutenção ou falhas técnicas</li>
        <li>Uso indevido de credenciais de acesso por negligência do usuário</li>
        <li>Divergências de cores devido a configurações de monitor do usuário</li>
        <li>Atrasos na entrega por motivos de força maior (greves, desastres naturais, etc.)</li>
      </ul>
    `,
  },
  {
    id: "foro",
    icon: FiBookOpen,
    title: "9. Foro e Legislação Aplicável",
    content: `
      <p>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.</p>
      <p>Para dirimir quaisquer controvérsias, fica eleito o Foro da Comarca de Goiânia — GO, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
      <p>Em caso de dúvidas, entre em contato pelo e-mail <strong>contato@Suntecshed.com.br</strong> ou pelo telefone <strong>(38) 9884-2080</strong>.</p>
    `,
  },
];

export default function TermosDeUsoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Termos de Uso" }]} />
            <div className="mt-6 flex items-center gap-4 sm:mt-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <FiFileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-4xl" style={{ fontFamily: "var(--font-playfair)" }}>
                  Termos de Uso
                </h1>
                <p className="mt-1 text-sm text-white/50">Última atualização: Março de 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Sidebar Nav */}
              <aside className="hidden lg:block">
                <nav className="sticky top-24 space-y-1">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Seções</p>
                  {sections.map((s) => (
                    <a key={s.id} href={`#${s.id}`}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-primary/5 hover:text-primary">
                      <s.icon className="h-3.5 w-3.5" /> {s.title}
                    </a>
                  ))}
                </nav>
              </aside>

              {/* Main */}
              <div className="space-y-6">
                {sections.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>{s.title}</h2>
                    </div>
                    <div
                      className="prose prose-sm max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-li:text-sm prose-strong:text-gray-800 prose-ul:space-y-1 prose-a:text-primary"
                      dangerouslySetInnerHTML={{ __html: s.content }}
                    />
                  </div>
                ))}
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
