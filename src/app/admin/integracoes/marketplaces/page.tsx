"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAllIntegrations, useSaveIntegration, IntegrationSetting } from "@/hooks/use-admin-integrations";
import {
  FiSave, FiLoader, FiCheck, FiEye, FiEyeOff, FiShare2,
  FiChevronDown, FiChevronUp,
} from "react-icons/fi";

interface MarketplaceConfig {
  provider: string;
  label: string;
  description: string;
  docsUrl?: string;
  fields: { key: string; label: string; type: "text" | "password" | "toggle" | "select"; placeholder?: string; hint?: string; options?: { value: string; label: string }[] }[];
}

const marketplaces: MarketplaceConfig[] = [
  {
    provider: "bling",
    label: "Bling ERP",
    description: "ERP completo — gestão de estoque, notas fiscais, financeiro e integrações com marketplaces",
    docsUrl: "https://developer.bling.com.br",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Chave da API v3", hint: "Obtida em Bling > Preferências > Usuários e API" },
      { key: "client_id", label: "Client ID (OAuth)", type: "text", placeholder: "ID do aplicativo" },
      { key: "client_secret", label: "Client Secret (OAuth)", type: "password", placeholder: "Secret do aplicativo" },
      { key: "access_token", label: "Access Token", type: "password", placeholder: "Token de acesso" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle", hint: "Enviar/receber produtos automaticamente" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle", hint: "Atualizar estoque bidirecional" },
      { key: "sync_orders", label: "Sincronizar Pedidos", type: "toggle", hint: "Enviar pedidos para o Bling" },
      { key: "auto_nfe", label: "Emitir NF-e automaticamente", type: "toggle", hint: "Gerar nota fiscal ao confirmar pagamento" },
    ],
  },
  {
    provider: "tiny_erp",
    label: "Tiny ERP",
    description: "ERP para e-commerce — controle de estoque, NF-e, financeiro e integrações",
    docsUrl: "https://tiny.com.br/api-docs",
    fields: [
      { key: "api_token", label: "Token da API", type: "password", placeholder: "Token gerado no painel Tiny", hint: "Obtido em Tiny > Configurações > Tokens API" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Sincronizar Pedidos", type: "toggle" },
      { key: "auto_nfe", label: "Emitir NF-e automaticamente", type: "toggle" },
    ],
  },
  {
    provider: "mercado_livre",
    label: "Mercado Livre",
    description: "Marketplace líder na América Latina",
    docsUrl: "https://developers.mercadolivre.com.br",
    fields: [
      { key: "app_id", label: "App ID", type: "text", placeholder: "ID do aplicativo ML" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Secret do aplicativo" },
      { key: "access_token", label: "Access Token", type: "password", placeholder: "Token de acesso" },
      { key: "refresh_token", label: "Refresh Token", type: "password" },
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "ID do vendedor" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Importar Pedidos", type: "toggle" },
      { key: "auto_ship", label: "Envio automático (Mercado Envios)", type: "toggle" },
    ],
  },
  {
    provider: "shopee",
    label: "Shopee",
    description: "Marketplace com grande alcance no Brasil",
    docsUrl: "https://open.shopee.com",
    fields: [
      { key: "partner_id", label: "Partner ID", type: "text", placeholder: "ID do parceiro" },
      { key: "partner_key", label: "Partner Key", type: "password", placeholder: "Chave do parceiro" },
      { key: "shop_id", label: "Shop ID", type: "text", placeholder: "ID da loja" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "refresh_token", label: "Refresh Token", type: "password" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Importar Pedidos", type: "toggle" },
    ],
  },
  {
    provider: "amazon",
    label: "Amazon",
    description: "Marketplace global com Amazon SP-API",
    docsUrl: "https://developer-docs.amazon.com/sp-api",
    fields: [
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "ID do vendedor Amazon" },
      { key: "mws_access_key", label: "Access Key", type: "password" },
      { key: "mws_secret_key", label: "Secret Key", type: "password" },
      { key: "refresh_token", label: "Refresh Token (SP-API)", type: "password" },
      { key: "marketplace_id", label: "Marketplace ID", type: "text", placeholder: "A2Q3Y263D00KWC (Brasil)" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Importar Pedidos", type: "toggle" },
    ],
  },
  {
    provider: "magalu",
    label: "Magazine Luiza (Magalu)",
    description: "Marketplace da Magalu",
    docsUrl: "https://developer.magalu.com",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "Chave da API Magalu" },
      { key: "seller_id", label: "Seller ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Importar Pedidos", type: "toggle" },
    ],
  },
  {
    provider: "tiktok_shop",
    label: "TikTok Shop",
    description: "Venda diretamente pelo TikTok",
    docsUrl: "https://partner.tiktokshop.com",
    fields: [
      { key: "app_key", label: "App Key", type: "text" },
      { key: "app_secret", label: "App Secret", type: "password" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "shop_id", label: "Shop ID", type: "text" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_orders", label: "Importar Pedidos", type: "toggle" },
    ],
  },
  {
    provider: "shopify",
    label: "Shopify",
    description: "Integração com lojas Shopify existentes",
    docsUrl: "https://shopify.dev/docs/api",
    fields: [
      { key: "store_url", label: "URL da Loja", type: "text", placeholder: "minhaloja.myshopify.com" },
      { key: "api_key", label: "API Key", type: "text" },
      { key: "api_secret", label: "API Secret", type: "password" },
      { key: "access_token", label: "Access Token (Admin API)", type: "password" },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Sincronizar Pedidos", type: "toggle" },
    ],
  },
  {
    provider: "woocommerce",
    label: "WooCommerce",
    description: "Integração com lojas WordPress/WooCommerce",
    docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs",
    fields: [
      { key: "store_url", label: "URL da Loja", type: "text", placeholder: "https://minhaloja.com.br" },
      { key: "consumer_key", label: "Consumer Key", type: "text", placeholder: "ck_..." },
      { key: "consumer_secret", label: "Consumer Secret", type: "password", placeholder: "cs_..." },
      { key: "sync_products", label: "Sincronizar Produtos", type: "toggle" },
      { key: "sync_stock", label: "Sincronizar Estoque", type: "toggle" },
      { key: "sync_orders", label: "Sincronizar Pedidos", type: "toggle" },
    ],
  },
];

export default function MarketplacesPage() {
  const { data: allIntegrations, isLoading } = useAllIntegrations();
  const saveMut = useSaveIntegration();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, { enabled: boolean; config: Record<string, any> }>>({});
  const [savedProvider, setSavedProvider] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const getState = (provider: string) => {
    if (configs[provider]) return configs[provider];
    const existing = allIntegrations?.find((i) => i.provider === provider);
    return { enabled: existing?.enabled || false, config: (existing?.config as Record<string, any>) || {} };
  };

  const setState = (provider: string, updates: Partial<{ enabled: boolean; config: Record<string, any> }>) => {
    const current = getState(provider);
    setConfigs({ ...configs, [provider]: { ...current, ...updates } });
  };

  const setConfigField = (provider: string, key: string, value: any) => {
    const current = getState(provider);
    setState(provider, { config: { ...current.config, [key]: value } });
  };

  const handleSave = async (provider: string) => {
    const state = getState(provider);
    try {
      await saveMut.mutateAsync({ provider, enabled: state.enabled, config: state.config });
      setSavedProvider(provider);
      setTimeout(() => setSavedProvider(null), 3000);
    } catch {}
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <FiShare2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketplaces & ERP</h1>
            <p className="mt-0.5 text-sm text-gray-500">Integre com ERPs e marketplaces para sincronizar produtos, estoque e pedidos</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {marketplaces.map((mp) => {
          const isExpanded = expanded === mp.provider;
          const state = getState(mp.provider);
          const isSaved = savedProvider === mp.provider;

          return (
            <div key={mp.provider} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              {/* Header */}
              <button onClick={() => setExpanded(isExpanded ? null : mp.provider)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full", state.enabled ? "bg-green-500" : "bg-gray-300")} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{mp.label}</p>
                    <p className="text-xs text-gray-400">{mp.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {state.enabled && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Ativo</span>}
                  {isExpanded ? <FiChevronUp className="h-4 w-4 text-gray-400" /> : <FiChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>

              {/* Body */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Ativar integração</p>
                      {mp.docsUrl && (
                        <a href={mp.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">Documentação ↗</a>
                      )}
                    </div>
                    <button onClick={() => setState(mp.provider, { enabled: !state.enabled })}
                      className={cn("relative h-7 w-12 rounded-full transition-colors", state.enabled ? "bg-green-500" : "bg-gray-300")}>
                      <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", state.enabled ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mp.fields.map((f) => (
                      <div key={f.key}>
                        <label className="mb-1 text-[11px] font-semibold text-gray-500">{f.label}</label>
                        {f.type === "toggle" ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setConfigField(mp.provider, f.key, !state.config[f.key])}
                              className={cn("relative h-6 w-10 rounded-full transition-colors", state.config[f.key] ? "bg-green-500" : "bg-gray-300")}>
                              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", state.config[f.key] ? "translate-x-4" : "translate-x-0.5")} />
                            </button>
                            {f.hint && <span className="text-[10px] text-gray-400">{f.hint}</span>}
                          </div>
                        ) : f.type === "password" ? (
                          <div className="relative">
                            <input type={showPasswords[`${mp.provider}_${f.key}`] ? "text" : "password"}
                              value={state.config[f.key] || ""} onChange={(e) => setConfigField(mp.provider, f.key, e.target.value)}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-9 text-sm font-mono outline-none focus:border-primary" placeholder={f.placeholder} />
                            <button onClick={() => togglePassword(`${mp.provider}_${f.key}`)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPasswords[`${mp.provider}_${f.key}`] ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        ) : f.type === "select" ? (
                          <select value={state.config[f.key] || ""} onChange={(e) => setConfigField(mp.provider, f.key, e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
                            <option value="">Selecione...</option>
                            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={state.config[f.key] || ""} onChange={(e) => setConfigField(mp.provider, f.key, e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder={f.placeholder} />
                        )}
                        {f.hint && f.type !== "toggle" && <p className="mt-0.5 text-[10px] text-gray-400">{f.hint}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Save */}
                  <div className="flex justify-end pt-2">
                    <button onClick={() => handleSave(mp.provider)} disabled={saveMut.isPending}
                      className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all",
                        isSaved ? "bg-green-500" : "bg-primary hover:bg-primary/90", saveMut.isPending && "opacity-50")}>
                      {saveMut.isPending ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : isSaved ? <FiCheck className="h-3.5 w-3.5" /> : <FiSave className="h-3.5 w-3.5" />}
                      {saveMut.isPending ? "Salvando..." : isSaved ? "Salvo!" : "Salvar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
