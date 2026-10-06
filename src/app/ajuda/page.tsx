"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  FiSearch, FiChevronDown, FiShoppingCart, FiTruck, FiCreditCard,
  FiRefreshCw, FiUser, FiShield, FiMessageCircle, FiMail,
  FiPhone, FiHelpCircle, FiPackage, FiHeart,
} from "react-icons/fi";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  icon: any;
  title: string;
  color: string;
  items: FaqItem[];
}

const faqCategories: FaqCategory[] = [
  {
    id: "pedidos",
    icon: FiShoppingCart,
    title: "Pedidos",
    color: "bg-primary/10 text-primary",
    items: [
      { q: "Como faço um pedido?", a: "Navegue pela loja, adicione os produtos ao carrinho e finalize a compra na página de checkout. Você pode pagar com cartão, PIX ou boleto." },
      { q: "Posso alterar meu pedido após a confirmação?", a: "Alterações são possíveis apenas enquanto o pedido está com status 'Pendente'. Entre em contato conosco o mais rápido possível pelo WhatsApp ou e-mail." },
      { q: "Como acompanho meu pedido?", a: "Acesse a página <a href='/rastrear-pedido' class='text-primary font-semibold hover:underline'>Rastrear Pedido</a> e informe o número do seu pedido ou e-mail cadastrado." },
      { q: "Posso cancelar meu pedido?", a: "Sim, pedidos podem ser cancelados antes do envio. Após o despacho, será necessário seguir o processo de devolução. Entre em contato conosco." },
      { q: "Receberei nota fiscal?", a: "Sim, a nota fiscal eletrônica é enviada automaticamente para o e-mail cadastrado após a confirmação do pagamento." },
    ],
  },
  {
    id: "entrega",
    icon: FiTruck,
    title: "Entrega e Frete",
    color: "bg-primary/10 text-primary",
    items: [
      { q: "Qual o prazo de entrega?", a: "O prazo varia conforme sua região. Em São Paulo e região metropolitana, de 1 a 3 dias úteis. Para outras regiões, de 5 a 15 dias úteis. Consulte na página <a href='/prazo-de-entrega' class='text-primary font-semibold hover:underline'>Prazo de Entrega</a>." },
      { q: "O frete é grátis?", a: "O frete é calculado no checkout de acordo com o seu CEP." },
      { q: "Vocês entregam em todo o Brasil?", a: "Sim, entregamos para todos os estados brasileiros através dos Correios e transportadoras parceiras." },
      { q: "E se eu não estiver em casa na entrega?", a: "A transportadora realizará até 3 tentativas. Caso não consiga entregar, o pedido ficará disponível para retirada na agência mais próxima por 7 dias." },
    ],
  },
  {
    id: "pagamento",
    icon: FiCreditCard,
    title: "Pagamento",
    color: "bg-primary/10 text-primary",
    items: [
      { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos cartões de crédito (Visa, Mastercard, Elo, Amex, Hipercard), PIX e boleto bancário. Veja mais em <a href='/formas-de-pagamento' class='text-primary font-semibold hover:underline'>Formas de Pagamento</a>." },
      { q: "Posso parcelar?", a: "Sim! Parcele em até 12x no cartão de crédito." },
      { q: "O site é seguro para compras?", a: "Totalmente! Nosso site possui certificado SSL, e todos os pagamentos são processados por gateways certificados PCI-DSS." },
      { q: "Quando meu cartão será cobrado?", a: "A cobrança é realizada no momento da confirmação do pedido. Em caso de cancelamento, o estorno ocorre em até 2 faturas." },
    ],
  },
  {
    id: "trocas",
    icon: FiRefreshCw,
    title: "Trocas e Devoluções",
    color: "bg-primary/10 text-primary",
    items: [
      { q: "Como solicitar uma troca?", a: "Entre em contato conosco pelo WhatsApp ou e-mail informando o número do pedido e o motivo. A primeira troca é gratuita! Saiba mais em <a href='/trocas-e-devolucoes' class='text-primary font-semibold hover:underline'>Trocas e Devoluções</a>." },
      { q: "Qual o prazo para troca?", a: "Você tem até 30 dias após o recebimento para solicitar a primeira troca gratuita. O produto deve estar sem uso e na embalagem original." },
      { q: "Como funciona o reembolso?", a: "O reembolso é processado na mesma forma de pagamento original em até 10 dias úteis após o recebimento do produto devolvido." },
    ],
  },
  {
    id: "conta",
    icon: FiUser,
    title: "Minha Conta",
    color: "bg-primary/10 text-primary",
    items: [
      { q: "Como criar uma conta?", a: "Clique em 'Entrar' no topo do site e depois em 'Criar conta'. Preencha seus dados e pronto!" },
      { q: "Esqueci minha senha, o que faço?", a: "Na página de login, clique em 'Esqueci minha senha'. Enviaremos um link de recuperação para seu e-mail cadastrado." },
      { q: "Como alterar meus dados?", a: "Acesse 'Minha Conta' e clique em 'Editar Perfil'. Você pode alterar nome, telefone, endereço e senha." },
      { q: "Posso excluir minha conta?", a: "Sim. Entre em contato conosco pelo e-mail contato@Suntecshed.com.br e solicitaremos a exclusão conforme a LGPD." },
    ],
  },
];

const quickLinks = [
  { icon: FiPackage, title: "Rastrear Pedido", desc: "Acompanhe sua encomenda", href: "/rastrear-pedido", color: "bg-primary/10 text-primary hover:bg-primary/10" },
  { icon: FiRefreshCw, title: "Trocas e Devoluções", desc: "Política completa", href: "/trocas-e-devolucoes", color: "bg-primary/10 text-primary hover:bg-primary/10" },
  { icon: FiCreditCard, title: "Formas de Pagamento", desc: "Métodos aceitos", href: "/formas-de-pagamento", color: "bg-primary/10 text-primary hover:bg-primary/10" },
  { icon: FiTruck, title: "Prazo de Entrega", desc: "Calcule o frete", href: "/prazo-de-entrega", color: "bg-primary/10 text-primary hover:bg-primary/10" },
];

export default function AjudaPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggle = (key: string) => setOpenItems((p) => ({ ...p, [key]: !p[key] }));

  const searchLower = search.toLowerCase();
  const filtered = faqCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          (!search || item.q.toLowerCase().includes(searchLower) || item.a.toLowerCase().includes(searchLower)) &&
          (!activeCategory || activeCategory === cat.id)
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Ajuda" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Central de Ajuda
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Encontre respostas rápidas para suas dúvidas
              </p>
              {/* Search */}
              <div className="relative mt-6">
                <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-sm shadow-lg outline-none placeholder:text-gray-400 sm:text-base"
                  placeholder="Busque sua dúvida... Ex: prazo de entrega, troca, pagamento" />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="border-b border-gray-100 bg-white py-6">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickLinks.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`group flex items-center gap-3 rounded-2xl p-4 transition-all ${l.color}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <l.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 sm:text-sm">{l.title}</p>
                    <p className="truncate text-[10px] text-gray-500">{l.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="bg-gray-50/50 py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mb-6 flex flex-wrap gap-2">
              <button onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${!activeCategory ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
                Todas as categorias
              </button>
              {faqCategories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${activeCategory === cat.id ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
                  <cat.icon className="h-3.5 w-3.5" /> {cat.title}
                </button>
              ))}
            </div>

            {/* FAQ Accordion */}
            {filtered.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <FiHelpCircle className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-bold text-gray-600">Nenhum resultado encontrado</h3>
                <p className="mt-1 text-sm text-gray-400">Tente outro termo de busca ou entre em contato conosco</p>
              </div>
            )}

            <div className="space-y-6">
              {filtered.map((cat) => (
                <div key={cat.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.color}`}>
                      <cat.icon className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">{cat.title}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{cat.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cat.items.map((item, i) => {
                      const key = `${cat.id}-${i}`;
                      const isOpen = openItems[key];
                      return (
                        <div key={key} className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all">
                          <button onClick={() => toggle(key)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50">
                            <span className="text-sm font-semibold text-gray-800 pr-4">{item.q}</span>
                            <FiChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isOpen && (
                            <div className="border-t border-gray-50 px-5 pb-4 pt-2">
                              <div className="text-sm leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: item.a }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center sm:p-12">
              <FiMessageCircle className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Não encontrou o que procurava?
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Nossa equipe está pronta para ajudar. Entre em contato por qualquer canal.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a href="https://wa.me/553898842080" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-all">
                  <FiMessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a href="mailto:contato@Suntecshed.com.br"
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                  <FiMail className="h-4 w-4" /> E-mail
                </a>
                <a href="tel:+556****4444"
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                  <FiPhone className="h-4 w-4" /> Telefone
                </a>
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
