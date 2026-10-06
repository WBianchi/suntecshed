"use client";

import { useState, useEffect, useRef } from "react";
import { FiTruck, FiLoader, FiMapPin, FiAlertCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useCart, type ShippingOption } from "@/providers/cart-provider";

export type { ShippingOption } from "@/providers/cart-provider";

const LAST_CEP_KEY = "C7drop_last_cep";

export function CartShipping() {
  const { items, shipping: selectedShipping, setShipping } = useCart();
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const autoCalculated = useRef(false);
  // Já vem recolhido se o frete já tiver sido escolhido antes (ex: calculado
  // no /carrinho e o cliente reabriu o mini carrinho depois).
  const [expanded, setExpanded] = useState(!selectedShipping);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  // Preenche com o último CEP calculado (salvo no carrinho, mini carrinho ou
  // checkout) e já calcula de novo, pra não pedir de novo pro cliente.
  useEffect(() => {
    const lastCep = localStorage.getItem(LAST_CEP_KEY);
    if (lastCep) setCep(formatCep(lastCep));
  }, []);

  useEffect(() => {
    if (autoCalculated.current) return;
    if (cep.replace(/\D/g, "").length === 8) {
      autoCalculated.current = true;
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  // Peso/dimensão total do frete depende da quantidade de cada item — sem
  // isso, mudar a quantidade no carrinho não recalculava o valor, e
  // carrinho/mini carrinho/checkout continuavam mostrando o preço antigo
  // (todos leem o mesmo frete "selecionado", guardado uma vez só).
  const itemsSignature = items.map((i) => `${i.id}:${i.quantity}`).join(",");
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (cep.replace(/\D/g, "").length === 8 && (calculated || selectedShipping)) {
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSignature]);

  const handleCalculate = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length < 8) return;
    setLoading(true);
    setError("");
    setCalculated(false);

    try {
      const [shippingRes, cepRes] = await Promise.all([
        fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cep: digits,
            items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          }),
        }),
        fetch(`https://viacep.com.br/ws/${digits}/json/`).catch(() => null),
      ]);

      const data = await shippingRes.json().catch(() => ({}));

      if (!shippingRes.ok) {
        setError(data.error || "Não foi possível calcular o frete. Tente novamente.");
        setOptions([]);
        return;
      }

      localStorage.setItem(LAST_CEP_KEY, digits);

      if (cepRes) {
        const cepJson = await cepRes.json().catch(() => null);
        setAddress(
          cepJson && !cepJson.erro
            ? `${cepJson.bairro ? `${cepJson.bairro}, ` : ""}${cepJson.localidade} - ${cepJson.uf}`
            : ""
        );
      }

      const newOptions: ShippingOption[] = data.options || [];
      setOptions(newOptions);
      setCalculated(true);

      // Se já tinha um frete escolhido, atualiza o preço pra refletir a
      // nova quantidade/peso — se a opção não existir mais, limpa a
      // seleção pra não cobrar um valor desatualizado.
      if (selectedShipping) {
        const stillAvailable = newOptions.find((o) => o.id === selectedShipping.id);
        setShipping(stillAvailable || null);
        if (stillAvailable) setExpanded(false);
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Frete já escolhido — mostra um resumo compacto em vez do formulário
  // inteiro aberto, pra não ocupar tanto espaço no mini carrinho.
  if (selectedShipping && !expanded) {
    return (
      <div data-cart-shipping="true" className="flex items-center justify-between rounded-[26px] border border-gray-100 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <FiTruck className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedShipping.name}
              <span className="ml-1.5 text-[10px] font-normal text-gray-400">{selectedShipping.company}</span>
            </p>
            <p className={`text-xs font-semibold ${selectedShipping.price === 0 ? "text-green-600" : "text-gray-500"}`}>
              {selectedShipping.price === 0 ? "Grátis" : `R$ ${selectedShipping.price.toFixed(2).replace(".", ",")}`}
              {" · "}{selectedShipping.days}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
        >
          Alterar <FiChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div data-cart-shipping="true" className="rounded-[26px] border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiTruck className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-gray-900">Calcular frete</p>
        </div>
        {selectedShipping && (
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            Recolher <FiChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* CEP Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={cep}
          onChange={(e) => {
            setCep(formatCep(e.target.value));
            setCalculated(false);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
          placeholder="00000-000"
          maxLength={9}
          className="h-11 flex-1 rounded-full border border-gray-200 bg-gray-50/50 px-4 text-sm font-mono text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
        />
        <button
          onClick={handleCalculate}
          disabled={loading || cep.replace(/\D/g, "").length < 8}
          className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : "Calcular"}
        </button>
      </div>

      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-[11px] text-primary hover:underline"
      >
        Não sei meu CEP
      </a>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2">
          <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Address */}
      {calculated && address && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <p className="text-xs text-gray-600">{address}</p>
        </div>
      )}

      {/* Shipping Options */}
      {calculated && options.length > 0 && (
        <div className="mt-4 space-y-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setShipping(opt); setExpanded(false); }}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                selectedShipping?.id === opt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-gray-100 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    selectedShipping?.id === opt.id
                      ? "border-primary bg-primary"
                      : "border-gray-300"
                  }`}
                >
                  {selectedShipping?.id === opt.id && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {opt.name}
                    <span className="ml-1.5 text-[10px] font-normal text-gray-400">{opt.company}</span>
                  </p>
                  <p className="text-xs text-gray-500">{opt.days}</p>
                </div>
              </div>
              <p className={`text-sm font-bold ${opt.price === 0 ? "text-green-600" : "text-gray-900"}`}>
                {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
