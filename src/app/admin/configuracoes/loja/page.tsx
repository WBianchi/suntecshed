"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSave, FiLoader, FiCheck, FiSettings, FiPhone, FiMail,
  FiMapPin, FiGlobe, FiTruck, FiPercent,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface StoreSettings {
  id: string;
  storeName: string;
  storeEmail: string | null;
  storePhone: string | null;
  storeWhatsapp: string | null;
  storeAddress: string | null;
  storeLogo: string | null;
  storeLogoWhite: string | null;
  storeFavicon: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  freeShippingMinValue: number | null;
  defaultShippingDays: number | null;
  enableFirstPurchaseDiscount: boolean;
  firstPurchaseDiscount: number;
}

function useStoreSettings() {
  return useQuery({
    queryKey: ["admin-store-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<StoreSettings>;
    },
  });
}

export default function LojaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useStoreSettings();
  const [config, setConfig] = useState<StoreSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"geral" | "imagens" | "frete" | "descontos">("geral");

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    if (!config) return;
    const { id, ...payload } = config;
    saveMut.mutate(payload);
  };

  const setField = (key: string, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
    setSaved(false);
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <FiSettings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações da Loja</h1>
            <p className="mt-0.5 text-sm text-gray-500">Dados gerais, imagens, frete e descontos</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saveMut.isPending}
          className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
            saved ? "bg-green-500" : "bg-primary hover:bg-primary/90", saveMut.isPending && "opacity-50")}>
          {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : saved ? <FiCheck className="h-4 w-4" /> : <FiSave className="h-4 w-4" />}
          {saveMut.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-gray-100 bg-white p-1">
        {(["geral", "imagens", "frete", "descontos"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all",
              tab === t ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700")}>
            {t === "geral" ? "Dados Gerais" : t === "imagens" ? "Imagens" : t === "frete" ? "Frete" : "Descontos"}
          </button>
        ))}
      </div>

      {/* Dados Gerais */}
      {tab === "geral" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Informações da Loja</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Nome da Loja</label>
                <input value={config.storeName} onChange={(e) => setField("storeName", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="C7 Drop" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"><FiMail className="h-3 w-3" /> E-mail</label>
                <input value={config.storeEmail || ""} onChange={(e) => setField("storeEmail", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="contato@C7drop.com.br" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"><FiPhone className="h-3 w-3" /> Telefone</label>
                <input value={config.storePhone || ""} onChange={(e) => setField("storePhone", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="(62) 3333-3333" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"><FiPhone className="h-3 w-3" /> WhatsApp</label>
                <input value={config.storeWhatsapp || ""} onChange={(e) => setField("storeWhatsapp", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="(62) 99999-9999" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600"><FiMapPin className="h-3 w-3" /> Endereço</label>
                <input value={config.storeAddress || ""} onChange={(e) => setField("storeAddress", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Rua Exemplo, 123 - São Paulo/SP" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><FiGlobe className="h-4 w-4" /> Redes Sociais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Instagram</label>
                <input value={config.instagram || ""} onChange={(e) => setField("instagram", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://instagram.com/C7drop" />
              </div>
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Facebook</label>
                <input value={config.facebook || ""} onChange={(e) => setField("facebook", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://facebook.com/C7drop" />
              </div>
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">TikTok</label>
                <input value={config.tiktok || ""} onChange={(e) => setField("tiktok", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://tiktok.com/@C7drop" />
              </div>
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">YouTube</label>
                <input value={config.youtube || ""} onChange={(e) => setField("youtube", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://youtube.com/@C7drop" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imagens */}
      {tab === "imagens" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900">Imagens da Loja</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <ImageUpload label="Logo Principal" value={config.storeLogo} onChange={(url) => setField("storeLogo", url)} aspectRatio="video" hint="Fundo claro — PNG transparente" />
            <ImageUpload label="Logo Branca" value={config.storeLogoWhite} onChange={(url) => setField("storeLogoWhite", url)} aspectRatio="video" hint="Fundo escuro — PNG transparente" />
            <ImageUpload label="Favicon" value={config.storeFavicon} onChange={(url) => setField("storeFavicon", url)} aspectRatio="square" hint="ICO, PNG ou SVG — 32x32px" />
          </div>
        </div>
      )}

      {/* Frete */}
      {tab === "frete" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><FiTruck className="h-4 w-4" /> Configurações de Frete</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Frete Grátis a partir de (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                <input type="number" step="0.01" value={config.freeShippingMinValue || ""} onChange={(e) => setField("freeShippingMinValue", e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" placeholder="299.90" />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Deixe vazio para desabilitar frete grátis</p>
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Prazo padrão de envio (dias úteis)</label>
              <input type="number" value={config.defaultShippingDays || ""} onChange={(e) => setField("defaultShippingDays", e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="7" />
              <p className="mt-1 text-[10px] text-gray-400">Usado quando não há cálculo de frete por transportadora</p>
            </div>
          </div>
        </div>
      )}

      {/* Descontos */}
      {tab === "descontos" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPercent className="h-4 w-4 text-blue-600" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Desconto Primeira Compra</h2>
                  <p className="text-[10px] text-gray-400">Desconto automático para novos clientes</p>
                </div>
              </div>
              <button onClick={() => setField("enableFirstPurchaseDiscount", !config.enableFirstPurchaseDiscount)}
                className={cn("relative h-7 w-12 rounded-full transition-colors", config.enableFirstPurchaseDiscount ? "bg-green-500" : "bg-gray-300")}>
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", config.enableFirstPurchaseDiscount ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            {config.enableFirstPurchaseDiscount && (
              <div className="max-w-xs">
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Porcentagem de Desconto (%)</label>
                <div className="relative">
                  <input type="number" step="0.1" min="0" max="100" value={config.firstPurchaseDiscount} onChange={(e) => setField("firstPurchaseDiscount", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary" placeholder="10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
