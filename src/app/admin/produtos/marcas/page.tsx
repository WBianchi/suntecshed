"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BrandModal } from "@/components/admin/modals/BrandModal";
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiSearch, FiX } from "react-icons/fi";
import Image from "next/image";

export default function AdminBrandsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const { data: brands = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditingBrand(null); setModalOpen(true); };
  const openEdit = (b: any) => { setEditingBrand(b); setModalOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="mt-0.5 text-sm text-gray-500">{brands.length} marcas cadastradas</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Nova Marca
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
        <FiSearch className="h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          placeholder="Buscar marcas..." />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          {search ? "Nenhuma marca encontrada." : "Nenhuma marca cadastrada. Clique em \"Nova Marca\" para começar."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((brand) => (
            <div key={brand.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-gray-100">
                  {brand.image ? (
                    <Image src={brand.image} alt={brand.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50">
                      <FiTag className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-gray-900">{brand.name}</h3>
                  <p className="text-xs text-gray-500">{brand._count?.products || 0} produtos</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${brand.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {brand.active ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>
              <button onClick={() => openEdit(brand)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100">
                <FiEdit2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <BrandModal open={modalOpen} onClose={() => setModalOpen(false)} brand={editingBrand} />
    </div>
  );
}
