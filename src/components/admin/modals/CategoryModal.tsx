"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FiX, FiSave, FiTrash2, FiLoader } from "react-icons/fi";
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type AdminCategory } from "@/hooks/use-admin-products";
import { ImageUpload } from "@/components/admin/ImageUpload";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  category?: AdminCategory | null;
}

export function CategoryModal({ open, onClose, category }: CategoryModalProps) {
  const isEdit = !!category;
  const { data: categoriesData } = useAdminCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [form, setForm] = useState({
    name: "", slug: "", description: "", image: "", icon: "", parentId: "", featured: false, order: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name, slug: category.slug, description: category.description || "",
        image: category.image || "", icon: category.icon || "",
        parentId: category.parentId || "", featured: category.featured, order: category.order,
      });
    } else {
      setForm({ name: "", slug: "", description: "", image: "", icon: "", parentId: "", featured: false, order: 0 });
    }
    setConfirmDelete(false);
  }, [category, open]);

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, ...(!isEdit && { slug: slugify(name) }) }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) return;
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: category!.id, ...form, parentId: form.parentId || null });
      } else {
        await createMut.mutateAsync({ ...form, parentId: form.parentId || null });
      }
      onClose();
    } catch {}
  };

  const handleDelete = async () => {
    if (!category) return;
    try {
      await deleteMut.mutateAsync(category.id);
      onClose();
    } catch {}
  };

  const isSaving = createMut.isPending || updateMut.isPending;
  const parentOptions = (categoriesData?.categories || []).filter((c) => c.id !== category?.id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar Categoria" : "Nova Categoria"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nome *</label>
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ex: Jogo de Cama" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Slug *</label>
              <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="jogo-de-cama" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Descrição da categoria..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload
              value={form.image || null}
              onChange={(url) => setForm((f) => ({ ...f, image: url || "" }))}
              label="Imagem"
              hint="Imagem de capa da categoria"
              aspectRatio="video"
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Ícone</label>
              <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="🛏️ ou nome do ícone" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Categoria Pai</label>
              <select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">Nenhuma (raiz)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Ordem</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm text-gray-700">Categoria destaque</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div>
            {isEdit && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500">Confirmar exclusão?</span>
                  <button onClick={handleDelete} disabled={deleteMut.isPending}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                    {deleteMut.isPending ? "Excluindo..." : "Sim, excluir"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  <FiTrash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSubmit} disabled={isSaving || !form.name || !form.slug}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              {isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>

        {/* Error */}
        {(createMut.error || updateMut.error || deleteMut.error) && (
          <div className="border-t border-red-100 bg-red-50 px-6 py-3">
            <p className="text-xs text-red-600">{(createMut.error || updateMut.error || deleteMut.error)?.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
