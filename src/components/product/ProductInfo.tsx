"use client";

import { useMemo, useState } from "react";
import { FiHeart, FiShare2, FiShoppingCart, FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus, FiCheck, FiLock } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { bestInstallmentPitch } from "@/lib/installments";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { ShareModal } from "@/components/product/ShareModal";
import { getColorGradient, isLightColor } from "@/lib/color-swatch";

type Tier = "DROPSHIPPING" | "ATACADO";

interface VariantData {
  id: string;
  name: string;
  value: string;
  tier: Tier | null;
  price: number | null;
  stock: number;
  sku: string | null;
  image: string | null;
}

interface ProductInfoProps {
  id: string;
  slug: string;
  image: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  sku: string;
  gtin?: string | null;
  ncm?: string | null;
  anatelHomologation?: string | null;
  manageStock: boolean;
  baseStock: number;
  variants: VariantData[];
}

const TIER_LABEL: Record<Tier, string> = {
  DROPSHIPPING: "Dropshipping",
  ATACADO: "Wholesale",
};

function ColorSwatchButton({ value, selected, onClick }: { value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={value}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all",
        selected ? "bg-primary/5" : "hover:bg-gray-50"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-2 ring-offset-2 transition-all",
          selected ? "ring-primary" : "ring-transparent",
          isLightColor(value) && "border border-gray-200"
        )}
        style={{ background: getColorGradient(value) }}
      >
        {selected && (
          <FiCheck className={cn("h-4 w-4", isLightColor(value) ? "text-gray-600" : "text-white drop-shadow")} />
        )}
      </span>
      <span className="max-w-[64px] truncate text-[11px] font-medium text-gray-500">{value}</span>
    </button>
  );
}

export function ProductInfo({
  id, slug, image, name, price, compareAtPrice,
  description, sku, gtin, ncm, anatelHomologation, manageStock, baseStock, variants,
}: ProductInfoProps) {
  // Atributo "real" do produto (Cor/Size/etc) — tudo que não é o eixo de tier "Compra"
  const realVariants = useMemo(() => variants.filter((v) => v.name !== "Compra"), [variants]);
  const realGroupName = realVariants[0]?.name;
  const realValues = useMemo(() => [...new Set(realVariants.map((v) => v.value))], [realVariants]);
  const hasTiers = variants.some((v) => v.tier);

  // Alguns produtos migrados têm 2 atributos reais combinados num valor só
  // (ex: "127v / Preto" = Voltage + Cor) porque a migração do WooCommerce
  // junta tudo que não é o eixo de tier num único campo "Variant". Se der
  // pra separar de forma consistente, mostra um seletor por atributo em vez
  // de um botão só com o valor colado — assim a cor aparece de verdade.
  const AXIS_SEP = " / ";
  const isCompoundGroup =
    realGroupName === "Variant" &&
    realValues.length > 0 &&
    realValues.every((v) => v.includes(AXIS_SEP)) &&
    new Set(realValues.map((v) => v.split(AXIS_SEP).length)).size === 1 &&
    realValues[0].split(AXIS_SEP).length >= 2;

  const axisOptions = useMemo(() => {
    if (!isCompoundGroup) return [] as string[][];
    const axisCount = realValues[0].split(AXIS_SEP).length;
    const opts: string[][] = Array.from({ length: axisCount }, () => []);
    for (const val of realValues) {
      val.split(AXIS_SEP).forEach((part, i) => {
        if (!opts[i].includes(part)) opts[i].push(part);
      });
    }
    return opts;
  }, [isCompoundGroup, realValues]);

  const axisLabels = useMemo(() => {
    function guessLabel(values: string[]): string {
      if (values.every((v) => /^\d+\s*v$/i.test(v.trim()))) return "Voltage";
      if (values.every((v) => /polegada|cent[ií]metro|\bcm\b|\bmm\b|\bmetro/i.test(v))) return "Size";
      return "Color";
    }
    const seen = new Map<string, number>();
    return axisOptions.map((opts) => {
      const label = guessLabel(opts);
      const count = (seen.get(label) || 0) + 1;
      seen.set(label, count);
      return count > 1 ? `${label} ${count}` : label;
    });
  }, [axisOptions]);

  const [selectedValue, setSelectedValue] = useState(realValues[0] || "");
  const [selectedParts, setSelectedParts] = useState<string[]>(() =>
    isCompoundGroup ? realValues[0].split(AXIS_SEP) : []
  );
  const effectiveSelectedValue = isCompoundGroup ? selectedParts.join(AXIS_SEP) : selectedValue;
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { addItem, items } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFavorited = isFavorite(id);

  // Regra de negócio: por padrão sugere Grupo VIP > Atacado (6+ un.) >
  // Dropshipping, mas o cliente pode clicar em qualquer tier que tenha
  // acesso — inclusive um VIP escolher Atacado/Dropshipping manualmente.
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const effectiveTier: Tier = selectedTier ?? (quantity >= 6 ? "ATACADO" : "DROPSHIPPING");

  const activeVariant = useMemo(() => {
    if (!hasTiers) {
      return realGroupName ? realVariants.find((v) => v.value === effectiveSelectedValue) : undefined;
    }
    return variants.find(
      (v) => v.tier === effectiveTier && (realGroupName ? v.value === effectiveSelectedValue : true)
    );
  }, [variants, hasTiers, realGroupName, realVariants, effectiveSelectedValue, effectiveTier]);

  const effectivePrice = activeVariant?.price ?? price;
  // O estoque da variante (quando > 0) tem precedência sobre o estoque base —
  // mas se a variante estiver com estoque zerado (ex: admin só preencheu o campo
  // de estoque do produto, não das variantes), usa o estoque base como fallback.
  const effectiveStock = (activeVariant && activeVariant.stock > 0) ? activeVariant.stock : baseStock;
  const effectiveSku = activeVariant?.sku || sku;
  const inStock = manageStock ? effectiveStock > 0 : true;
  const showCompareAt = !activeVariant && !!compareAtPrice;

  // Quantas unidades deste produto já estão no carrinho (soma de todos os
  // itens com o mesmo id, independente de tier/size — o estoque é compartilhado).
  const cartQty = items.filter((i) => i.id === id).reduce((sum, i) => sum + i.quantity, 0);
  // Limite máximo de unidades que ainda podem ser adicionadas ao carrinho
  const maxAddQty = manageStock ? Math.max(0, effectiveStock - cartQty) : Infinity;

  const discount = showCompareAt && compareAtPrice ? Math.round((1 - price / compareAtPrice) * 100) : 0;
  const bestInstallment = bestInstallmentPitch(effectivePrice);
  const installmentCount = bestInstallment.n;
  const installment = bestInstallment.installmentValue.toFixed(2).replace(".", ",");

  function updateQuantity(next: number) {
    // No tier Atacado a quantidade nunca pode cair abaixo do mínimo de 6
    // unidades — senão o cliente ia pro preço de atacado com 1 unidade só.
    const min = effectiveTier === "ATACADO" ? 6 : 1;
    // Se controla estoque, nunca deixa passar do disponível.
    const max = manageStock ? effectiveStock : Infinity;
    setQuantity(Math.min(max, Math.max(min, next)));
  }

  function handleTierClick(tier: Tier) {
    setSelectedTier(tier);
    if (tier === "ATACADO") updateQuantity(Math.max(quantity, 6));
    if (tier === "DROPSHIPPING") updateQuantity(Math.min(quantity, 5));
  }

  const handleAddToCart = () => {
    // Não deixa adicionar mais do que o estoque permite (considerando o que
    // já está no carrinho).
    const cappedQty = manageStock ? Math.min(quantity, maxAddQty) : quantity;
    if (cappedQty <= 0) return;
    addItem({
      id,
      name,
      slug,
      price: effectivePrice,
      compareAtPrice: showCompareAt ? compareAtPrice : undefined,
      image,
      quantity: cappedQty,
      size: realGroupName ? effectiveSelectedValue : undefined,
      sku: effectiveSku,
      tier: hasTiers ? TIER_LABEL[effectiveTier] : undefined,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleFavorite = () => {
    toggleFavorite({ id, name, slug, price: effectivePrice, compareAtPrice: showCompareAt ? compareAtPrice : undefined, image });
  };

  const handleShare = () => setShareOpen(true);

  // O "+" fica desabilitado quando já atingiu o teto de estoque OU quando
  // o carrinho já esgotou toda a disponibilidade.
  const plusDisabled = manageStock && (quantity >= effectiveStock || cartQty >= effectiveStock);
  const canAddToCart = inStock && (!manageStock || maxAddQty > 0);

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          {inStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> In stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
              Sold out
            </span>
          )}
          {manageStock && inStock && (
            <span className="text-xs text-gray-400">
              {effectiveStock} available
            </span>
          )}
          {!manageStock && <span className="text-xs text-gray-400">SKU: {effectiveSku}</span>}
        </div>

        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl" style={{ fontFamily: "var(--font-poppins)" }}>
          {name}
        </h1>

        {(gtin || ncm || anatelHomologation) && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
            {gtin && <span>EAN: {gtin}</span>}
            {ncm && <span>NCM: {ncm}</span>}
            {anatelHomologation && <span>ANATEL Certification: {anatelHomologation}</span>}
          </div>
        )}
      </div>

      {/* Compra (tier) */}
      {hasTiers && (
        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-900">
            Purchase <span className="font-normal text-gray-500">- {TIER_LABEL[effectiveTier]}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {(["ATACADO", "DROPSHIPPING"] as Tier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => handleTierClick(tier)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all",
                  tier === effectiveTier
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                )}
              >
                {TIER_LABEL[tier]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">Wholesale pricing starts at 6 units.</p>
        </div>
      )}

      {/* Price */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-extrabold text-gray-900">
            R$ {effectivePrice.toFixed(2).replace(".", ",")}
          </span>
          {showCompareAt && (
            <span className="mb-1 text-lg text-gray-400 line-through">
              R$ {compareAtPrice!.toFixed(2).replace(".", ",")}
            </span>
          )}
          {discount > 0 && (
            <span className="mb-1 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-gray-500">
          or up to <span className="font-semibold text-primary">{installmentCount}x of R$ {installment}</span>
        </p>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>

      {/* Atributo real composto (ex: Voltage + Cor combinados na migração) — um seletor por eixo */}
      {isCompoundGroup &&
        axisOptions.map((opts, axisIdx) => (
          <div key={axisIdx}>
            <label className="mb-3 block text-sm font-semibold text-gray-900">
              {axisLabels[axisIdx]}: <span className="font-normal text-gray-500">{selectedParts[axisIdx]}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {opts.map((val) =>
                axisLabels[axisIdx] === "Color" ? (
                  <ColorSwatchButton
                    key={val}
                    value={val}
                    selected={selectedParts[axisIdx] === val}
                    onClick={() =>
                      setSelectedParts((prev) => {
                        const next = [...prev];
                        next[axisIdx] = val;
                        return next;
                      })
                    }
                  />
                ) : (
                  <button
                    key={val}
                    onClick={() =>
                      setSelectedParts((prev) => {
                        const next = [...prev];
                        next[axisIdx] = val;
                        return next;
                      })
                    }
                    className={cn(
                      "rounded-xl border-2 px-5 py-2.5 text-sm font-medium transition-all",
                      selectedParts[axisIdx] === val
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                    )}
                  >
                    {val}
                  </button>
                )
              )}
            </div>
          </div>
        ))}

      {/* Atributo real simples (Cor/Size/etc) */}
      {!isCompoundGroup && realGroupName && realValues.length > 0 && (
        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-900">
            {realGroupName}: <span className="font-normal text-gray-500">{selectedValue}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {realValues.map((val) =>
              realGroupName === "Cor" ? (
                <ColorSwatchButton key={val} value={val} selected={selectedValue === val} onClick={() => setSelectedValue(val)} />
              ) : (
                <button
                  key={val}
                  onClick={() => setSelectedValue(val)}
                  className={cn(
                    "rounded-xl border-2 px-5 py-2.5 text-sm font-medium transition-all",
                    selectedValue === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                  )}
                >
                  {val}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Quantity + Actions — Desktop */}
      <div className="hidden gap-3 sm:flex sm:items-center">
        <div className="flex items-center rounded-xl border border-gray-200 bg-white">
          <button
            onClick={() => updateQuantity(quantity - 1)}
            disabled={effectiveTier === "ATACADO" && quantity <= 6}
            title={effectiveTier === "ATACADO" && quantity <= 6 ? "Wholesale minimum: 6 units" : undefined}
            className="flex h-12 w-12 items-center justify-center text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <FiMinus className="h-4 w-4" />
          </button>
          <span className="flex h-12 w-12 items-center justify-center text-sm font-bold text-gray-900">{quantity}</span>
          <button
            onClick={() => updateQuantity(quantity + 1)}
            disabled={plusDisabled}
            title={plusDisabled ? "Maximum stock reached" : undefined}
            className="flex h-12 w-12 items-center justify-center text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <FiPlus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={cn(
            "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all",
            addedToCart
              ? "bg-green-500 text-white"
              : "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]",
            !canAddToCart && "cursor-not-allowed opacity-50"
          )}
        >
          {addedToCart ? (
            <>
              <FiCheck className="h-5 w-5" />
              Added!
            </>
          ) : !inStock ? (
            <>
              <FiShoppingCart className="h-5 w-5" />
              Sold out
            </>
          ) : manageStock && maxAddQty <= 0 ? (
            <>
              <FiShoppingCart className="h-5 w-5" />
              Already in cart
            </>
          ) : (
            <>
              <FiShoppingCart className="h-5 w-5" />
              Add to Cart
            </>
          )}
        </button>

        <button
          onClick={handleToggleFavorite}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
            isFavorited
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-gray-200 text-gray-400 hover:border-primary hover:text-primary"
          )}
        >
          <FiHeart className={cn("h-5 w-5", isFavorited && "fill-current")} />
        </button>

        <button
          onClick={handleShare}
          title="Share"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 transition-all hover:border-primary hover:text-primary"
        >
          <FiShare2 className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Actions — row with fav/share inline */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
            isFavorited
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-gray-200 text-gray-400"
          )}
        >
          <FiHeart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </button>
        <button
          onClick={handleShare}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400"
        >
          <FiShare2 className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white">
          <button
            onClick={() => updateQuantity(quantity - 1)}
            disabled={effectiveTier === "ATACADO" && quantity <= 6}
            title={effectiveTier === "ATACADO" && quantity <= 6 ? "Wholesale minimum: 6 units" : undefined}
            className="flex h-11 w-10 items-center justify-center text-gray-500 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <FiMinus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[28px] text-center text-sm font-bold text-gray-900">{quantity}</span>
          <button
            onClick={() => updateQuantity(quantity + 1)}
            disabled={plusDisabled}
            title={plusDisabled ? "Maximum stock reached" : undefined}
            className="flex h-11 w-10 items-center justify-center text-gray-500 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <FiPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: FiTruck, title: "Fast Shipping", desc: "Shipped all over Brazil" },
          { icon: FiShield, title: "Secure Purchase", desc: "Protected environment" },
          { icon: FiRefreshCw, title: "Free Returns", desc: "Within 30 days" },
        ].map((badge) => (
          <div key={badge.title} className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-center sm:gap-1.5 sm:p-3">
            <badge.icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            <span className="text-[10px] font-semibold text-gray-900 sm:text-xs">{badge.title}</span>
            <span className="hidden text-[10px] text-gray-400 sm:block">{badge.desc}</span>
          </div>
        ))}
      </div>

      {/* Mobile Sticky Add to Cart — replaces MobileBottomNav on product pages */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-lg sm:hidden">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-lg font-extrabold text-gray-900">
              R$ {effectivePrice.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-gray-400">
              or up to {installmentCount}x of R$ {installment}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-[0.97]",
              addedToCart
                ? "bg-green-500 text-white"
                : "bg-primary text-white",
              !canAddToCart && "cursor-not-allowed opacity-50"
            )}
          >
            {addedToCart ? (
              <>
                <FiCheck className="h-5 w-5" />
                Added!
              </>
            ) : !inStock ? (
              <>
                <FiShoppingCart className="h-5 w-5" />
                Sold out
              </>
            ) : manageStock && maxAddQty <= 0 ? (
              <>
                <FiShoppingCart className="h-5 w-5" />
                Already in cart
              </>
            ) : (
              <>
                <FiShoppingCart className="h-5 w-5" />
                Buy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    {shareOpen && (
      <ShareModal
        url={typeof window !== "undefined" ? `${window.location.origin}/produto/${slug}` : `/produto/${slug}`}
        title={name}
        onClose={() => setShareOpen(false)}
      />
    )}
    </>
  );
}
