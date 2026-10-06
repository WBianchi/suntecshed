"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  FiArrowUp,
  FiArrowUpRight,
  FiChevronDown,
  FiClock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
} from "react-icons/fi";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPix } from "react-icons/fa6";
import { TbWallet } from "react-icons/tb";
import { cn } from "@/lib/utils";

const quickLinks = [
  { name: "About Us", href: "/quem-somos" },
  { name: "Our Store", href: "/nossa-loja" },
  { name: "Blog", href: "/blog" },
  { name: "Deals", href: "/ofertas" },
];

const atendimentoLinks = [
  { name: "Help Center", href: "/ajuda" },
  { name: "Contact Us", href: "/contato" },
  { name: "Returns & Exchanges", href: "/trocas-e-devolucoes" },
  { name: "Track Order", href: "/rastrear-pedido" },
  { name: "Shipping Times", href: "/prazo-de-entrega" },
];

interface CategoryFromAPI {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
}

const socialLinks = [
  { icon: FaInstagram, href: "https://www.instagram.com/Suntecshed/", label: "Instagram" },
  { icon: FaYoutube, href: "#", label: "YouTube" },
  { icon: FaFacebookF, href: "#", label: "Facebook" },
  { icon: FaTiktok, href: "#", label: "TikTok" },
  { icon: FaWhatsapp, href: "https://wa.me/553898842080", label: "WhatsApp" },
];

const paymentMethods = [
  { label: "Visa", classe: "text-blue-700", conteudo: <FaCcVisa className="h-3.5 w-auto sm:h-5" /> },
  { label: "Mastercard", classe: "text-orange-600", conteudo: <FaCcMastercard className="h-3.5 w-auto sm:h-5" /> },
  { label: "Elo", classe: "text-[8px] font-black tracking-tight text-gray-800 sm:text-xs", conteudo: "ELO" },
  { label: "American Express", classe: "text-blue-800", conteudo: <FaCcAmex className="h-3.5 w-auto sm:h-5" /> },
  { label: "Hipercard", classe: "text-[7px] font-black tracking-tight text-red-700 sm:text-[9px]", conteudo: "HIPER" },
  { label: "Pix", classe: "bg-primary/90 text-white", conteudo: <FaPix className="h-3 w-auto sm:h-4" /> },
  { label: "Carteira", classe: "text-gray-700", conteudo: <TbWallet className="h-3.5 w-auto sm:h-5" /> },
];

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* ───────────────────────── primitivos ───────────────────────── */

const linkClass =
  "group/fl relative inline-flex items-center gap-1.5 text-sm text-white/50 outline-none transition-colors duration-300 hover:text-white focus-visible:text-white";

/** Link com sublinhado que cresce + seta que surge no hover. */
function LinkInner({
  children,
  icon: Icon = FiArrowUpRight,
}: {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <>
      <span className="relative whitespace-nowrap">
        {children}
        <span
          aria-hidden
          className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-gradient-to-r from-primary-light to-primary-light/30 transition-transform duration-500 ease-out group-hover/fl:origin-left group-hover/fl:scale-x-100 group-focus-visible/fl:scale-x-100"
        />
      </span>
      <Icon
        aria-hidden
        className="h-3 w-3 shrink-0 -translate-x-1 translate-y-0.5 text-primary-light opacity-0 transition-all duration-300 group-hover/fl:translate-x-0 group-hover/fl:translate-y-0 group-hover/fl:opacity-100 group-focus-visible/fl:opacity-100"
      />
    </>
  );
}

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 sm:justify-start">
      <span aria-hidden className="h-1 w-1 rounded-full bg-primary-light" />
      {children}
    </p>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={linkClass}>
      <LinkInner>{children}</LinkInner>
    </Link>
  );
}

/* ───────────────────────── wordmark de assinatura ───────────────────────── */

function GiantWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const y = useTransform(progress, [0, 1], ["45%", "0%"]);
  const reveal = useTransform(progress, [0, 0.85], [-30, 100]);
  const mask = useMotionTemplate`linear-gradient(to top, #000 ${reveal}%, transparent calc(${reveal}% + 30%))`;

  // holofote que segue o cursor sobre as letras
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const spot = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, #000 0%, transparent 70%)`;

  const letters = "Suntecshed".split("");

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative select-none overflow-hidden pt-6"
      onMouseMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        mx.set(event.clientX - box.left);
        my.set(event.clientY - box.top);
      }}
      onMouseLeave={() => {
        mx.set(-999);
        my.set(-999);
      }}
    >
      <motion.div
        style={reduce ? undefined : { y, WebkitMaskImage: mask, maskImage: mask }}
        className="relative h-[0.72em] whitespace-nowrap text-center font-heading text-[clamp(3.2rem,17vw,15rem)] font-bold leading-[0.9] tracking-[-0.045em]"
      >
        {/* camada base: gradiente sutil */}
        <span className="block bg-gradient-to-b from-white/[0.18] via-white/[0.07] to-transparent bg-clip-text text-transparent">
          {letters.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              className="inline-block"
              initial={reduce ? false : { y: "40%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.1, ease: EASE_OUT, delay: index * 0.05 }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
        {/* camada de brilho da marca revelada pelo cursor */}
        <motion.span
          className="pointer-events-none absolute inset-0 block bg-gradient-to-b from-primary-light via-primary/70 to-transparent bg-clip-text text-transparent"
          style={{ WebkitMaskImage: spot, maskImage: spot }}
        >
          Suntecshed
        </motion.span>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── footer ───────────────────────── */

export function Footer() {
  const [expanded, setExpanded] = useState(false);
  const year = new Date().getFullYear();

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
    .filter((category) => category.parentId === null && category.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount);
  const bestSellersCategory = sortedCategories.find((category) => category.slug === "produtos-mais-vendidos");
  const topCategories = bestSellersCategory
    ? [bestSellersCategory, ...sortedCategories.filter((category) => category.id !== bestSellersCategory.id)].slice(0, 6)
    : sortedCategories.slice(0, 6);

  return (
    <footer className="relative px-2 pb-2 pt-6 sm:px-3 sm:pb-3 sm:pt-10">
      {/* Painel sempre escuro */}
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0B1220] text-white/70 sm:rounded-[2.5rem]">
        {/* fundos decorativos */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000, transparent)",
            }}
          />
          <div className="absolute -top-40 right-[-10%] h-[420px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(117_48_250/0.30),transparent)] blur-2xl" />
          <div className="absolute bottom-[-20%] left-[-10%] h-[360px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(117_48_250/0.14),transparent)] blur-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-light/60 to-transparent" />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 sm:py-14">
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            {/* Marca — sempre visível, mesmo recolhido no mobile */}
            <div className="text-center md:col-span-4 md:text-left">
              <Link href="/" className="inline-flex" aria-label="Suntecshed">
                <img src="/footerlogo.png" alt="Suntecshed" className="h-14 w-auto object-contain sm:h-[4.25rem]" />
              </Link>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/50 sm:mx-0">
                Premium curation of selected products to upgrade your lifestyle.
              </p>

              <div className="mt-6 flex justify-center gap-2 sm:justify-start">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-light/40 hover:bg-primary hover:text-white"
                  >
                    <social.icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>

              <a
                href="https://wa.me/553898842080"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 transition-colors duration-300 hover:border-primary-light/30 sm:mx-0"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary-light/25 bg-primary/15 text-primary-light">
                  <FaWhatsapp className="h-4 w-4" />
                </span>
                <span className="text-left text-xs leading-tight text-white/45">
                  WhatsApp support
                  <strong className="block text-sm font-semibold text-white">(38) 9884-2080</strong>
                </span>
                <FiArrowUpRight className="h-4 w-4 shrink-0 text-primary-light" />
              </a>

              {/* Ver mais — só no mobile, controla o resto das colunas */}
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary-light sm:hidden"
              >
                {expanded ? "See less" : "See more"}
                <FiChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
              </button>
            </div>

            {/* Colunas — recolhíveis no mobile, células do grid no sm+ */}
            <div
              className={cn(
                "grid gap-10 overflow-hidden text-center transition-all duration-300 sm:grid-cols-2 sm:overflow-visible sm:text-left md:col-span-8 lg:grid-cols-4",
                expanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0 sm:max-h-none sm:opacity-100",
              )}
            >
              {/* Categorias */}
              {topCategories.length > 0 && (
                <div>
                  <ColumnTitle>Categories</ColumnTitle>
                  <ul className="space-y-3.5">
                    {topCategories.map((category) => (
                      <li key={category.id}>
                        <FooterLink href={`/categoria/${category.slug}`}>{category.name}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Links Rápidos */}
              <div>
                <ColumnTitle>Quick Links</ColumnTitle>
                <ul className="space-y-3.5">
                  {quickLinks.map((link) => (
                    <li key={link.href}>
                      <FooterLink href={link.href}>{link.name}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Atendimento */}
              <div>
                <ColumnTitle>Support</ColumnTitle>
                <ul className="space-y-3.5">
                  {atendimentoLinks.map((link) => (
                    <li key={link.href}>
                      <FooterLink href={link.href}>{link.name}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contato */}
              <div>
                <ColumnTitle>Contact</ColumnTitle>
                <ul className="space-y-3.5 text-sm text-white/50">
                  <li className="flex items-center justify-center gap-2.5 sm:justify-start">
                    <FiPhone className="h-4 w-4 shrink-0 text-primary-light" />
                    <a href="tel:+553898842080" className="transition-colors hover:text-white">
                      (38) 9884-2080
                    </a>
                  </li>
                  <li className="flex items-center justify-center gap-2.5 sm:justify-start">
                    <FiMail className="h-4 w-4 shrink-0 text-primary-light" />
                    <a href="mailto:suntecshed@gmail.com" className="transition-colors hover:text-white">
                      suntecshed@gmail.com
                    </a>
                  </li>
                  <li className="flex items-center justify-center gap-2.5 sm:justify-start">
                    <FiClock className="h-4 w-4 shrink-0 text-primary-light" />
                    Mon-Fri: 8am-6pm
                  </li>
                  <li className="flex items-start justify-center gap-2.5 sm:justify-start">
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                    Virtual address
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Formas de pagamento */}
        <div className="border-t border-white/[0.08]">
          <div className="mx-auto max-w-[1440px] px-4 py-6 text-center sm:px-8">
            <p className="mb-3 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              <span aria-hidden className="h-1 w-1 rounded-full bg-primary-light" />
              Payment methods
            </p>
            <div className="flex flex-nowrap items-center justify-center gap-1 sm:flex-wrap sm:gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method.label}
                  title={method.label}
                  className={cn(
                    "flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 sm:h-8 sm:w-12",
                    method.classe,
                  )}
                >
                  {method.conteudo}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Linha final */}
        <div className="border-t border-white/[0.08]">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-5 px-4 py-6 text-xs text-white/45 sm:px-8 md:flex-row md:justify-between">
            <p className="text-center leading-relaxed md:text-left">
              © {year} Suntecshed. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/termos-de-uso" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link href="/politica-de-privacidade" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/trocas-e-devolucoes" className="transition-colors hover:text-white">
                Refunds
              </Link>
              <span className="hidden h-3 w-px bg-white/15 sm:block" />
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-light/20 bg-primary-light/[0.08] py-1 pl-1 pr-3 text-primary-light/90 transition-colors hover:border-primary-light/40">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-light/15">
                  <FiShield className="h-3 w-3" />
                </span>
                Secure checkout
              </span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
                className="group grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-light/40 hover:bg-primary hover:text-white"
              >
                <FiArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>

        <GiantWordmark />
      </div>
    </footer>
  );
}
