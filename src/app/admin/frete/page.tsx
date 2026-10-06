"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  useAdminShippingRules, useCreateShippingRule, useUpdateShippingRule, useDeleteShippingRule,
  type ShippingRule,
} from "@/hooks/use-admin-shipping-rules";
import { useIntegration, useSaveIntegration } from "@/hooks/use-admin-integrations";
import {
  FiPlus, FiX, FiEdit2, FiTrash2, FiTruck, FiLoader, FiSave,
  FiMapPin, FiAlertTriangle, FiPackage,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// IDs reais retornados por /api/v2/me/shipment/services do Melhor Envio.
const DEFAULT_MELHOR_ENVIO_SERVICES = "1,2,12,27,35";

const MELHOR_ENVIO_CARRIERS: { company: string; services: { id: string; name: string }[] }[] = [
  { company: "Correios", services: [
    { id: "1", name: "PAC" },
    { id: "2", name: "SEDEX" },
    { id: "17", name: "Mini Envios" },
  ] },
  { company: "Jadlog", services: [
    { id: "3", name: ".Package" },
    { id: "4", name: ".Com" },
    { id: "27", name: ".Package Centralizado" },
  ] },
  { company: "LATAM Cargo", services: [
    { id: "12", name: "éFácil" },
  ] },
  { company: "Azul Cargo Express", services: [
    { id: "15", name: "Expresso" },
    { id: "16", name: "e-commerce" },
  ] },
  { company: "Buslog", services: [
    { id: "22", name: "Rodoviário" },
  ] },
  { company: "Loggi", services: [
    { id: "31", name: "Express" },
    { id: "32", name: "Coleta" },
    { id: "34", name: "Loggi Ponto" },
  ] },
  { company: "JeT", services: [
    { id: "33", name: "Standard" },
  ] },
  { company: "Total Express", services: [
    { id: "35", name: "Standard" },
  ] },
];

function MelhorEnvioCarriersCard() {
  const { data: integration, isLoading } = useIntegration("melhor_envio");
  const saveMut = useSaveIntegration();
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_MELHOR_ENVIO_SERVICES.split(",")));
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!integration) return;
    const carriers = (integration.config?.carriers as string | undefined) || DEFAULT_MELHOR_ENVIO_SERVICES;
    setSelected(new Set(carriers.split(",").map((s) => s.trim()).filter(Boolean)));
    setDirty(false);
  }, [integration]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await saveMut.mutateAsync({
        provider: "melhor_envio",
        enabled: integration?.enabled ?? true,
        config: { ...(integration?.config || {}), carriers: Array.from(selected).join(",") },
      });
      setDirty(false);
      setSaved(true);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <FiPackage className="h-4 w-4 text-primary" /> Transportadoras do Melhor Envio
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Escolha quais serviços de frete do Melhor Envio devem aparecer no cálculo do checkout.
          </p>
        </div>
        <button onClick={handleSave} disabled={!dirty || saveMut.isPending}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40">
          {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
          {saved && !dirty ? "Salvo" : "Salvar"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MELHOR_ENVIO_CARRIERS.map((group) => (
            <div key={group.company} className="rounded-xl border border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.company}</p>
              <div className="space-y-1.5">
                {group.services.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function scopeLabel(rule: ShippingRule): string {
  const parts: string[] = [];
  if (rule.cepRangeStart && rule.cepRangeEnd) parts.push(`CEP ${rule.cepRangeStart}–${rule.cepRangeEnd}`);
  if (rule.city) parts.push(rule.city);
  if (rule.state) parts.push(rule.state);
  if (rule.country) parts.push(rule.country);
  return parts.length > 0 ? parts.join(" · ") : "Todo o Brasil";
}

interface FormData {
  name: string;
  price: string;
  estimatedDays: string;
  country: string;
  state: string;
  city: string;
  cepRangeStart: string;
  cepRangeEnd: string;
  active: boolean;
}

const emptyForm: FormData = {
  name: "", price: "", estimatedDays: "",
  country: "Brasil", state: "", city: "", cepRangeStart: "", cepRangeEnd: "",
  active: true,
};

export default function AdminFretePage() {
  const { data, isLoading } = useAdminShippingRules();
  const createMut = useCreateShippingRule();
  const updateMut = useUpdateShippingRule();
  const deleteMut = useDeleteShippingRule();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRule | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ShippingRule | null>(null);

  const rules = data?.rules || [];

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); setError(""); };
  const openEdit = (r: ShippingRule) => {
    setEditing(r);
    setForm({
      name: r.name, price: String(r.price), estimatedDays: r.estimatedDays ? String(r.estimatedDays) : "",
      country: r.country || "", state: r.state || "", city: r.city || "",
      cepRangeStart: r.cepRangeStart || "", cepRangeEnd: r.cepRangeEnd || "",
      active: r.active,
    });
    setModalOpen(true);
    setError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nome é obrigatório"); return; }
    if (!form.price || isNaN(Number(form.price))) { setError("Valor do frete inválido"); return; }

    const payload = {
      name: form.name,
      price: Number(form.price),
      estimatedDays: form.estimatedDays ? Number(form.estimatedDays) : null,
      country: form.country || null,
      state: form.state || null,
      city: form.city || null,
      cepRangeStart: form.cepRangeStart || null,
      cepRangeEnd: form.cepRangeEnd || null,
      active: form.active,
    };

    try {
      if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload });
      else await createMut.mutateAsync(payload);
      setModalOpen(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleActive = async (r: ShippingRule) => {
    try { await updateMut.mutateAsync({ id: r.id, active: !r.active }); } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteMut.mutateAsync(deleteTarget.id); setDeleteTarget(null); } catch {}
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FiTruck className="h-5 w-5 text-primary" /> Frete
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Regras próprias de frete por país, estado, cidade ou faixa de CEP
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Nova Regra
        </button>
      </div>

      <MelhorEnvioCarriersCard />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && rules.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiTruck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhuma regra de frete cadastrada</p>
          <p className="mt-1 text-sm text-gray-400">Crie a primeira opção de frete pra sua loja</p>
        </div>
      )}

      {!isLoading && rules.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Prazo</th>
                  <th className="px-5 py-3">Abrangência</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{formatBRL(r.price)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">
                        {r.estimatedDays ? `${r.estimatedDays} ${r.estimatedDays === 1 ? "dia útil" : "dias úteis"}` : "A combinar"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FiMapPin className="h-3 w-3 text-gray-400" /> {scopeLabel(r)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(r)}
                        className={cn("relative h-6 w-11 rounded-full transition-colors", r.active ? "bg-primary" : "bg-gray-300")}>
                        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", r.active ? "translate-x-5" : "translate-x-0.5")} />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Editar Regra de Frete" : "Nova Regra de Frete"}</h2>
              <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Nome *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Ex: Embalagem, FLEX..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Valor do Frete (R$) *</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="15.00" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Prazo estimado (dias úteis)</label>
                  <input value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Opcional" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Abrangência — deixe em branco pra aplicar em qualquer lugar dentro do nível acima
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">País</label>
                    <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="Brasil" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Estado (UF)</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                      maxLength={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="Qualquer estado" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Cidade</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="Qualquer cidade" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">CEP inicial</label>
                    <input value={form.cepRangeStart} onChange={(e) => setForm({ ...form, cepRangeStart: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="00000-000" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">CEP final</label>
                    <input value={form.cepRangeEnd} onChange={(e) => setForm({ ...form, cepRangeEnd: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="99999-999" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-900">Regra ativa</p>
                <button onClick={() => setForm({ ...form, active: !form.active })}
                  className={cn("relative h-7 w-12 rounded-full transition-colors", form.active ? "bg-primary" : "bg-gray-300")}>
                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", form.active ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {saving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
                {editing ? "Salvar" : "Criar Regra"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <FiAlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Excluir Regra de Frete</h3>
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir a regra <strong>{deleteTarget.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteMut.isPending}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
