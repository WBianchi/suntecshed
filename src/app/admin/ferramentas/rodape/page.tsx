"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSave, FiLoader, FiCheck, FiPlus, FiTrash2, FiLayout,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

interface FooterConfigData {
  id: string;
  logo: string | null;
  logoWhite: string | null;
  description: string | null;
  copyright: string | null;
  showNewsletter: boolean;
  newsletterTitle: string | null;
  newsletterText: string | null;
  columns: FooterColumn[];
  socialLinks: Record<string, string>;
  paymentMethods: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactAddress: string | null;
  bgColor: string | null;
  textColor: string | null;
}

function useFooterConfig() {
  return useQuery({
    queryKey: ["admin-footer-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/footer-config");
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<FooterConfigData>;
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

const allPaymentMethods = [
  { value: "pix", label: "PIX" }, { value: "boleto", label: "Boleto" },
  { value: "visa", label: "Visa" }, { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" }, { value: "amex", label: "Amex" },
  { value: "hipercard", label: "Hipercard" }, { value: "diners", label: "Diners" },
];

export default function RodapePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useFooterConfig();
  const { data: storeLogo } = useStoreLogos();
  const [config, setConfig] = useState<FooterConfigData | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"geral" | "colunas" | "contato" | "social">("geral");

  useEffect(() => {
    if (data) {
      setConfig({
        ...data,
        columns: Array.isArray(data.columns) ? data.columns : [],
        socialLinks: typeof data.socialLinks === "object" && data.socialLinks ? data.socialLinks : {},
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/footer-config", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-footer-config"] });
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

  const setSocialLink = (key: string, value: string) => {
    if (!config) return;
    setConfig({ ...config, socialLinks: { ...config.socialLinks, [key]: value } });
  };

  const addColumn = () => {
    if (!config) return;
    setConfig({ ...config, columns: [...config.columns, { title: "", links: [] }] });
  };

  const updateColumnTitle = (idx: number, title: string) => {
    if (!config) return;
    const cols = [...config.columns];
    cols[idx].title = title;
    setConfig({ ...config, columns: cols });
  };

  const removeColumn = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, columns: config.columns.filter((_, i) => i !== idx) });
  };

  const addColumnLink = (colIdx: number) => {
    if (!config) return;
    const cols = [...config.columns];
    cols[colIdx].links.push({ label: "", href: "" });
    setConfig({ ...config, columns: cols });
  };

  const updateColumnLink = (colIdx: number, linkIdx: number, field: string, value: string) => {
    if (!config) return;
    const cols = [...config.columns];
    (cols[colIdx].links[linkIdx] as any)[field] = value;
    setConfig({ ...config, columns: cols });
  };

  const removeColumnLink = (colIdx: number, linkIdx: number) => {
    if (!config) return;
    const cols = [...config.columns];
    cols[colIdx].links = cols[colIdx].links.filter((_, i) => i !== linkIdx);
    setConfig({ ...config, columns: cols });
  };

  const togglePayment = (method: string) => {
    if (!config) return;
    const methods = config.paymentMethods.includes(method)
      ? config.paymentMethods.filter((m) => m !== method)
      : [...config.paymentMethods, method];
    setConfig({ ...config, paymentMethods: methods });
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
          <h1 className="text-2xl font-bold text-gray-900">Rodapé</h1>
          <p className="mt-0.5 text-sm text-gray-500">Configure o footer do site: logo, colunas, contato e redes sociais</p>
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
        {(["geral", "colunas", "contato", "social"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all",
              tab === t ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700")}>
            {t === "geral" ? "Geral" : t === "colunas" ? "Colunas" : t === "contato" ? "Contato" : "Redes & Pagamento"}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          {(!config.logo && storeLogo?.storeLogo) && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
              <img src={storeLogo.storeLogo} alt="Fallback" className="h-8 object-contain" />
              <div className="text-xs text-blue-700">
                <strong>Usando logo da loja como fallback.</strong> Defina uma logo específica para o rodapé ou mantenha a da loja.
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload label="Logo do Rodapé" value={config.logo || storeLogo?.storeLogo || null} onChange={(url) => setField("logo", url)} aspectRatio="video" hint="PNG transparente recomendado" />
            <ImageUpload label="Logo Branca" value={config.logoWhite || storeLogo?.storeLogoWhite || null} onChange={(url) => setField("logoWhite", url)} aspectRatio="video" hint="Para fundo escuro" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Descrição</label>
              <textarea value={config.description || ""} onChange={(e) => setField("description", e.target.value)} rows={2}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Conforto e beleza que transforma casas em lares." />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Copyright</label>
              <input value={config.copyright || ""} onChange={(e) => setField("copyright", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="© 2025 C7 Drop. Todos os direitos reservados." />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Cor de Fundo</label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.bgColor || "#1a1a1a"} onChange={(e) => setField("bgColor", e.target.value)} className="h-9 w-9 rounded-lg border cursor-pointer" />
                <input value={config.bgColor || ""} onChange={(e) => setField("bgColor", e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Cor do Texto</label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.textColor || "#ffffff"} onChange={(e) => setField("textColor", e.target.value)} className="h-9 w-9 rounded-lg border cursor-pointer" />
                <input value={config.textColor || ""} onChange={(e) => setField("textColor", e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Newsletter</h3>
              <button onClick={() => setField("showNewsletter", !config.showNewsletter)}
                className={cn("relative h-7 w-12 rounded-full transition-colors", config.showNewsletter ? "bg-green-500" : "bg-gray-300")}>
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", config.showNewsletter ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 text-xs font-semibold text-gray-600">Título</label>
                <input value={config.newsletterTitle || ""} onChange={(e) => setField("newsletterTitle", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Receba nossas novidades" />
              </div>
              <div>
                <label className="mb-1 text-xs font-semibold text-gray-600">Texto complementar</label>
                <input value={config.newsletterText || ""} onChange={(e) => setField("newsletterText", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Cadastre-se e ganhe 10% de desconto" />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "colunas" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Colunas do Rodapé</h2>
            <button onClick={addColumn} className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <FiPlus className="h-3.5 w-3.5" /> Adicionar Coluna
            </button>
          </div>

          {config.columns.length === 0 && <p className="text-center text-sm text-gray-400 py-6">Nenhuma coluna adicionada</p>}

          <div className="space-y-4">
            {config.columns.map((col, colIdx) => (
              <div key={colIdx} className="rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input value={col.title} onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-primary" placeholder="Título da Coluna" />
                  <button onClick={() => removeColumn(colIdx)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 pl-2">
                  {col.links.map((link, linkIdx) => (
                    <div key={linkIdx} className="flex items-center gap-2">
                      <input value={link.label} onChange={(e) => updateColumnLink(colIdx, linkIdx, "label", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary" placeholder="Texto" />
                      <input value={link.href} onChange={(e) => updateColumnLink(colIdx, linkIdx, "href", e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary" placeholder="/link" />
                      <button onClick={() => removeColumnLink(colIdx, linkIdx)} className="text-gray-300 hover:text-red-500"><FiTrash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => addColumnLink(colIdx)} className="text-xs font-medium text-primary hover:underline">+ Adicionar link</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "contato" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Informações de Contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">E-mail</label>
              <input value={config.contactEmail || ""} onChange={(e) => setField("contactEmail", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="contato@C7drop.com.br" />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Telefone</label>
              <input value={config.contactPhone || ""} onChange={(e) => setField("contactPhone", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="(62) 3333-3333" />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">WhatsApp</label>
              <input value={config.contactWhatsapp || ""} onChange={(e) => setField("contactWhatsapp", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="(62) 99999-9999" />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Endereço</label>
              <input value={config.contactAddress || ""} onChange={(e) => setField("contactAddress", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Rua Exemplo, 123 - São Paulo/SP" />
            </div>
          </div>
        </div>
      )}

      {tab === "social" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Redes Sociais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/C7drop" },
                { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/C7drop" },
                { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@C7drop" },
                { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@C7drop" },
                { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/C7drop" },
                { key: "twitter", label: "Twitter/X", placeholder: "https://x.com/C7drop" },
              ].map((s) => (
                <div key={s.key}>
                  <label className="mb-1.5 text-xs font-semibold text-gray-600">{s.label}</label>
                  <input value={config.socialLinks[s.key] || ""} onChange={(e) => setSocialLink(s.key, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder={s.placeholder} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Métodos de Pagamento (ícones no rodapé)</h2>
            <div className="flex flex-wrap gap-2">
              {allPaymentMethods.map((m) => (
                <button key={m.value} onClick={() => togglePayment(m.value)}
                  className={cn("rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                    config.paymentMethods.includes(m.value) ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
