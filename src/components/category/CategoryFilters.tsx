"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiSliders, FiX, FiChevronDown, FiStar } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
  hex?: string;
}

interface FiltersData {
  priceRanges: FilterOption[];
  colors: FilterOption[];
  sizes: FilterOption[];
  materials: FilterOption[];
  ratings: FilterOption[];
  totalProducts: number;
}

interface CategoryFiltersProps {
  categorySlug?: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

const COLOR_HEX_MAP: Record<string, string> = {
  branco: "#FFFFFF",
  preto: "#1F2937",
  cinza: "#9CA3AF",
  rosa: "#F9A8D4",
  azul: "#93C5FD",
  bege: "#D4B896",
  marrom: "#92400E",
  verde: "#86EFAC",
  vermelho: "#FCA5A5",
  amarelo: "#FDE68A",
  roxo: "#C4B5FD",
  laranja: "#FDBA74",
};

const sortOptions = [
  { label: "Mais Relevantes", value: "relevance" },
  { label: "Menor Preço", value: "price-asc" },
  { label: "Maior Preço", value: "price-desc" },
  { label: "Mais Vendidos", value: "best-sellers" },
  { label: "Melhor Avaliados", value: "top-rated" },
  { label: "Novidades", value: "newest" },
];

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return "#D1D5DB"; // default gray
}

export function CategoryFilters({ categorySlug, sortBy, onSortChange, onFilterChange }: CategoryFiltersProps) {
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<string>("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["price", "color", "size"]);

  // Fetch real filter data from API
  const { data: filtersData } = useQuery<FiltersData>({
    queryKey: ["product-filters", categorySlug],
    queryFn: async () => {
      const params = categorySlug ? `?category=${categorySlug}` : "";
      const res = await fetch(`/api/products/filters${params}`);
      if (!res.ok) throw new Error("Failed to fetch filters");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const priceRanges: FilterOption[] = filtersData?.priceRanges || [];
  const colors: FilterOption[] = (filtersData?.colors || []).map((c) => ({
    ...c,
    hex: getColorHex(c.label),
  }));
  const sizes: FilterOption[] = filtersData?.sizes || [];
  const materials: FilterOption[] = filtersData?.materials || [];
  const ratings: FilterOption[] = filtersData?.ratings || [];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const toggleFilter = (
    value: string,
    selected: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const activeFilterCount = selectedPrices.length + selectedColors.length + selectedSizes.length + selectedMaterials.length + (selectedRating ? 1 : 0);

  const clearAll = () => {
    setSelectedPrices([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSelectedRating("");
  };

  const allActiveFilters = [
    ...selectedPrices.map((v) => ({ type: "price", value: v, label: priceRanges.find((p) => p.value === v)?.label || v })),
    ...selectedColors.map((v) => ({ type: "color", value: v, label: colors.find((c) => c.value === v)?.label || v })),
    ...selectedSizes.map((v) => ({ type: "size", value: v, label: sizes.find((s) => s.value === v)?.label || v })),
    ...selectedMaterials.map((v) => ({ type: "material", value: v, label: materials.find((m) => m.value === v)?.label || v })),
    ...(selectedRating ? [{ type: "rating", value: selectedRating, label: `${selectedRating}★ ou mais` }] : []),
  ];

  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case "price": setSelectedPrices((p) => p.filter((v) => v !== value)); break;
      case "color": setSelectedColors((c) => c.filter((v) => v !== value)); break;
      case "size": setSelectedSizes((s) => s.filter((v) => v !== value)); break;
      case "material": setSelectedMaterials((m) => m.filter((v) => v !== value)); break;
      case "rating": setSelectedRating(""); break;
    }
  };

  const showSection = (items: FilterOption[]) => items.length > 0;

  const FilterSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 py-5">
      <button
        onClick={() => toggleSection(id)}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-900"
      >
        {title}
        <FiChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", expandedSections.includes(id) && "rotate-180")} />
      </button>
      {expandedSections.includes(id) && <div className="mt-4">{children}</div>}
    </div>
  );

  const filterContent = (
    <>
      {/* Price — only if we have ranges */}
      {showSection(priceRanges) && (
        <FilterSection id="price" title="Faixa de Preço">
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => toggleFilter(range.value, selectedPrices, setSelectedPrices)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-all",
                  selectedPrices.includes(range.value)
                    ? "bg-primary text-white font-medium"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <span>{range.label}</span>
                <span className={cn("text-xs", selectedPrices.includes(range.value) ? "text-white/70" : "text-gray-400")}>
                  ({range.count})
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Colors */}
      {showSection(colors) && (
        <FilterSection id="color" title="Cor">
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => toggleFilter(color.value, selectedColors, setSelectedColors)}
                className="group flex flex-col items-center gap-1.5"
                title={color.label}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-all",
                    selectedColors.includes(color.value)
                      ? "border-primary ring-2 ring-primary/20 scale-110"
                      : "border-gray-200 group-hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color.hex }}
                />
                <span className={cn("text-[10px] font-medium", selectedColors.includes(color.value) ? "text-primary" : "text-gray-400")}>
                  {color.label}
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Sizes */}
      {showSection(sizes) && (
        <FilterSection id="size" title="Tamanho">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size.value}
                onClick={() => toggleFilter(size.value, selectedSizes, setSelectedSizes)}
                className={cn(
                  "rounded-full border-2 px-5 py-2 text-sm font-medium transition-all",
                  selectedSizes.includes(size.value)
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Material */}
      {showSection(materials) && (
        <FilterSection id="material" title="Material">
          <div className="flex flex-wrap gap-2">
            {materials.map((mat) => (
              <button
                key={mat.value}
                onClick={() => toggleFilter(mat.value, selectedMaterials, setSelectedMaterials)}
                className={cn(
                  "rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
                  selectedMaterials.includes(mat.value)
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                )}
              >
                {mat.label}
                <span className={cn("ml-1 text-xs", selectedMaterials.includes(mat.value) ? "text-white/70" : "text-gray-400")}>
                  {mat.count}
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      {showSection(ratings) && (
        <FilterSection id="rating" title="Avaliação">
          <div className="space-y-2">
            {ratings.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRating(selectedRating === r.value ? "" : r.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all",
                  selectedRating === r.value
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FiStar
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i <= Number(r.value)
                          ? selectedRating === r.value ? "fill-white text-white" : "fill-amber-400 text-amber-400"
                          : selectedRating === r.value ? "text-white/40" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="flex-1 text-left">{r.label}</span>
                <span className={cn("text-xs", selectedRating === r.value ? "text-white/70" : "text-gray-400")}>
                  ({r.count})
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}
    </>
  );

  return (
    <>
      {/* Sort Bar + Active Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-primary hover:text-primary lg:hidden"
          >
            <FiSliders className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Pills */}
        {allActiveFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Filtros ativos:</span>
            {allActiveFilters.map((f) => (
              <button
                key={`${f.type}-${f.value}`}
                onClick={() => removeFilter(f.type, f.value)}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20"
              >
                {f.label}
                <FiX className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-xs font-medium text-gray-400 underline transition-colors hover:text-red-500"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar Filters */}
      <div className="hidden lg:block">
        <div className="sticky top-32 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Filtros</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-primary transition-colors hover:underline">
                Limpar ({activeFilterCount})
              </button>
            )}
          </div>
          {filterContent}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl animate-slide-in-right">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
              <button onClick={() => setShowMobileFilters(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {filterContent}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white"
            >
              Aplicar Filtros ({activeFilterCount})
            </button>
          </div>
        </>
      )}
    </>
  );
}
