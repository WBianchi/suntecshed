"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AccountProfile } from "@/components/account/AccountProfile";
import { AccountOrders } from "@/components/account/AccountOrders";
import { AccountFavorites } from "@/components/account/AccountFavorites";
import { AccountTracking } from "@/components/account/AccountTracking";
import { AccountSettings } from "@/components/account/AccountSettings";
import { AccountReviews } from "@/components/account/AccountReviews";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  FiUser, FiPackage, FiHeart, FiTruck, FiSettings,
  FiChevronDown, FiX, FiStar,
} from "react-icons/fi";

type ModuleId = "perfil" | "pedidos" | "favoritos" | "avaliacoes" | "rastrear" | "config";

const modules: { id: ModuleId; label: string; icon: any; description: string; color: string }[] = [
  { id: "perfil", label: "Meu Perfil", icon: FiUser, description: "Dados pessoais e endereço", color: "from-primary-light to-primary-dark" },
  { id: "pedidos", label: "Meus Pedidos", icon: FiPackage, description: "Histórico de compras", color: "from-primary-light to-primary-dark" },
  { id: "favoritos", label: "Meus Favoritos", icon: FiHeart, description: "Produtos salvos", color: "from-primary-light to-primary-dark" },
  { id: "avaliacoes", label: "Minhas Avaliações", icon: FiStar, description: "Suas avaliações de produtos", color: "from-primary-light to-primary-dark" },
  { id: "rastrear", label: "Rastrear Pedido", icon: FiTruck, description: "Acompanhe sua entrega", color: "from-primary-light to-primary-dark" },
  { id: "config", label: "Configurações", icon: FiSettings, description: "Senha e preferências", color: "from-primary-light to-primary-dark" },
];

const moduleComponents: Record<ModuleId, React.FC> = {
  perfil: AccountProfile,
  pedidos: AccountOrders,
  favoritos: AccountFavorites,
  avaliacoes: AccountReviews,
  rastrear: AccountTracking,
  config: AccountSettings,
};

export default function MinhaContaPage() {
  return (
    <Suspense fallback={null}>
      <MinhaContaContent />
    </Suspense>
  );
}

function MinhaContaContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = modules.some((m) => m.id === tabParam) ? (tabParam as ModuleId) : null;
  const [active, setActive] = useState<ModuleId | null>(initialTab);
  const moduleRefs = useRef<Partial<Record<ModuleId, HTMLDivElement | null>>>({});

  // Chegando pelo link do header (?tab=), já rola até o módulo aberto
  useEffect(() => {
    if (initialTab) {
      moduleRefs.current[initialTab]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: ModuleId) => {
    setActive((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-[1440px] px-4 py-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : user ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                  Minha Conta
                </h1>
                <p className="mt-1 text-gray-500">
                  Olá, <span className="font-semibold text-primary">{user.name}</span>! Gerencie sua conta aqui.
                </p>
              </div>

              <div className="space-y-3">
                {modules.map((mod) => {
                  const isOpen = active === mod.id;
                  const ModIcon = mod.icon;
                  const Content = moduleComponents[mod.id];

                  return (
                    <div key={mod.id}
                      ref={(el) => { moduleRefs.current[mod.id] = el; }}
                      className={cn(
                        "overflow-hidden rounded-2xl border transition-all duration-300",
                        isOpen ? "border-primary/20 shadow-lg shadow-primary/5" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
                      )}>
                      {/* Card Header — clickable */}
                      <button onClick={() => toggle(mod.id)}
                        className="flex w-full items-center gap-4 p-5 text-left transition-colors">
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white bg-gradient-to-br transition-transform duration-300",
                          mod.color,
                          isOpen && "scale-110"
                        )}>
                          <ModIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            "font-semibold transition-colors",
                            isOpen ? "text-primary" : "text-gray-900"
                          )}>{mod.label}</h3>
                          <p className="mt-0.5 text-sm text-gray-500">{mod.description}</p>
                        </div>
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                          isOpen ? "bg-primary/10 rotate-180" : "bg-gray-100"
                        )}>
                          <FiChevronDown className={cn("h-4 w-4 transition-colors", isOpen ? "text-primary" : "text-gray-400")} />
                        </div>
                      </button>

                      {/* Expanded content */}
                      <div className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                      )}>
                        <div className="border-t border-gray-100 px-5 py-5">
                          <Content />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-500">Você precisa estar logado para acessar esta página.</p>
              <Link href="/entrar" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                Fazer Login
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
