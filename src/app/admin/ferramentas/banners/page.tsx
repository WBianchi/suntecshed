"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiImage,
  FiChevronUp, FiChevronDown, FiEye, FiEyeOff, FiCopy,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Banner {
  id: string;
  position: string;
  bgImage: string | null;
  bgImageMobile: string | null;
  bgColor: string | null;
  overlayImage: string | null;
  overlayPosition: string;
  badge: string | null;
  title: string | null;
  paragraph: string | null;
  button1Text: string | null;
  button1Link: string | null;
  button1Font: string | null;
  button1Color: string | null;
  button1TextColor: string | null;
  button2Text: string | null;
  button2Link: string | null;
  button2Font: string | null;
  button2Color: string | null;
  button2TextColor: string | null;
  titleSize: string | null;
  paragraphSize: string | null;
  titleFont: string | null;
  paragraphFont: string | null;
  itemsPosition: string;
  effect: string | null;
  transition: string | null;
  animation: string | null;
  order: number;
  active: boolean;
}

const emptyBanner: Omit<Banner, "id"> & { id: string } = {
  id: "", position: "HERO", bgImage: null, bgImageMobile: null, bgColor: "#1a1a1a", overlayImage: null,
  overlayPosition: "RIGHT", badge: null, title: null, paragraph: null,
  button1Text: null, button1Link: null, button1Font: null, button1Color: "#e11d48", button1TextColor: "#ffffff",
  button2Text: null, button2Link: null, button2Font: null, button2Color: "transparent", button2TextColor: "#ffffff",
  titleSize: "text-4xl", paragraphSize: "text-base", titleFont: "font-bold", paragraphFont: "font-normal",
  itemsPosition: "LEFT", effect: "fade", transition: "500ms", animation: "slideUp", order: 0, active: true,
};

const positions = [
  { value: "HERO", label: "Hero (principal)" }, { value: "HIGHLIGHT", label: "Destaque" },
  { value: "CENTRAL", label: "Central" }, { value: "SIDEBAR", label: "Sidebar" },
];
const alignments = [{ value: "LEFT", label: "Esquerda" }, { value: "CENTER", label: "Centro" }, { value: "RIGHT", label: "Direita" }];
const effects = [
  { value: "fade", label: "Fade" }, { value: "zoom", label: "Zoom" },
  { value: "slide", label: "Slide" }, { value: "none", label: "Nenhum" },
];
const animations = [
  { value: "slideUp", label: "Slide Up" }, { value: "slideLeft", label: "Slide Left" },
  { value: "fadeIn", label: "Fade In" }, { value: "scaleUp", label: "Scale Up" }, { value: "none", label: "Nenhuma" },
];
const titleSizes = [
  { value: "text-2xl", label: "2XL" }, { value: "text-3xl", label: "3XL" },
  { value: "text-4xl", label: "4XL" }, { value: "text-5xl", label: "5XL" }, { value: "text-6xl", label: "6XL" },
];

function useBanners() {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/banners");
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<Banner[]>;
    },
  });
}

export default function BannersPage() {
  const qc = useQueryClient();
  const { data: banners, isLoading } = useBanners();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [tab, setTab] = useState<"content" | "style" | "buttons">("content");

  const saveMut = useMutation({
    mutationFn: async (banner: any) => {
      const { id, ...data } = banner;
      const url = id ? `/api/admin/banners/${id}` : "/api/admin/banners";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); setEditing(null); setIsNew(false); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const handleNew = () => {
    setEditing({ ...emptyBanner, order: banners?.length || 0 });
    setIsNew(true);
    setTab("content");
  };

  const handleSave = () => {
    if (!editing) return;
    const { id, ...data } = editing;
    saveMut.mutate(isNew ? data : { id, ...data });
  };

  const setField = (key: string, value: any) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const SelectField = ({ label, field, options }: { label: string; field: string; options: { value: string; label: string }[] }) => (
    <div>
      <label className="mb-1 text-[11px] font-semibold text-gray-500">{label}</label>
      <select value={(editing as any)?.[field] || ""} onChange={(e) => setField(field, e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const TextField = ({ label, field, placeholder }: { label: string; field: string; placeholder?: string }) => (
    <div>
      <label className="mb-1 text-[11px] font-semibold text-gray-500">{label}</label>
      <input type="text" value={(editing as any)?.[field] || ""} onChange={(e) => setField(field, e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder={placeholder} />
    </div>
  );

  const ColorField = ({ label, field }: { label: string; field: string }) => (
    <div>
      <label className="mb-1 text-[11px] font-semibold text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={(editing as any)?.[field] || "#000000"} onChange={(e) => setField(field, e.target.value)}
          className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer" />
        <input type="text" value={(editing as any)?.[field] || ""} onChange={(e) => setField(field, e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-primary" placeholder="#000000" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gerencie os banners do hero e destaques do site</p>
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Novo Banner
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Edit Panel */}
      {editing && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">{isNew ? "Novo Banner" : "Editar Banner"}</h3>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-gray-400 hover:text-gray-600"><FiX className="h-4 w-4" /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6">
            {(["content", "style", "buttons"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-4 py-3 text-xs font-semibold border-b-2 transition-all",
                  tab === t ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600")}>
                {t === "content" ? "Conteúdo" : t === "style" ? "Estilo & Layout" : "Botões"}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === "content" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Posição" field="position" options={positions} />
                <TextField label="Badge" field="badge" placeholder="PROMOÇÃO" />
                <div className="sm:col-span-2">
                  <TextField label="Título" field="title" placeholder="Título do banner" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 text-[11px] font-semibold text-gray-500">Descrição</label>
                  <textarea value={editing.paragraph || ""} onChange={(e) => setField("paragraph", e.target.value)} rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Descrição do banner" />
                </div>
                <ImageUpload label="Imagem de Fundo (Desktop)" value={editing.bgImage} onChange={(url) => setField("bgImage", url)} aspectRatio="banner" hint="Recomendado: 1920x600px — otimizada automaticamente ao enviar" />
                <ImageUpload label="Imagem de Fundo (Mobile)" value={editing.bgImageMobile} onChange={(url) => setField("bgImageMobile", url)} aspectRatio="square" hint="Recomendado: 800x1000px (vertical) — se não enviar, usa a de desktop" />
                <ImageUpload label="Imagem Overlay (direita/esquerda)" value={editing.overlayImage} onChange={(url) => setField("overlayImage", url)} aspectRatio="square" hint="Produto ou elemento flutuante" />
                <SelectField label="Posição Overlay" field="overlayPosition" options={alignments} />
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mt-4">
                    <input type="checkbox" checked={editing.active} onChange={(e) => setField("active", e.target.checked)} className="rounded" />
                    Banner Ativo
                  </label>
                </div>
              </div>
            )}

            {tab === "style" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="Cor de Fundo" field="bgColor" />
                <SelectField label="Posição dos Elementos" field="itemsPosition" options={alignments} />
                <SelectField label="Tamanho do Título" field="titleSize" options={titleSizes} />
                <TextField label="Font Título" field="titleFont" placeholder="font-bold" />
                <TextField label="Font Parágrafo" field="paragraphFont" placeholder="font-normal" />
                <TextField label="Tamanho Parágrafo" field="paragraphSize" placeholder="text-base" />
                <SelectField label="Efeito" field="effect" options={effects} />
                <SelectField label="Animação" field="animation" options={animations} />
                <TextField label="Transição (duração)" field="transition" placeholder="500ms" />
                <TextField label="Ordem" field="order" placeholder="0" />
              </div>
            )}

            {tab === "buttons" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 mb-3">Botão 1 (Principal)</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Texto" field="button1Text" placeholder="Comprar Agora" />
                    <TextField label="Link" field="button1Link" placeholder="/produtos" />
                    <ColorField label="Cor do Botão" field="button1Color" />
                    <ColorField label="Cor do Texto" field="button1TextColor" />
                    <TextField label="Font" field="button1Font" placeholder="font-bold" />
                  </div>
                </div>
                <hr />
                <div>
                  <h4 className="text-xs font-bold text-gray-700 mb-3">Botão 2 (Secundário)</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Texto" field="button2Text" placeholder="Ver Coleção" />
                    <TextField label="Link" field="button2Link" placeholder="/colecao" />
                    <ColorField label="Cor do Botão" field="button2Color" />
                    <ColorField label="Cor do Texto" field="button2TextColor" />
                    <TextField label="Font" field="button2Font" placeholder="font-medium" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {editing.bgImage && (
            <div className="mx-6 mb-4 rounded-xl overflow-hidden border border-gray-100" style={{ height: 160 }}>
              <div className="relative h-full w-full" style={{ backgroundColor: editing.bgColor || "#1a1a1a" }}>
                <img src={editing.bgImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                <div className={cn("absolute inset-0 flex flex-col justify-center p-6", editing.itemsPosition === "CENTER" ? "items-center text-center" : editing.itemsPosition === "RIGHT" ? "items-end text-right" : "items-start")}>
                  {editing.badge && <span className="mb-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white">{editing.badge}</span>}
                  {editing.title && <h3 className="text-lg font-bold text-white">{editing.title}</h3>}
                  {editing.paragraph && <p className="text-[10px] text-white/80 max-w-xs">{editing.paragraph}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} disabled={saveMut.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              <FiSave className="h-3.5 w-3.5" /> {saveMut.isPending ? "Salvando..." : "Salvar Banner"}
            </button>
          </div>
        </div>
      )}

      {/* Banners List */}
      {banners && banners.length > 0 && (
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b.id} className={cn("flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all", b.active ? "border-gray-100" : "border-gray-100 opacity-50")}>
              {b.bgImage ? (
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: b.bgColor || "#1a1a1a" }}>
                  <img src={b.bgImage} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: b.bgColor || "#f3f4f6" }}>
                  <FiImage className="h-5 w-5 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{b.title || "Sem título"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{b.position}</span>
                  {b.badge && <span className="text-[10px] text-gray-400">{b.badge}</span>}
                  <span className="text-[10px] text-gray-400">Ordem: {b.order}</span>
                </div>
              </div>

              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                {b.active ? "Ativo" : "Inativo"}
              </span>

              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(b); setIsNew(false); setTab("content"); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary"><FiEdit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (confirm("Excluir este banner?")) deleteMut.mutate(b.id); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><FiTrash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {banners && banners.length === 0 && !editing && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FiImage className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Nenhum banner criado</p>
          <p className="text-xs text-gray-400 mt-1">Crie banners para o hero e destaques do site</p>
        </div>
      )}
    </div>
  );
}
