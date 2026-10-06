"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useAdminVip, useActivateVip, useUpdateVip, type VipMember,
} from "@/hooks/use-admin-vip";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight, FiPlus,
  FiAward, FiUsers, FiClock, FiLoader, FiCheck, FiUserPlus,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function timeRemaining(expiresAt: string | null): { label: string; expired: boolean } {
  if (!expiresAt) return { label: "—", expired: true };
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: "Expirado", expired: true };
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return { label: "1 dia", expired: false };
  if (days < 30) return { label: `${days} dias`, expired: false };
  const months = Math.round(days / 30);
  return { label: `${months} ${months === 1 ? "mês" : "meses"}`, expired: false };
}

const durationOptions = [
  { label: "30 dias (1 mês)", value: 30 },
  { label: "90 dias (3 meses)", value: 90 },
  { label: "180 dias (6 meses)", value: 180 },
  { label: "365 dias (1 ano)", value: 365 },
];

const PAGE_SIZE = 10;

export default function AdminGrupoVipPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<VipMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<VipMember | null>(null);

  const { data, isLoading, refetch } = useAdminVip({ search: searchDebounced, page, limit: PAGE_SIZE });
  const updateMut = useUpdateVip();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__vipSearchTimer);
    (window as any).__vipSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await updateMut.mutateAsync({ id: deactivateTarget.id, action: "deactivate" });
      setDeactivateTarget(null);
    } catch {}
  };

  const members = data?.members || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const stats = data?.stats || { active: 0, expiringSoon: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FaCrown className="h-5 w-5 text-primary" /> Grupo VIP
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Gerencie os clientes com preço especial de Grupo VIP</p>
        </div>
        <button onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Adicionar VIP
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <FiAward className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Membros Ativos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <FiClock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Expirando em 7 dias</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-brand-600">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nome ou email..." />
          {search && <button onClick={() => { setSearch(""); setSearchDebounced(""); }} className="text-gray-400 hover:text-gray-600"><FiX className="h-4 w-4" /></button>}
        </div>
        <button onClick={() => refetch()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && members.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FaCrown className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum membro VIP encontrado</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchDebounced ? "Tente alterar a busca" : "Clique em \"Adicionar VIP\" para ativar o primeiro membro"}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && members.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Usuário</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Expira em</th>
                  <th className="px-5 py-3">Tempo Restante</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const remaining = timeRemaining(m.vipExpiresAt);
                  const active = m.isVip && !remaining.expired;
                  return (
                    <tr key={m.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-gray-600">{m.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        {active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            <FiCheck className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                            {m.isVip ? "Expirado" : "Desativado"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-500">{formatDate(m.vipExpiresAt)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs font-medium", remaining.expired ? "text-red-500" : "text-gray-600")}>
                          {remaining.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setExtendTarget(m)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary">
                            Estender
                          </button>
                          {active && (
                            <button onClick={() => setDeactivateTarget(m)}
                              className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                              Desativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">
            Mostrando <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–<strong>{Math.min(page * PAGE_SIZE, total)}</strong> de <strong>{total}</strong>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <FiChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pn = page <= 3 ? i + 1 : page + i - 2;
              if (pn < 1 || pn > totalPages) return null;
              return (
                <button key={pn} onClick={() => setPage(pn)}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium", page === pn ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50")}>
                  {pn}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add VIP Modal */}
      {addModalOpen && <AddVipModal onClose={() => setAddModalOpen(false)} />}

      {/* Extend Modal */}
      {extendTarget && <ExtendVipModal member={extendTarget} onClose={() => setExtendTarget(null)} />}

      {/* Deactivate Confirm */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeactivateTarget(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="p-6 text-center space-y-3">
              <h3 className="text-lg font-bold text-gray-900">Desativar Grupo VIP</h3>
              <p className="text-sm text-gray-500">
                Tem certeza que deseja desativar o VIP de <strong>{deactivateTarget.name}</strong>? O preço especial deixará de ser aplicado imediatamente.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setDeactivateTarget(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDeactivate} disabled={updateMut.isPending}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {updateMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
                Desativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ADD VIP MODAL
// ═══════════════════════════════════════

interface ClientSearchResult {
  id: string;
  name: string;
  email: string;
  isVip: boolean;
}

function AddVipModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ClientSearchResult | null>(null);
  const [duration, setDuration] = useState(365);
  const [error, setError] = useState("");
  const activateMut = useActivateVip();

  const handleSearch = (val: string) => {
    setQuery(val);
    setSelected(null);
    clearTimeout((window as any).__vipAddSearchTimer);
    if (val.trim().length < 2) { setResults([]); return; }
    (window as any).__vipAddSearchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/clients?search=${encodeURIComponent(val)}&limit=8`);
        const data = await res.json();
        setResults(data.clients || []);
      } catch {} finally { setSearching(false); }
    }, 400);
  };

  const handleActivate = async () => {
    if (!selected) { setError("Selecione um cliente"); return; }
    try {
      await activateMut.mutateAsync({ userId: selected.id, durationDays: duration });
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><FiUserPlus className="h-4 w-4" /> Adicionar VIP</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Buscar Usuário</label>
            <div className="relative">
              <input value={query} onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Digite nome ou email..." />
              {searching && <FiLoader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
            </div>

            {results.length > 0 && !selected && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-100">
                {results.map((r) => (
                  <button key={r.id} onClick={() => { setSelected(r); setResults([]); setQuery(r.name); }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </div>
                    {r.isVip && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Já é VIP</span>}
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/5 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-xs text-gray-500">{selected.email}</p>
                </div>
                <button onClick={() => { setSelected(null); setQuery(""); }} className="text-gray-400 hover:text-gray-600">
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Duração (dias)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary">
              {durationOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleActivate} disabled={activateMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {activateMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
            Ativar VIP
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EXTEND VIP MODAL
// ═══════════════════════════════════════

function ExtendVipModal({ member, onClose }: { member: VipMember; onClose: () => void }) {
  const [duration, setDuration] = useState(365);
  const [error, setError] = useState("");
  const updateMut = useUpdateVip();

  const handleExtend = async () => {
    try {
      await updateMut.mutateAsync({ id: member.id, action: "extend", durationDays: duration });
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Estender VIP</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}
          <p className="text-sm text-gray-600">
            Estendendo o VIP de <strong>{member.name}</strong>. A nova validade é calculada a partir de hoje ou da expiração atual, o que for mais tarde.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Duração adicional (dias)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary">
              {durationOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleExtend} disabled={updateMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {updateMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
            Estender
          </button>
        </div>
      </div>
    </div>
  );
}
