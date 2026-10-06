"use client";

import { useState, useEffect } from "react";
import { FiX, FiSave, FiTrash2, FiLoader } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/admin/ImageUpload";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface BrandModalProps {
  open: boolean;
  onClose: () => void;
  brand?: any | null;
}

export function BrandModal({ open, onClose, brand }: BrandModalProps) {
  const isEdit = !!brand;
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "", slug: "", image: "", description: "", active: true, order: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (brand) {
      setForm({
        name: brand.name, slug: brand.slug, image: brand.image || "",
        description: brand.description || "", active: brand.active ?? true, order: brand.order ?? 0,
      });
    } else {
      setForm({ name: "", slug: "", image: "", description: "", active: true, order: 0 });
    }
    setConfirmDelete(false);
  }, [brand, open]);

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, ...(!isEdit && { slug: slugify(name) }) }));
  };

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erro ao criar marca");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); qc.invalidateQueries({ queryKey: ["public-brands"] }); },
  });

  const updateMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/brands/${brand?.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erro ao atualizar marca");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); qc.invalidateQueries({ queryKey: ["public-brands"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/brands/${brand?.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir marca");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); qc.invalidateQueries({ queryKey: ["public-brands"] }); },
  });

  const handleSubmit = async () => {
    if (!form.name || !form.slug) return;
    try {
      if (isEdit) await updateMut.mutateAsync(form);
      else await createMut.mutateAsync(form);
      onClose();
    } catch {}
  };

  const handleDelete = async () => {
    try { await deleteMut.mutateAsync(); onClose(); } catch {}
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar Marca" : "Nova Marca"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome *</label>
            <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug *</label>
            <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Imagem / Logo</label>
            <ImageUpload value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url || "" }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Ordem</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              Ativa
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div>
            {isEdit && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700">
                <FiTrash2 className="h-4 w-4" /> Excluir
              </button>
            )}
            {isEdit && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Confirmar exclusão?</span>
                <button onClick={handleDelete} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600">Sim</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Não</button>
              </div>
            )}
          </div>
          <button onClick={handleSubmit} disabled={isSaving || !form.name || !form.slug}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {isSaving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
            {isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
