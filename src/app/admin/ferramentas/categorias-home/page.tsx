"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiMove,
  FiImage, FiLayers, FiChevronUp, FiChevronDown, FiEye, FiEyeOff,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface HomeCategoryItem {
  id: string;
  categoryId: string | null;
  title: string;
  image: string | null;
  link: string | null;
  order: number;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

function useHomeCategories() {
  return useQuery({
    queryKey: ["admin-home-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/home-categories");
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<HomeCategoryItem[]>;
    },
  });
}

function useCategories() {
  return useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      return (data.categories || data) as Category[];
    },
  });
}

export default function CategoriasHomePage() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useHomeCategories();
  const { data: categories } = useCategories();
  const [editing, setEditing] = useState<HomeCategoryItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  const saveMut = useMutation({
    mutationFn: async (item: Partial<HomeCategoryItem> & { id?: string }) => {
      const url = item.id ? `/api/admin/home-categories/${item.id}` : "/api/admin/home-categories";
      const method = item.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-home-categories"] }); setEditing(null); setIsNew(false); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/home-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-home-categories"] }),
  });

  const handleNew = () => {
    setEditing({ id: "", categoryId: null, title: "", image: null, link: null, order: (items?.length || 0), active: true });
    setIsNew(true);
  };

  const handleCategorySelect = (catId: string) => {
    if (!editing) return;
    const cat = categories?.find((c) => c.id === catId);
    if (cat) {
      setEditing({ ...editing, categoryId: catId, title: editing.title || cat.name, link: `/produtos?categoria=${cat.slug}`, image: editing.image || cat.image });
    } else {
      setEditing({ ...editing, categoryId: null });
    }
  };

  const handleSave = () => {
    if (!editing) return;
    const payload: any = { title: editing.title, image: editing.image, link: editing.link, order: editing.order, active: editing.active, categoryId: editing.categoryId };
    if (!isNew) payload.id = editing.id;
    saveMut.mutate(payload);
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    if (!items) return;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    saveMut.mutate({ id: items[idx].id, order: items[swapIdx].order });
    saveMut.mutate({ id: items[swapIdx].id, order: items[idx].order });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias da Home</h1>
          <p className="mt-0.5 text-sm text-gray-500">Carousel de categorias exibido na página inicial</p>
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{isNew ? "Nova Categoria" : "Editar Categoria"}</h3>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-gray-400 hover:text-gray-600"><FiX className="h-4 w-4" /></button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Categoria (opcional)</label>
              <select value={editing.categoryId || ""} onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Personalizado (sem vínculo)</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Título *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Nome da categoria" />
            </div>
            <ImageUpload
              label="Imagem da Categoria"
              value={editing.image}
              onChange={(url) => setEditing({ ...editing, image: url })}
              aspectRatio="square"
              hint="Recomendado: 400x400px"
            />
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Link</label>
              <input value={editing.link || ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="/produtos?categoria=slug" />
              <p className="mt-0.5 text-[10px] text-gray-400">Auto-preenchido ao vincular categoria</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="rounded" />
              Ativo
            </label>
            <label className="text-xs font-medium text-gray-600">
              Ordem: <input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })}
                className="ml-1 w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm" />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} disabled={saveMut.isPending || !editing.title}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              <FiSave className="h-3.5 w-3.5" /> {saveMut.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {items && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className={cn("flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all", item.active ? "border-gray-100" : "border-gray-100 opacity-50")}>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(item.id, "up")} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><FiChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveItem(item.id, "down")} disabled={idx === items.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><FiChevronDown className="h-4 w-4" /></button>
              </div>

              {item.image ? (
                <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100"><FiImage className="h-5 w-5 text-gray-400" /></div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-400 truncate">{item.link || "Sem link"}</p>
              </div>

              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                {item.active ? "Ativo" : "Inativo"}
              </span>

              <div className="flex items-center gap-1.5">
                <button onClick={() => { setEditing(item); setIsNew(false); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary">
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { if (confirm("Excluir esta categoria?")) deleteMut.mutate(item.id); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && !editing && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FiLayers className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Nenhuma categoria adicionada</p>
          <p className="text-xs text-gray-400 mt-1">Adicione categorias para exibir no carousel da home</p>
        </div>
      )}
    </div>
  );
}
