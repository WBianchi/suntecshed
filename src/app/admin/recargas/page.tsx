"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  useAdminWallet, useAdminWalletDetail, useAdminWalletTransaction, type WalletClient,
} from "@/hooks/use-admin-wallet";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight, FiDollarSign,
  FiUsers, FiLoader, FiCheck, FiPlus, FiMinus, FiClock,
} from "react-icons/fi";

const PAGE_SIZE = 10;

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Ajuste manual",
  RECHARGE_PIX: "Recarga via Pix",
  RECHARGE_CARD: "Recarga via cartão",
  ORDER_CASHBACK: "Crédito de pedido",
  ORDER_PAYMENT: "Pagamento com saldo",
  MIGRATION: "Importado (site antigo)",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminRecargasPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [detailTarget, setDetailTarget] = useState<WalletClient | null>(null);

  const { data, isLoading, refetch } = useAdminWallet({ search: searchDebounced, page, limit: PAGE_SIZE });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__walletSearchTimer);
    (window as any).__walletSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const clients = data?.clients || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const stats = data?.stats || { totalBalance: 0, withBalanceCount: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FiDollarSign className="h-5 w-5 text-primary" /> Recargas
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Saldo de carteira dos clientes — credite, debite e acompanhe o extrato</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <FiDollarSign className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Total</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <FiUsers className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Com Saldo</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.withBalanceCount}</p>
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
      {!isLoading && clients.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum cliente encontrado</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && clients.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Saldo</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-600">{c.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-sm font-bold", c.cashback > 0 ? "text-green-600" : "text-gray-400")}>
                        {formatCurrency(c.cashback)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDetailTarget(c)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary">
                        Ver / Ajustar
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* Detail / Adjust Modal */}
      {detailTarget && <WalletDetailModal client={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════
// DETAIL / ADJUST MODAL
// ═══════════════════════════════════════

function WalletDetailModal({ client, onClose }: { client: WalletClient; onClose: () => void }) {
  const [action, setAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useAdminWalletDetail(client.id);
  const mutation = useAdminWalletTransaction();

  const currentBalance = data?.user.cashback ?? client.cashback;
  const transactions = data?.transactions || [];

  const handleSubmit = async () => {
    setError("");
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) { setError("Informe um valor válido"); return; }
    try {
      await mutation.mutateAsync({ userId: client.id, type: action, amount: value, description });
      setAmount("");
      setDescription("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
            <p className="text-xs text-gray-400">{client.email}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}

          {/* Balance */}
          <div className="rounded-xl bg-gray-50/70 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Saldo Atual</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{formatCurrency(currentBalance)}</p>
          </div>

          {/* Adjust form */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setAction("CREDIT")}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition-colors",
                  action === "CREDIT" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500")}>
                <FiPlus className="h-4 w-4" /> Creditar
              </button>
              <button onClick={() => setAction("DEBIT")}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition-colors",
                  action === "DEBIT" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500")}>
                <FiMinus className="h-4 w-4" /> Debitar
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Valor (R$)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00" inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Descrição (opcional)</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: ajuste referente ao pedido X"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <button onClick={handleSubmit} disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
              Confirmar {action === "CREDIT" ? "crédito" : "débito"}
            </button>
          </div>

          {/* History */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Extrato</h4>
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="h-5 w-5 animate-spin text-gray-300" /></div>
            ) : transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
                <FiClock className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-xs text-gray-400">Nenhuma transação ainda</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-900">
                        {t.description || SOURCE_LABELS[t.source] || t.source}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatDateTime(t.createdAt)} · {SOURCE_LABELS[t.source] || t.source}</p>
                    </div>
                    <span className={cn("shrink-0 text-xs font-bold", t.type === "CREDIT" ? "text-green-600" : "text-red-500")}>
                      {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
