"use client";

import { useEffect, useRef, useState } from "react";
import { FiMapPin, FiLoader, FiTruck, FiAlertCircle, FiUserCheck, FiFileText, FiMessageSquare } from "react-icons/fi";
import { useCart, type ShippingOption } from "@/providers/cart-provider";
import { cn } from "@/lib/utils";

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  recipientName: string;
  recipientDocument: string;
  observations: string;
}

interface Props {
  data: AddressData;
  onChange: (data: AddressData) => void;
  onNext: () => void;
  onBack: () => void;
}

const formatCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
};

const formatDocument = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const inputClass = "h-12 w-full bg-transparent px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400";
const LAST_CEP_KEY = "C7drop_last_cep";

export function CheckoutAddress({ data, onChange, onNext, onBack }: Props) {
  const { items, shipping, setShipping } = useCart();
  const [errors, setErrors] = useState<Partial<AddressData> & { shipping?: string }>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingError, setShippingError] = useState("");
  const lastCalculatedCep = useRef("");

  const fetchShipping = async (cepDigits: string) => {
    if (cepDigits === lastCalculatedCep.current) return;
    lastCalculatedCep.current = cepDigits;
    setLoadingShipping(true);
    setShippingError("");
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: cepDigits,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setShippingError(json.error || "Não foi possível calcular o frete. Tente novamente.");
        setShippingOptions([]);
        return;
      }
      setShippingOptions(json.options || []);
    } catch {
      setShippingError("Erro de conexão ao calcular o frete.");
      setShippingOptions([]);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Auto-calculate as soon as a full CEP is present — covers both manual typing
  // and a prefilled address from the user's saved profile.
  useEffect(() => {
    const digits = data.cep.replace(/\D/g, "");
    if (digits.length === 8) fetchShipping(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cep]);

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length < 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (!json.erro) {
        onChange({
          ...data,
          cep,
          street: json.logradouro || data.street,
          neighborhood: json.bairro || data.neighborhood,
          city: json.localidade || data.city,
          state: json.uf || data.state,
        });
        localStorage.setItem(LAST_CEP_KEY, digits);
      }
    } catch {}
    setLoadingCep(false);
  };

  // Preenche com o último CEP usado no carrinho/checkout, já buscando o
  // endereço, pra não pedir o CEP de novo pro cliente.
  useEffect(() => {
    if (data.cep.replace(/\D/g, "").length > 0) return;
    const lastCep = localStorage.getItem(LAST_CEP_KEY);
    if (lastCep) lookupCep(formatCep(lastCep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const e: Partial<AddressData> & { shipping?: string } = {};
    if (data.cep.replace(/\D/g, "").length < 8) e.cep = "CEP inválido";
    if (!data.street.trim()) e.street = "Rua obrigatória";
    if (!data.number.trim()) e.number = "Número obrigatório";
    if (!data.neighborhood.trim()) e.neighborhood = "Bairro obrigatório";
    if (!data.city.trim()) e.city = "Cidade obrigatória";
    if (!data.state.trim()) e.state = "Estado obrigatório";
    if (!data.recipientName.trim()) e.recipientName = "Nome do destinatário obrigatório";
    if (data.recipientDocument.replace(/\D/g, "").length < 11) e.recipientDocument = "CPF/CNPJ do destinatário obrigatório";
    if (!shipping) e.shipping = "Escolha uma opção de frete";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onNext();
  };

  return (
    <div className="neo-surface p-5 sm:p-8">
      <h2 className="mb-6 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
        Endereço de Entrega
      </h2>

      <div className="space-y-4">
        {/* CEP */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">CEP</label>
          <div className="neo-inset relative flex items-center">
            <FiMapPin className="pointer-events-none absolute left-4 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={data.cep}
              onChange={(e) => {
                const val = formatCep(e.target.value);
                onChange({ ...data, cep: val });
                if (val.replace(/\D/g, "").length === 8) lookupCep(val);
              }}
              placeholder="00000-000"
              maxLength={9}
              className={cn(inputClass, "pl-11 pr-12 font-mono")}
            />
            {loadingCep && <FiLoader className="absolute right-4 h-4 w-4 animate-spin text-primary" />}
          </div>
          {errors.cep && <p className="mt-1 text-xs text-red-500">{errors.cep}</p>}
        </div>

        {/* Street */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Rua / Avenida</label>
          <div className="neo-inset">
            <input
              type="text"
              value={data.street}
              onChange={(e) => onChange({ ...data, street: e.target.value })}
              placeholder="Nome da rua"
              className={inputClass}
            />
          </div>
          {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
        </div>

        {/* Number + Complement */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Número</label>
            <div className="neo-inset">
              <input
                type="text"
                value={data.number}
                onChange={(e) => onChange({ ...data, number: e.target.value })}
                placeholder="Nº"
                className={inputClass}
              />
            </div>
            {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Complemento</label>
            <div className="neo-inset">
              <input
                type="text"
                value={data.complement}
                onChange={(e) => onChange({ ...data, complement: e.target.value })}
                placeholder="Apto, bloco..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Neighborhood */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Bairro</label>
          <div className="neo-inset">
            <input
              type="text"
              value={data.neighborhood}
              onChange={(e) => onChange({ ...data, neighborhood: e.target.value })}
              placeholder="Bairro"
              className={inputClass}
            />
          </div>
          {errors.neighborhood && <p className="mt-1 text-xs text-red-500">{errors.neighborhood}</p>}
        </div>

        {/* City + State */}
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Cidade</label>
            <div className="neo-inset">
              <input
                type="text"
                value={data.city}
                onChange={(e) => onChange({ ...data, city: e.target.value })}
                placeholder="Cidade"
                className={inputClass}
              />
            </div>
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">UF</label>
            <div className="neo-inset">
              <input
                type="text"
                value={data.state}
                onChange={(e) => onChange({ ...data, state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="UF"
                maxLength={2}
                className={cn(inputClass, "text-center font-bold")}
              />
            </div>
            {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
          </div>
        </div>
      </div>

      {/* Dados do Destinatário */}
      <div className="neo-inset mt-6 space-y-3 p-4">
        <div className="flex items-center gap-2">
          <FiUserCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-gray-900">Dados do Destinatário</p>
        </div>
        <p className="text-xs text-gray-500">Informe os dados de quem vai receber a mercadoria</p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Nome Completo do Destinatário</label>
          <div className="neo-surface-sm">
            <input
              type="text"
              value={data.recipientName}
              onChange={(e) => onChange({ ...data, recipientName: e.target.value })}
              placeholder="Nome de quem vai receber"
              className={inputClass}
            />
          </div>
          {errors.recipientName && <p className="mt-1 text-xs text-red-500">{errors.recipientName}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">CPF ou CNPJ do Destinatário</label>
          <div className="neo-surface-sm relative flex items-center">
            <FiFileText className="pointer-events-none absolute left-4 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={data.recipientDocument}
              onChange={(e) => onChange({ ...data, recipientDocument: formatDocument(e.target.value) })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className={cn(inputClass, "pl-11")}
            />
          </div>
          {errors.recipientDocument && <p className="mt-1 text-xs text-red-500">{errors.recipientDocument}</p>}
          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
            <FiAlertCircle className="h-3 w-3 shrink-0" /> Necessário para emissão do frete pelo Melhor Envio
          </p>
        </div>
      </div>

      {/* Observações */}
      <div className="mt-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <FiMessageSquare className="h-3.5 w-3.5" /> Observações (opcional)
        </label>
        <div className="neo-inset">
          <textarea
            value={data.observations}
            onChange={(e) => onChange({ ...data, observations: e.target.value })}
            placeholder="Instruções de entrega, referências, etc."
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Shipping options */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <FiTruck className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-gray-900">Opção de frete</p>
        </div>

        {loadingShipping && (
          <div className="neo-inset flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
            <FiLoader className="h-4 w-4 animate-spin" /> Calculando opções de frete...
          </div>
        )}

        {!loadingShipping && shippingError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2">
            <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{shippingError}</p>
          </div>
        )}

        {!loadingShipping && !shippingError && shippingOptions.length > 0 && (
          <div className="space-y-2">
            {shippingOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setShipping(opt);
                  setErrors((prev) => ({ ...prev, shipping: undefined }));
                }}
                className={cn(
                  "neo-pill flex w-full items-center justify-between px-4 py-3 text-left",
                  shipping?.id === opt.id && "neo-pill-selected"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      shipping?.id === opt.id ? "border-primary bg-primary" : "border-gray-300"
                    )}
                  >
                    {shipping?.id === opt.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {opt.name}
                      <span className="ml-1.5 text-[10px] font-normal text-gray-400">{opt.company}</span>
                    </p>
                    <p className="text-xs text-gray-500">{opt.days}</p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold", opt.price === 0 ? "text-green-600" : "text-gray-900")}>
                  {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
                </p>
              </button>
            ))}
          </div>
        )}

        {!loadingShipping && !shippingError && shippingOptions.length === 0 && data.cep.replace(/\D/g, "").length === 8 && (
          <p className="text-xs text-gray-400">Nenhuma opção de frete encontrada para este CEP.</p>
        )}

        {errors.shipping && <p className="mt-1.5 text-xs text-red-500">{errors.shipping}</p>}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="neo-btn flex h-12 flex-1 items-center justify-center text-sm font-semibold text-gray-700"
        >
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          className="neo-btn flex h-12 flex-[2] items-center justify-center bg-primary text-sm font-bold uppercase tracking-wide text-white"
        >
          Continuar para Pagamento
        </button>
      </div>
    </div>
  );
}
