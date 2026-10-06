"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSave, FiLoader, FiCheck, FiSearch, FiGlobe,
  FiImage, FiAlertCircle, FiCheckCircle, FiInfo,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface SeoSettings {
  id: string;
  page: string;
  title: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  favicon: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

const pages = [
  { value: "global", label: "Global (padrão do site)" },
  { value: "home", label: "Página Inicial" },
  { value: "products", label: "Loja / Produtos" },
  { value: "categories", label: "Categorias" },
  { value: "blog", label: "Blog" },
  { value: "about", label: "Sobre" },
  { value: "contact", label: "Contato" },
  { value: "cart", label: "Carrinho" },
  { value: "checkout", label: "Checkout" },
];

function useSeoSettings(page: string) {
  return useQuery({
    queryKey: ["admin-seo", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/seo?page=${page}`);
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<SeoSettings>;
    },
  });
}

function useAllSeo() {
  return useQuery({
    queryKey: ["admin-seo-all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo");
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<SeoSettings[]>;
    },
  });
}

function seoScore(seo: SeoSettings | null): { score: number; issues: string[]; tips: string[] } {
  if (!seo) return { score: 0, issues: ["Nenhuma configuração encontrada"], tips: [] };
  const issues: string[] = [];
  const tips: string[] = [];
  let score = 0;
  const total = 7;

  if (seo.title && seo.title.length > 10) score++;
  else issues.push("Título meta ausente ou muito curto (mín. 10 caracteres)");

  if (seo.title && seo.title.length > 60) tips.push("Título muito longo (ideal: 50-60 caracteres)");

  if (seo.metaDescription && seo.metaDescription.length > 50) score++;
  else issues.push("Meta description ausente ou muito curta (mín. 50 caracteres)");

  if (seo.metaDescription && seo.metaDescription.length > 160) tips.push("Meta description muito longa (ideal: 120-160 caracteres)");

  if (seo.metaKeywords && seo.metaKeywords.length > 5) score++;
  else issues.push("Meta keywords ausentes");

  if (seo.ogTitle) score++;
  else issues.push("Open Graph título ausente");

  if (seo.ogDescription) score++;
  else issues.push("Open Graph descrição ausente");

  if (seo.ogImage) score++;
  else issues.push("Open Graph imagem ausente (importante para compartilhamento)");

  if (seo.favicon) score++;
  else if (seo.page === "global") issues.push("Favicon não configurado");
  else score++; // não obrigatório para páginas específicas

  return { score: Math.round((score / total) * 100), issues, tips };
}

export default function SeoPage() {
  const qc = useQueryClient();
  const [selectedPage, setSelectedPage] = useState("global");
  const { data: seo, isLoading } = useSeoSettings(selectedPage);
  const { data: allSeo } = useAllSeo();
  const [form, setForm] = useState<SeoSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (seo) setForm(seo);
  }, [seo]);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/seo", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-seo"] });
      qc.invalidateQueries({ queryKey: ["admin-seo-all"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    if (!form) return;
    saveMut.mutate({
      page: form.page, title: form.title, metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords, favicon: form.favicon, ogImage: form.ogImage,
      ogTitle: form.ogTitle, ogDescription: form.ogDescription,
    });
  };

  const setField = (key: string, value: any) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
    setSaved(false);
  };

  const scoreData = seoScore(form);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO</h1>
          <p className="mt-0.5 text-sm text-gray-500">Otimize o SEO de cada página do site</p>
        </div>
        <button onClick={handleSave} disabled={saveMut.isPending}
          className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
            saved ? "bg-green-500" : "bg-primary hover:bg-primary/90", saveMut.isPending && "opacity-50")}>
          {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : saved ? <FiCheck className="h-4 w-4" /> : <FiSave className="h-4 w-4" />}
          {saveMut.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Page Selector */}
      <div className="flex flex-wrap gap-2">
        {pages.map((p) => {
          const pageSeo = allSeo?.find((s) => s.page === p.value);
          const hasData = pageSeo && (pageSeo.title || pageSeo.metaDescription);
          return (
            <button key={p.value} onClick={() => { setSelectedPage(p.value); setSaved(false); }}
              className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                selectedPage === p.value ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
              {hasData ? <FiCheckCircle className="h-3 w-3 text-green-500" /> : <FiAlertCircle className="h-3 w-3 text-gray-300" />}
              {p.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {form && (
        <div className="grid gap-6 xl:grid-cols-3">
          {/* SEO Form */}
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Meta Tags</h2>
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>Meta Título</span>
                  <span className={cn("text-[10px]", (form.title?.length || 0) > 60 ? "text-red-500" : "text-gray-400")}>{form.title?.length || 0}/60</span>
                </label>
                <input value={form.title || ""} onChange={(e) => setField("title", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Suntecshed | Atacado e Dropshipping" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>Meta Descrição</span>
                  <span className={cn("text-[10px]", (form.metaDescription?.length || 0) > 160 ? "text-red-500" : "text-gray-400")}>{form.metaDescription?.length || 0}/160</span>
                </label>
                <textarea value={form.metaDescription || ""} onChange={(e) => setField("metaDescription", e.target.value)} rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Fornecedor de eletrônicos para atacado e dropshipping..." />
              </div>
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Meta Keywords</label>
                <input value={form.metaKeywords || ""} onChange={(e) => setField("metaKeywords", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="eletrônicos, dropshipping, atacado, acessórios" />
                <p className="mt-0.5 text-[10px] text-gray-400">Separar por vírgula</p>
              </div>

              {selectedPage === "global" && (
                <ImageUpload label="Favicon" value={form.favicon} onChange={(url) => setField("favicon", url)} aspectRatio="square" hint="ICO, PNG ou SVG — 32x32 ou 64x64px" />
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Open Graph (compartilhamento social)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 text-xs font-semibold text-gray-600">OG Título</label>
                  <input value={form.ogTitle || ""} onChange={(e) => setField("ogTitle", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Suntecshed" />
                </div>
                <ImageUpload label="OG Imagem" value={form.ogImage} onChange={(url) => setField("ogImage", url)} aspectRatio="video" hint="Recomendado: 1200x630px" />
                <div className="sm:col-span-2">
                  <label className="mb-1.5 text-xs font-semibold text-gray-600">OG Descrição</label>
                  <textarea value={form.ogDescription || ""} onChange={(e) => setField("ogDescription", e.target.value)} rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Encontre os melhores eletrônicos com o melhor preço." />
                </div>
              </div>

              {/* OG Preview */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  {form.ogImage ? (
                    <img src={form.ogImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FiImage className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div className="p-3 bg-white">
                  <p className="text-xs font-bold text-gray-900 truncate">{form.ogTitle || form.title || "Título OG"}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{form.ogDescription || form.metaDescription || "Descrição OG"}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Suntecshed.com.br</p>
                </div>
              </div>
            </div>

            {/* Robots & Sitemap Info */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Sitemap & Robots</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
                  <FiInfo className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Sitemap automático</p>
                    <p className="text-[10px] text-blue-600">O Next.js gera automaticamente o sitemap em <code className="bg-blue-100 px-1 rounded">/sitemap.xml</code>. Inclui todas as páginas, produtos e categorias.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
                  <FiInfo className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Robots.txt</p>
                    <p className="text-[10px] text-blue-600">O arquivo <code className="bg-blue-100 px-1 rounded">/robots.txt</code> é gerado automaticamente permitindo indexação de todas as páginas públicas e bloqueando <code>/admin</code>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Score Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
              <div className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold",
                scoreData.score >= 80 ? "bg-green-100 text-green-600" : scoreData.score >= 50 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600")}>
                {scoreData.score}%
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">SEO Score</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pages.find((p) => p.value === selectedPage)?.label}
              </p>
            </div>

            {scoreData.issues.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-2">
                <h3 className="text-xs font-bold text-red-600">Problemas ({scoreData.issues.length})</h3>
                {scoreData.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <FiAlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600">{issue}</p>
                  </div>
                ))}
              </div>
            )}

            {scoreData.tips.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-2">
                <h3 className="text-xs font-bold text-yellow-600">Dicas</h3>
                {scoreData.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <FiInfo className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Google Preview */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-2">
              <h3 className="text-xs font-bold text-gray-700">Preview no Google</h3>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-blue-700 truncate">{form.title || "Título da Página"}</p>
                <p className="text-xs text-green-700">Suntecshed.com.br</p>
                <p className="text-xs text-gray-600 line-clamp-2">{form.metaDescription || "Meta description da página aparecerá aqui nos resultados de busca."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
