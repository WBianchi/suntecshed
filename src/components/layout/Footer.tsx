"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiChevronDown,
} from "react-icons/fi";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPix } from "react-icons/fa6";
import { TbWallet } from "react-icons/tb";
import { cn } from "@/lib/utils";

const quickLinks = [
  { name: "Quem Somos", href: "/quem-somos" },
  { name: "Nossa Loja", href: "/nossa-loja" },
  { name: "Blog", href: "/blog" },
  { name: "Promoções", href: "/ofertas" },
  { name: "Grupo VIP", href: "/grupo-vip" },
];

const atendimentoLinks = [
  { name: "Central de Ajuda", href: "/ajuda" },
  { name: "Fale Conosco", href: "/contato" },
  { name: "Trocas e Devoluções", href: "/trocas-e-devolucoes" },
  { name: "Rastrear Pedido", href: "/rastrear-pedido" },
  { name: "Prazo de Entrega", href: "/prazo-de-entrega" },
];

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
}

const socialLinks = [
  { icon: FaInstagram, href: "https://www.instagram.com/C7drop/", label: "Instagram" },
  { icon: FaYoutube, href: "#", label: "YouTube" },
  { icon: FaFacebookF, href: "#", label: "Facebook" },
  { icon: FaTiktok, href: "#", label: "TikTok" },
  { icon: FaWhatsapp, href: "https://wa.me/5521998792729", label: "WhatsApp" },
];

export function Footer() {
  const [expanded, setExpanded] = useState(false);

  const { data: allCategories = [] } = useQuery<CategoryFromAPI[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  // Ordena pelas maiores categorias, mas fixa "Mais vendidos" em primeiro
  // (categoria real de destaque comercial, não deve ficar de fora do corte).
  const sortedCategories = allCategories
    .filter((c) => c.parentId === null && c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount);
  const bestSellersCategory = sortedCategories.find((c) => c.slug === "produtos-mais-vendidos");
  const topCategories = bestSellersCategory
    ? [bestSellersCategory, ...sortedCategories.filter((c) => c.id !== bestSellersCategory.id)].slice(0, 6)
    : sortedCategories.slice(0, 6);

  return (
    <footer className="bg-[#0B1220] text-white/70">
      {/* Main columns */}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-5">
          {/* Brand — sempre visível, mesmo recolhido no mobile */}
          <div className="text-center sm:text-left">
            <img src="/footerlogo.png" alt="C7drop" className="mx-auto h-9 w-auto object-contain sm:mx-0" />
            <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/50 sm:mx-0">
              Curadoria premium de produtos selecionados para transformar seu estilo de vida.
            </p>
            <div className="mt-6 flex justify-center gap-2 sm:justify-start">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-primary hover:text-white"
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            {/* Ver mais — só no mobile, controla o resto das colunas */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary-light sm:hidden"
            >
              {expanded ? "Ver menos" : "Ver mais"}
              <FiChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
            </button>
          </div>

          {/* Grupo colapsável no mobile — no sm+ vira "contents" e cada
              coluna volta a ocupar sua própria célula do grid normalmente */}
          <div
            className={cn(
              "grid gap-8 overflow-hidden text-center transition-all duration-300 sm:contents sm:text-left sm:overflow-visible",
              expanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0 sm:max-h-none sm:opacity-100"
            )}
          >
            {/* Links Rápidos */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-light">
                Links Rápidos
              </h4>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categorias */}
            {topCategories.length > 0 && (
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-light">
                  Categorias
                </h4>
                <ul className="space-y-2.5">
                  {topCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link href={`/categoria/${cat.slug}`} className="text-sm text-white/50 transition-colors hover:text-white">
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Atendimento */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-light">
                Atendimento
              </h4>
              <ul className="space-y-2.5">
                {atendimentoLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-light">
                Contato
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="tel:+5521998792729" className="flex items-center justify-center gap-2.5 text-sm text-white/50 transition-colors hover:text-white sm:justify-start">
                    <FiPhone className="h-4 w-4 shrink-0 text-primary-light" />
                    (21) 99879-2729
                  </a>
                </li>
                <li>
                  <a href="mailto:c7drop@gmail.com" className="flex items-center justify-center gap-2.5 text-sm text-white/50 transition-colors hover:text-white sm:justify-start">
                    <FiMail className="h-4 w-4 shrink-0 text-primary-light" />
                    c7drop@gmail.com
                  </a>
                </li>
                <li className="flex items-center justify-center gap-2.5 text-sm text-white/50 sm:justify-start">
                  <FiClock className="h-4 w-4 shrink-0 text-primary-light" />
                  Seg-Sex: 8h às 18h
                </li>
                <li className="flex items-start justify-center gap-2.5 text-sm text-white/50 sm:justify-start">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                  Parque Dom Pedro II, 268 - Apto 22, Centro, São Paulo - SP
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-4 py-6 text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:text-xs">
            Formas de Pagamento
          </p>
          <div className="flex flex-nowrap items-center justify-center gap-1 sm:flex-wrap sm:gap-2">
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-blue-700 sm:h-8 sm:w-12">
              <FaCcVisa className="h-3.5 w-auto sm:h-5" />
            </span>
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-orange-600 sm:h-8 sm:w-12">
              <FaCcMastercard className="h-3.5 w-auto sm:h-5" />
            </span>
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-[8px] font-black tracking-tight text-gray-800 sm:h-8 sm:w-12 sm:text-xs">
              ELO
            </span>
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-blue-800 sm:h-8 sm:w-12">
              <FaCcAmex className="h-3.5 w-auto sm:h-5" />
            </span>
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-[7px] font-black tracking-tight text-red-700 sm:h-8 sm:w-12 sm:text-[9px]">
              HIPER
            </span>
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-primary/90 text-white sm:h-8 sm:w-12">
              <FaPix className="h-3 w-auto sm:h-4" />
            </span>
            <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-gray-700 sm:h-8 sm:w-12">
              <TbWallet className="h-3.5 w-auto sm:h-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} C7 Drop. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/termos-de-uso" className="transition-colors hover:text-white">Termos</Link>
            <Link href="/politica-de-privacidade" className="transition-colors hover:text-white">Privacidade</Link>
            <Link href="/trocas-e-devolucoes" className="transition-colors hover:text-white">Reembolso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
