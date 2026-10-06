"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  barcode: string | null;
  gtin: string | null;
  ncm: string | null;
  anatelHomologation: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
  stock: number;
  lowStockAlert: number;
  manageStock: boolean;
  featured: boolean;
  bestSeller: boolean;
  mostSearched: boolean;
  isNew: boolean;
  active: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  image: string | null;
  images: { id: string; url: string; alt: string | null; order: number; isPrimary: boolean }[];
  categories: { id: string; category: { id: string; name: string; slug: string } }[];
  categoryNames: string[];
  variants: { id: string; name: string; value: string; price: number | null; stock: number; sku: string | null; image: string | null; tier: string | null }[];
  _count: { reviews: number; orderItems: number; favorites: number };
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
}

interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const res = await fetch(`/api/admin/products?${params}`);
  if (!res.ok) throw new Error("Falha ao carregar produtos");
  return res.json();
}

export function useAdminProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["admin-products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 15_000,
  });
}

async function fetchProduct(id: string): Promise<{ product: AdminProduct }> {
  const res = await fetch(`/api/admin/products/${id}`);
  if (!res.ok) throw new Error("Falha ao carregar produto");
  return res.json();
}

export function useAdminProduct(id: string | null) {
  return useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar produto");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar produto");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir produto");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Erro ao excluir produtos");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

// ── Categories ──
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  children: { id: string; name: string; slug: string }[];
  featured: boolean;
  order: number;
  _count: { products: number };
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async (): Promise<{ categories: AdminCategory[] }> => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Falha ao carregar categorias");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar categoria");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar categoria");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir categoria");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
}

// ── AI Generation ──
export function useAiGenerate() {
  return useMutation({
    mutationFn: async (data: { type: string; productName: string; category?: string; keywords?: string }) => {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao gerar conteúdo");
      }
      return res.json() as Promise<{ text: string }>;
    },
  });
}
