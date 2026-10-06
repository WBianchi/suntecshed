"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSave, FiLoader, FiCheck, FiPlus, FiTrash2, FiMenu,
  FiChevronDown, FiChevronUp, FiImage,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface MenuItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface HeaderConfigData {
  id: string;
  logo: string | null;
  logoWhite: string | null;
  logoHeight: number | null;
  showSearch: boolean;
  showCart: boolean;
  showFavorites: boolean;
  showAccount: boolean;
  topBarText: string | null;
  topBarBgColor: string | null;
  topBarTextColor: string | null;
  topBarActive: boolean;
  menuItems: MenuItem[];
}

function useHeaderConfig() {
  return useQuery({
    queryKey: ["admin-header-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/header-config");
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<HeaderConfigData>;
    },
  });
}

function useStoreLogos() {
  return useQuery({
    queryKey: ["admin-store-settings-logos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return { storeLogo: null, storeLogoWhite: null };
      const d = await res.json();
      return { storeLogo: d.storeLogo as string | null, storeLogoWhite: d.storeLogoWhite as string | null };
    },
  });
}

export default function CabecalhoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useHeaderConfig();
  const { data: storeLogo } = useStoreLogos();
  const [config, setConfig] = useState<HeaderConfigData | null>(null);
  const [saved, setSaved] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);

  useEffect(() => {
    if (data) setConfig({ ...data, menuItems: Array.isArray(data.menuItems) ? data.menuItems : [] });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/header-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-header-config"] });
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

  const addMenuItem = () => {
    if (!config) return;
    setConfig({ ...config, menuItems: [...config.menuItems, { label: "", href: "", children: [] }] });
  };

  const updateMenuItem = (idx: number, field: string, value: string) => {
    if (!config) return;
    const items = [...config.menuItems];
    (items[idx] as any)[field] = value;
    setConfig({ ...config, menuItems: items });
  };

  const removeMenuItem = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, menuItems: config.menuItems.filter((_, i) => i !== idx) });
  };

  const addSubItem = (idx: number) => {
    if (!config) return;
    const items = [...config.menuItems];
    if (!items[idx].children) items[idx].children = [];
    items[idx].children!.push({ label: "", href: "" });
    setConfig({ ...config, menuItems: items });
  };

  const updateSubItem = (parentIdx: number, childIdx: number, field: string, value: string) => {
    if (!config) return;
    const items = [...config.menuItems];
    (items[parentIdx].children![childIdx] as any)[field] = value;
    setConfig({ ...config, menuItems: items });
  };

  const removeSubItem = (parentIdx: number, childIdx: number) => {
    if (!config) return;
    const items = [...config.menuItems];
    items[parentIdx].children = items[parentIdx].children!.filter((_, i) => i !== childIdx);
    setConfig({ ...config, menuItems: items });
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabeçalho</h1>
          <p className="mt-0.5 text-sm text-gray-500">Configure o header do site: logo, menus e barra superior</p>
        </div>
        <button onClick={handleSave} disabled={saveMut.isPending}
          className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
            saved ? "bg-green-500" : "bg-primary hover:bg-primary/90", saveMut.isPending && "opacity-50")}>
          {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : saved ? <FiCheck className="h-4 w-4" /> : <FiSave className="h-4 w-4" />}
          {saveMut.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Logo */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Logo</h2>
        {(!config.logo && storeLogo?.storeLogo) && (
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
            <img src={storeLogo.storeLogo} alt="Fallback" className="h-8 object-contain" />
            <div className="text-xs text-blue-700">
              <strong>Usando logo da loja como fallback.</strong> Defina uma logo específica para o cabeçalho ou mantenha a da loja.
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <ImageUpload label="Logo Principal" value={config.logo || storeLogo?.storeLogo || null} onChange={(url) => setField("logo", url)} aspectRatio="video" hint="Fundo claro — PNG transparente recomendado" />
          <ImageUpload label="Logo Branca" value={config.logoWhite || storeLogo?.storeLogoWhite || null} onChange={(url) => setField("logoWhite", url)} aspectRatio="video" hint="Fundo escuro — PNG transparente recomendado" />
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Altura da Logo (px)</label>
            <input type="number" value={config.logoHeight || 40} onChange={(e) => setField("logoHeight", parseInt(e.target.value) || 40)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Barra Superior</h2>
          <button onClick={() => setField("topBarActive", !config.topBarActive)}
            className={cn("relative h-7 w-12 rounded-full transition-colors", config.topBarActive ? "bg-green-500" : "bg-gray-300")}>
            <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", config.topBarActive ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Texto da Barra</label>
            <input value={config.topBarText || ""} onChange={(e) => setField("topBarText", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="🚚 Frete Grátis acima de R$299,90" />
          </div>
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Cor de Fundo</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.topBarBgColor || "#1a1a1a"} onChange={(e) => setField("topBarBgColor", e.target.value)} className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer" />
              <input value={config.topBarBgColor || ""} onChange={(e) => setField("topBarBgColor", e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Cor do Texto</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.topBarTextColor || "#ffffff"} onChange={(e) => setField("topBarTextColor", e.target.value)} className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer" />
              <input value={config.topBarTextColor || ""} onChange={(e) => setField("topBarTextColor", e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
            </div>
          </div>
        </div>
        {config.topBarActive && config.topBarText && (
          <div className="rounded-xl overflow-hidden text-center py-2 text-xs font-medium" style={{ backgroundColor: config.topBarBgColor || "#1a1a1a", color: config.topBarTextColor || "#fff" }}>
            {config.topBarText}
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Visibilidade dos Elementos</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "showSearch", label: "Barra de Busca" },
            { key: "showCart", label: "Ícone do Carrinho" },
            { key: "showFavorites", label: "Ícone dos Favoritos" },
            { key: "showAccount", label: "Ícone da Conta" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={(config as any)[item.key]} onChange={(e) => setField(item.key, e.target.checked)} className="rounded" />
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Menu de Navegação</h2>
          <button onClick={addMenuItem} className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
            <FiPlus className="h-3.5 w-3.5" /> Adicionar Item
          </button>
        </div>

        {config.menuItems.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">Nenhum item no menu</p>
        )}

        <div className="space-y-2">
          {config.menuItems.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FiMenu className="h-4 w-4 text-gray-300 shrink-0" />
                <input value={item.label} onChange={(e) => updateMenuItem(idx, "label", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Label do menu" />
                <input value={item.href} onChange={(e) => updateMenuItem(idx, "href", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="/link" />
                <button onClick={() => setExpandedMenu(expandedMenu === idx ? null : idx)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  {expandedMenu === idx ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                </button>
                <button onClick={() => removeMenuItem(idx)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {expandedMenu === idx && (
                <div className="pl-8 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-400">Subitens (dropdown)</p>
                  {item.children?.map((child, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <input value={child.label} onChange={(e) => updateSubItem(idx, cIdx, "label", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary" placeholder="Sublabel" />
                      <input value={child.href} onChange={(e) => updateSubItem(idx, cIdx, "href", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary" placeholder="/sublink" />
                      <button onClick={() => removeSubItem(idx, cIdx)} className="text-gray-300 hover:text-red-500"><FiTrash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => addSubItem(idx)} className="text-xs font-medium text-primary hover:underline">+ Adicionar subitem</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
