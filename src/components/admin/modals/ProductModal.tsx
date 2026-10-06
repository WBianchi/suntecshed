"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  FiX, FiSave, FiTrash2, FiLoader, FiPlus, FiImage, FiZap, FiUploadCloud,
  FiChevronRight, FiPackage, FiDollarSign, FiBox, FiSearch,
  FiTag, FiSettings, FiGrid, FiStar,
} from "react-icons/fi";
import {
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  useAdminCategories, useAdminProduct, useAiGenerate, type AdminProduct,
} from "@/hooks/use-admin-products";
import { useQuery } from "@tanstack/react-query";
import { FiLink } from "react-icons/fi";
import { RichTextEditor } from "@/components/admin/ui/RichTextEditor";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function toBRLMask(val: string): string {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  const cents = parseInt(num, 10);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fromBRLMask(masked: string): string {
  const clean = masked.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? "" : String(num);
}

interface Variant {
  name: string;
  value: string;
  price: string;
  stock: string;
  sku: string;
  image: string;
  tier: string; // "" | "DROPSHIPPING" | "ATACADO" | "GRUPO_VIP" — eixo de preço por tier de compra, separado do atributo real (cor/tamanho)
}

interface ImageItem {
  url: string;
  alt: string;
}

const emptyVariant: Variant = { name: "", value: "", price: "", stock: "", sku: "", image: "", tier: "" };

const tabs = [
  { id: "general", label: "Geral", icon: FiPackage },
  { id: "pricing", label: "Preço / Estoque", icon: FiDollarSign },
  { id: "shipping", label: "Envio", icon: FiBox },
  { id: "images", label: "Imagens", icon: FiImage },
  { id: "variants", label: "Variações", icon: FiGrid },
  { id: "links", label: "Vínculos", icon: FiLink },
  { id: "seo", label: "SEO", icon: FiSearch },
  { id: "flags", label: "Flags", icon: FiStar },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: AdminProduct | null;
}

export function ProductModal({ open, onClose, product }: ProductModalProps) {
  const isEdit = !!product;
  const { data: categoriesData } = useAdminCategories();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const aiGenerate = useAiGenerate();

  // Fetch complete product data on edit (list data only has 1 image for performance)
  const { data: fullProductData, isLoading: isLoadingFull } = useAdminProduct(
    isEdit && open ? product.id : null
  );
  const fullProduct = fullProductData?.product;

  const [tab, setTab] = useState<TabId>("general");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Form State ──
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "",
    sku: "", gtin: "", ncm: "", anatelHomologation: "",
    price: "", compareAtPrice: "", costPrice: "",
    weight: "", width: "", height: "", length: "",
    stock: "0", lowStockAlert: "5", manageStock: true,
    featured: false, bestSeller: false, mostSearched: false, isNew: false, active: true,
    seoTitle: "", seoDescription: "", seoKeywords: "", seoImage: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [uploading, setUploading] = useState(false);
  const [brandId, setBrandId] = useState("");
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const [buyTogetherIds, setBuyTogetherIds] = useState<string[]>([]);

  // Fetch brands and all products for linking
  const { data: brandsData } = useQuery<any[]>({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });
  const { data: allProductsData } = useQuery({
    queryKey: ["admin-products-for-link"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=200");
      if (!res.ok) return { products: [] };
      return res.json();
    },
    enabled: open,
  });
  const allProducts = (allProductsData?.products || []).filter((p: any) => p.id !== product?.id);
  const brands = brandsData || [];

  // ── Populate on edit ──
  useEffect(() => {
    // When editing, use fullProduct (from API) once loaded; fall back to list product while loading
    const source = isEdit ? (fullProduct || product) : null;

    if (source) {
      setForm({
        name: source.name, slug: source.slug,
        shortDescription: source.shortDescription || "",
        description: source.description || "",
        sku: source.sku || "",
        gtin: source.gtin || "", ncm: source.ncm || "",
        anatelHomologation: source.anatelHomologation || "",
        price: String(source.price), compareAtPrice: source.compareAtPrice ? String(source.compareAtPrice) : "",
        costPrice: source.costPrice ? String(source.costPrice) : "",
        weight: source.weight ? String(source.weight) : "",
        width: source.width ? String(source.width) : "",
        height: source.height ? String(source.height) : "",
        length: source.length ? String(source.length) : "",
        stock: String(source.stock), lowStockAlert: String(source.lowStockAlert),
        manageStock: source.manageStock,
        featured: source.featured, bestSeller: source.bestSeller,
        mostSearched: (source as any).mostSearched ?? false,
        isNew: source.isNew, active: source.active,
        seoTitle: source.seoTitle || "", seoDescription: source.seoDescription || "",
        seoKeywords: source.seoKeywords || "", seoImage: (source as any).seoImage || "",
      });
      setSelectedCategories(source.categories.map((c: any) => c.category.id));
      setImages(source.images.map((img: any) => ({ url: img.url, alt: img.alt || "" })));
      setVariants(source.variants.map((v: any) => ({
        name: v.name, value: v.value,
        price: v.price ? String(v.price) : "",
        stock: String(v.stock), sku: v.sku || "", image: v.image || "",
        tier: v.tier || "",
      })));
      setBrandId((source as any).brandId || (source as any).brand?.id || "");
      setRelatedProductIds((source as any).relatedTo?.map((r: any) => r.relatedId) || []);
      setBuyTogetherIds((source as any).buyTogetherTo?.map((r: any) => r.togetherId) || []);
    } else {
      setForm({
        name: "", slug: "", shortDescription: "", description: "",
        sku: "", gtin: "", ncm: "", anatelHomologation: "",
        price: "", compareAtPrice: "", costPrice: "",
        weight: "", width: "", height: "", length: "",
        stock: "0", lowStockAlert: "5", manageStock: true,
        featured: false, bestSeller: false, mostSearched: false, isNew: false, active: true,
        seoTitle: "", seoDescription: "", seoKeywords: "", seoImage: "",
      });
      setSelectedCategories([]);
      setImages([]);
      setVariants([]);
      setBrandId("");
      setRelatedProductIds([]);
      setBuyTogetherIds([]);
    }
    setTab("general");
    setConfirmDelete(false);
  }, [product, fullProduct, open, isEdit]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, ...(!isEdit && { slug: slugify(name) }) }));
  };

  // ── AI Generate ──
  const handleAiGenerate = async (type: string) => {
    const catNames = selectedCategories
      .map((id) => categoriesData?.categories.find((c) => c.id === id)?.name)
      .filter(Boolean).join(", ");
    try {
      const result = await aiGenerate.mutateAsync({
        type, productName: form.name, category: catNames, keywords: form.seoKeywords,
      });
      if (type === "title") set("name", result.text);
      else if (type === "shortDescription") set("shortDescription", result.text);
      else if (type === "description") set("description", result.text);
      else if (type === "seoTitle") set("seoTitle", result.text);
      else if (type === "seoDescription") set("seoDescription", result.text);
    } catch {}
  };

  // ── Images (file upload) ──
  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Erro no upload"); return; }
      const data = await res.json();
      const newImgs: ImageItem[] = data.files.map((f: any) => ({ url: f.url, alt: form.name }));
      setImages((prev) => [...prev, ...newImgs]);
    } catch { alert("Erro ao enviar imagens"); }
    finally { setUploading(false); }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadSeoImage = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", Array.from(files)[0]);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) return;
      const data = await res.json();
      set("seoImage", data.files[0].url);
    } catch {}
    finally { setUploading(false); }
  };

  // ── Variants ──
  const addVariant = () => setVariants((prev) => [...prev, { ...emptyVariant }]);
  const updateVariant = (idx: number, key: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  };
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  // ── Categories toggle ──
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price) return;
    const payload = {
      ...form,
      categoryIds: selectedCategories,
      images: images.length > 0 ? images : undefined,
      variants: variants.filter((v) => v.name && v.value),
      brandId: brandId || null,
      relatedProductIds,
      buyTogetherIds,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: product!.id, ...payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch {}
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteMut.mutateAsync(product.id);
      onClose();
    } catch {}
  };

  const isSaving = createMut.isPending || updateMut.isPending;
  const categories = categoriesData?.categories || [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar Produto" : "Novo Produto"}</h2>
            {isEdit && <p className="text-xs text-gray-400">ID: {product!.id}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Loading overlay for full product fetch */}
        {isEdit && isLoadingFull && (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">Carregando dados do produto...</span>
          </div>
        )}

        {/* Tabs */}
        {(!isEdit || !isLoadingFull) && (
          <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-6">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition-all",
                  tab === t.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
                )}>
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {(!isEdit || !isLoadingFull) && (
          <div className="max-h-[55vh] overflow-y-auto p-6">
            {/* ── GENERAL TAB ── */}
            {tab === "general" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-600">Nome *</label>
                      <button onClick={() => handleAiGenerate("title")} disabled={!form.name || aiGenerate.isPending}
                        className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
                        <FiZap className="h-3 w-3" /> {aiGenerate.isPending ? "Gerando..." : "Gerar com IA"}
                      </button>
                    </div>
                    <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Nome do produto" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Slug *</label>
                    <input value={form.slug} onChange={(e) => set("slug", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="nome-do-produto" />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Descrição Curta</label>
                    <button onClick={() => handleAiGenerate("shortDescription")} disabled={!form.name || aiGenerate.isPending}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
                      <FiZap className="h-3 w-3" /> Gerar com IA
                    </button>
                  </div>
                  <textarea value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)}
                    rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Breve descrição do produto..." />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Descrição Completa</label>
                    <button onClick={() => handleAiGenerate("description")} disabled={!form.name || aiGenerate.isPending}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
                      <FiZap className="h-3 w-3" /> Gerar com IA
                    </button>
                  </div>
                  <RichTextEditor
                    value={form.description}
                    onChange={(html) => set("description", html)}
                    placeholder="Descrição detalhada do produto (suporta HTML)..."
                    minHeight="180px"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">SKU</label>
                    <input value={form.sku} onChange={(e) => set("sku", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="HE-001" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Homologação Anatel</label>
                    <input value={form.anatelHomologation} onChange={(e) => set("anatelHomologation", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0000-00-0000" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">GTIN</label>
                    <input value={form.gtin} onChange={(e) => set("gtin", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="GTIN/EAN" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">NCM</label>
                    <input value={form.ncm} onChange={(e) => set("ncm", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="6302.10.00" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-600">Categorias</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          selectedCategories.includes(cat.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        )}>
                        {cat.name}
                      </button>
                    ))}
                    {categories.length === 0 && <p className="text-xs text-gray-400">Nenhuma categoria cadastrada</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── PRICING TAB ── */}
            {tab === "pricing" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Preço *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                      <input value={form.price ? toBRLMask(String(Math.round(parseFloat(form.price) * 100))) : ""}
                        onChange={(e) => set("price", fromBRLMask(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="0,00" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Preço Comparativo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                      <input value={form.compareAtPrice ? toBRLMask(String(Math.round(parseFloat(form.compareAtPrice) * 100))) : ""}
                        onChange={(e) => set("compareAtPrice", fromBRLMask(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="0,00" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Preço de Custo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                      <input value={form.costPrice ? toBRLMask(String(Math.round(parseFloat(form.costPrice) * 100))) : ""}
                        onChange={(e) => set("costPrice", fromBRLMask(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="0,00" />
                    </div>
                  </div>
                </div>

                {form.price && form.costPrice && (
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs text-green-700">
                      <strong>Margem de lucro:</strong>{" "}
                      {(((parseFloat(form.price) - parseFloat(form.costPrice)) / parseFloat(form.price)) * 100).toFixed(1)}%
                      ({formatBRL(parseFloat(form.price) - parseFloat(form.costPrice))} por unidade)
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Estoque</h3>
                  <label className="mb-3 flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.manageStock} onChange={(e) => set("manageStock", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary" />
                    <span className="text-sm text-gray-700">Controlar estoque</span>
                  </label>
                  {form.manageStock && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Quantidade em Estoque</label>
                        <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Alerta de Estoque Baixo</label>
                        <input type="number" value={form.lowStockAlert} onChange={(e) => set("lowStockAlert", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SHIPPING TAB ── */}
            {tab === "shipping" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Informações para cálculo de frete</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Peso (g)</label>
                    <input type="number" step="0.1" value={form.weight} onChange={(e) => set("weight", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Altura (cm)</label>
                    <input type="number" step="0.1" value={form.height} onChange={(e) => set("height", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Largura (cm)</label>
                    <input type="number" step="0.1" value={form.width} onChange={(e) => set("width", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Comprimento (cm)</label>
                    <input type="number" step="0.1" value={form.length} onChange={(e) => set("length", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0" />
                  </div>
                </div>
              </div>
            )}

            {/* ── IMAGES TAB ── */}
            {tab === "images" && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.02]"
                  onClick={() => document.getElementById("product-img-input")?.click()}
                >
                  <input id="product-img-input" type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                  {uploading ? (
                    <FiLoader className="mx-auto h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <FiUploadCloud className="mx-auto h-8 w-8 text-gray-300" />
                  )}
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    {uploading ? "Enviando..." : "Clique ou arraste imagens aqui"}
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF — máx. 5MB cada</p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((img, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-200">
                        <img src={img.url} alt={img.alt} className="aspect-square w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                        {i === 0 && (
                          <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">Principal</span>
                        )}
                        <button onClick={() => removeImage(i)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <FiX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── VARIANTS TAB ── */}
            {tab === "variants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Ex: Atributo=Cor, Valor=Azul, Vermelho, Preto</p>
                  <button onClick={addVariant}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                    <FiPlus className="h-3.5 w-3.5" /> Adicionar Variação
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                    <FiGrid className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-400">Sem variações</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variants.map((v, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">Variação #{i + 1}</span>
                          <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600">
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">Atributo *</label>
                            <input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-primary"
                              placeholder="Cor, Tamanho..." />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">Tier de Compra</label>
                            <select value={v.tier} onChange={(e) => updateVariant(i, "tier", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-primary">
                              <option value="">Nenhum</option>
                              <option value="DROPSHIPPING">Dropshipping</option>
                              <option value="ATACADO">Atacado</option>
                              <option value="GRUPO_VIP">Grupo Vip</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">Valor *</label>
                            <input value={v.value} onChange={(e) => updateVariant(i, "value", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-primary"
                              placeholder="Azul, Vermelho, Preto..." />
                            <p className="mt-0.5 text-[9px] text-gray-400">Separe por vírgula p/ múltiplos</p>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">Preço</label>
                            <input type="number" step="0.01" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-primary"
                              placeholder="Preço variação" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">Estoque</label>
                            <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-primary"
                              placeholder="0" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">SKU</label>
                            <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-primary"
                              placeholder="SKU variação" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-gray-500">Imagem</label>
                            {v.image ? (
                              <div className="group relative h-9 w-9 overflow-hidden rounded-lg border border-gray-200">
                                <img src={v.image} alt="" className="h-full w-full object-cover" />
                                <button onClick={() => updateVariant(i, "image", "")}
                                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100">
                                  <FiX className="h-3 w-3 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-2 text-xs text-gray-400 hover:border-primary hover:text-primary">
                                <FiUploadCloud className="mr-1 h-3 w-3" /> Upload
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("files", file);
                                  try {
                                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                                    if (res.ok) {
                                      const data = await res.json();
                                      if (data.files?.[0]?.url) updateVariant(i, "image", data.files[0].url);
                                    }
                                  } catch {}
                                  e.target.value = "";
                                }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SEO TAB ── */}
            {tab === "seo" && (
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Título SEO</label>
                    <button onClick={() => handleAiGenerate("seoTitle")} disabled={!form.name || aiGenerate.isPending}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
                      <FiZap className="h-3 w-3" /> Gerar com IA
                    </button>
                  </div>
                  <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Título para mecanismos de busca" />
                  <p className="mt-1 text-[10px] text-gray-400">{form.seoTitle.length}/60 caracteres</p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Descrição SEO</label>
                    <button onClick={() => handleAiGenerate("seoDescription")} disabled={!form.name || aiGenerate.isPending}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
                      <FiZap className="h-3 w-3" /> Gerar com IA
                    </button>
                  </div>
                  <textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)}
                    rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Descrição para mecanismos de busca" />
                  <p className="mt-1 text-[10px] text-gray-400">{form.seoDescription.length}/155 caracteres</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Tags / Palavras-chave SEO</label>
                  <input value={form.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="eletrônico, bluetooth, premium (separar por vírgula)" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Imagem SEO / Open Graph</label>
                  {form.seoImage ? (
                    <div className="group relative inline-block">
                      <img src={form.seoImage} alt="SEO" className="h-24 w-40 rounded-xl border border-gray-200 object-cover" />
                      <button onClick={() => set("seoImage", "")} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"><FiX className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="inline-block">
                      <button onClick={() => document.getElementById("seo-img-input")?.click()} disabled={uploading}
                        className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-xs font-medium text-gray-500 hover:border-primary/40 hover:text-primary disabled:opacity-50">
                        <FiUploadCloud className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar imagem OG"}
                      </button>
                      <input id="seo-img-input" type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) uploadSeoImage(e.target.files); e.target.value = ""; }} />
                    </div>
                  )}
                </div>

                {/* SEO Preview */}
                {(form.seoTitle || form.name) && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400">Preview do Google</p>
                    <div className="mt-2">
                      <p className="text-lg text-blue-700 hover:underline">{form.seoTitle || form.name}</p>
                      <p className="text-sm text-green-700">Suntecshed.com.br/produto/{form.slug}</p>
                      <p className="mt-0.5 text-sm text-gray-600">{form.seoDescription || form.shortDescription || "Descrição do produto..."}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── LINKS TAB ── */}
            {tab === "links" && (
              <div className="space-y-6">
                {/* Brand */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Marca</label>
                  <select value={brandId} onChange={(e) => setBrandId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary">
                    <option value="">Sem marca</option>
                    {brands.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Related Products */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Produtos Relacionados <span className="text-xs text-gray-400">({relatedProductIds.length})</span>
                  </label>
                  <p className="mb-2 text-xs text-gray-500">Produtos sugeridos na single do produto</p>
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2">
                    {allProducts.map((p: any) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                        <input type="checkbox" checked={relatedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setRelatedProductIds((prev) => [...prev, p.id]);
                            else setRelatedProductIds((prev) => prev.filter((id) => id !== p.id));
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary" />
                        <span className="truncate text-xs text-gray-700">{p.name}</span>
                      </label>
                    ))}
                    {allProducts.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Nenhum produto disponível</p>}
                  </div>
                </div>

                {/* Buy Together */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Aproveite e Leve Junto <span className="text-xs text-gray-400">({buyTogetherIds.length})</span>
                  </label>
                  <p className="mb-2 text-xs text-gray-500">Produtos para combo &quot;Leve Junto&quot; com desconto extra</p>
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2">
                    {allProducts.map((p: any) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                        <input type="checkbox" checked={buyTogetherIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setBuyTogetherIds((prev) => [...prev, p.id]);
                            else setBuyTogetherIds((prev) => prev.filter((id) => id !== p.id));
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary" />
                        <span className="truncate text-xs text-gray-700">{p.name}</span>
                      </label>
                    ))}
                    {allProducts.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Nenhum produto disponível</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── FLAGS TAB ── */}
            {tab === "flags" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Flags e destaques do produto</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "active", label: "Produto Ativo", desc: "Visível na loja" },
                    { key: "featured", label: "Destaque", desc: "Aparece na home como destaque" },
                    { key: "bestSeller", label: "Mais Vendido", desc: "Badge de mais vendido" },
                    { key: "mostSearched", label: "Mais Procurado", desc: "Aparece na seção Mais Procurados" },
                    { key: "isNew", label: "Lançamento", desc: "Badge de novo/lançamento" },
                  ].map((flag) => (
                    <label key={flag.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.02]">
                      <input type="checkbox" checked={(form as any)[flag.key]}
                        onChange={(e) => set(flag.key, e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{flag.label}</p>
                        <p className="text-xs text-gray-500">{flag.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  <FiTrash2 className="h-3.5 w-3.5" /> Excluir Produto
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSubmit} disabled={isSaving || !form.name || !form.slug || !form.price}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              {isEdit ? "Salvar Alterações" : "Criar Produto"}
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
