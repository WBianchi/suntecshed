"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAdminClients, useAdminClient, type AdminClient } from "@/hooks/use-admin-clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEye,
  FiUsers, FiMail, FiPhone, FiMapPin, FiShoppingCart, FiStar,
  FiHeart, FiDollarSign, FiCalendar, FiUser, FiPackage,
  FiPlus, FiEdit2, FiSave, FiLoader, FiTrash2, FiAlertTriangle,
  FiEyeOff, FiLock,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 30) return `${days}d atrás`;
  if (days < 365) return `${Math.floor(days / 30)}m atrás`;
  return `${Math.floor(days / 365)}a atrás`;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  password: string;
  confirmPassword: string;
  isVip: boolean;
}

const emptyForm: ClientFormData = {
  name: "", email: "", phone: "", cpf: "", cnpj: "",
  street: "", number: "", complement: "", neighborhood: "",
  city: "", state: "", zipCode: "", password: "", confirmPassword: "",
  isVip: false,
};

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formClientId, setFormClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminClient | null>(null);

  const PAGE_SIZE = 10;
  const { data, isLoading, refetch } = useAdminClients({
    search: searchDebounced, sort: sortBy, order: sortOrder, page, limit: PAGE_SIZE,
  });

  const openEditForm = async (c: AdminClient) => {
    // Popula com o que já temos na lista e abre o modal, depois completa com o endereço
    // completo assim que a busca de detalhes retornar (evita perder dados ao salvar).
    setFormData({
      name: c.name, email: c.email, phone: c.phone || "", cpf: c.cpf || "",
      cnpj: c.cnpj || "", street: "", number: "", complement: "",
      neighborhood: "", city: c.city || "", state: c.state || "", zipCode: "",
      password: "", confirmPassword: "", isVip: c.isVip,
    });
    setFormClientId(c.id);
    setFormOpen(true);

    try {
      const res = await fetch(`/api/admin/clients/${c.id}`);
      if (!res.ok) return;
      const full = await res.json();
      setFormData({
        name: full.name, email: full.email, phone: full.phone || "", cpf: full.cpf || "",
        cnpj: full.cnpj || "", street: full.street || "", number: full.number || "",
        complement: full.complement || "", neighborhood: full.neighborhood || "",
        city: full.city || "", state: full.state || "", zipCode: full.zipCode || "",
        password: "", confirmPassword: "", isVip: full.isVip,
      });
    } catch {}
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__clientSearchTimer);
    (window as any).__clientSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("desc"); }
    setPage(1);
  };

  const clients = data?.clients || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} clientes cadastrados</p>
        </div>
        <button onClick={() => { setFormData(emptyForm); setFormClientId(null); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nome, email, telefone ou CPF..." />
          {search && <button onClick={() => { setSearch(""); setSearchDebounced(""); }} className="text-gray-400 hover:text-gray-600"><FiX className="h-4 w-4" /></button>}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => { setSortBy("totalPurchases"); setSortOrder("desc"); setPage(1); }}
            className={cn("rounded-xl border px-3 py-2 text-xs font-medium transition-all",
              sortBy === "totalPurchases" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
            <FiDollarSign className="mr-1 inline h-3 w-3" /> Maior Compra
          </button>
          <button onClick={() => { setSortBy("createdAt"); setSortOrder("desc"); setPage(1); }}
            className={cn("rounded-xl border px-3 py-2 text-xs font-medium transition-all",
              sortBy === "createdAt" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
            <FiCalendar className="mr-1 inline h-3 w-3" /> Mais Recente
          </button>
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
          <FiUsers className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum cliente encontrado</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchDebounced ? "Tente alterar a busca" : "Os clientes aparecerão aqui ao se cadastrarem"}
          </p>
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
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Localização</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("totalPurchases")}>
                    Total Compras {sortBy === "totalPurchases" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3">Pedidos</th>
                  <th className="px-5 py-3">Grupo VIP</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("createdAt")}>
                    Cadastro {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          {(c.cnpj || c.cpf) && <p className="text-[11px] text-gray-400">{c.cnpj ? `CNPJ: ${c.cnpj}` : c.cpf}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-600 truncate max-w-[180px]">{c.email}</p>
                      {c.phone && <p className="text-[11px] text-gray-400">{c.phone}</p>}
                    </td>
                    <td className="px-5 py-3">
                      {c.city && c.state ? (
                        <span className="text-xs text-gray-500">{c.city}/{c.state}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{formatBRL(c.totalPurchases)}</p>
                      {c.cashback > 0 && <p className="text-[10px] text-green-600">Saldo: {formatBRL(c.cashback)}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FiShoppingCart className="h-3 w-3" /> {c._count.orders}</span>
                        <span className="flex items-center gap-1"><FiStar className="h-3 w-3" /> {c._count.reviews}</span>
                        <span className="flex items-center gap-1"><FiHeart className="h-3 w-3" /> {c._count.favorites}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {c.isVip ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditForm(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Editar">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setSelectedClientId(c.id); setDetailOpen(true); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Detalhes">
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
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

      {/* Client Detail Modal */}
      {detailOpen && selectedClientId && (
        <ClientDetailModal clientId={selectedClientId} onClose={() => { setDetailOpen(false); setSelectedClientId(null); }} />
      )}

      {/* Client Form Modal (Add/Edit) */}
      {formOpen && (
        <ClientFormModal
          clientId={formClientId}
          data={formData}
          setData={setFormData}
          onClose={() => { setFormOpen(false); setFormClientId(null); }}
          onSaved={() => { setFormOpen(false); setFormClientId(null); refetch(); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteClientModal
          client={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// CLIENT DETAIL MODAL
// ═══════════════════════════════════════

const orderStatusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-50 text-yellow-700" },
  AWAITING_PAYMENT: { label: "Aguardando", color: "bg-orange-50 text-orange-700" },
  PAYMENT_CONFIRMED: { label: "Pago", color: "bg-blue-50 text-blue-700" },
  PROCESSING: { label: "Processando", color: "bg-indigo-50 text-indigo-700" },
  SHIPPED: { label: "Enviado", color: "bg-purple-50 text-purple-700" },
  DELIVERED: { label: "Entregue", color: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-700" },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600" },
  MISSING_LABEL: { label: "Ausência de Etiqueta", color: "bg-brand-50 text-brand-700" },
  ORDER_ERROR: { label: "Erro no Pedido", color: "bg-red-100 text-red-800" },
};

function ClientDetailModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { data: client, isLoading } = useAdminClient(clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Detalhes do Cliente</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : client ? (
          <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              {client.avatar ? (
                <img src={client.avatar} alt={client.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                  {client.isVip && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Grupo VIP</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiMail className="h-3 w-3" /> {client.email}</span>
                  {client.phone && <span className="flex items-center gap-1"><FiPhone className="h-3 w-3" /> {client.phone}</span>}
                </div>
                {client.cpf && <p className="text-xs text-gray-400 mt-0.5">CPF: {client.cpf}</p>}
                {client.cnpj && <p className="text-xs text-gray-400 mt-0.5">CNPJ: {client.cnpj}</p>}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total Compras", value: formatBRL(client.totalPurchases), icon: FiDollarSign },
                { label: "Pedidos", value: String(client._count.orders), icon: FiShoppingCart },
                { label: "Avaliações", value: String(client._count.reviews), icon: FiStar },
                { label: "Cliente desde", value: formatDate(client.createdAt), icon: FiCalendar },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-gray-100 p-3 text-center">
                  <s.icon className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                  <p className="text-sm font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            {client.street && (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">Endereço Principal</span>
                </div>
                <p className="text-sm text-gray-900">{client.street}, {client.number}</p>
                {client.complement && <p className="text-xs text-gray-500">{client.complement}</p>}
                <p className="text-xs text-gray-500">{client.neighborhood} — {client.city}/{client.state}</p>
                <p className="text-xs text-gray-500">CEP: {client.zipCode}</p>
              </div>
            )}

            {/* Recent Orders */}
            {client.orders?.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Últimos Pedidos</h3>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {client.orders.map((o: any) => {
                    const st = orderStatusLabels[o.status] || orderStatusLabels.PENDING;
                    return (
                      <div key={o.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                            <FiPackage className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <code className="text-xs font-bold text-gray-700">#{o.orderNumber}</code>
                            <p className="text-[11px] text-gray-400">{formatDate(o.createdAt)} · {o.items.length} {o.items.length === 1 ? "item" : "itens"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", st.color)}>{st.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatBRL(o.total)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Addresses */}
            {client.addresses?.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Endereços Cadastrados ({client.addresses.length})</h3>
                <div className="space-y-2">
                  {client.addresses.map((addr: any) => (
                    <div key={addr.id} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-700">{addr.label || addr.name}</p>
                        {addr.isDefault && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">Padrão</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.street}, {addr.number} — {addr.city}/{addr.state} — CEP: {addr.zipCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400">Cliente não encontrado</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CLIENT FORM MODAL (ADD / EDIT)
// ═══════════════════════════════════════

function ClientFormModal({
  clientId, data, setData, onClose, onSaved,
}: {
  clientId: string | null;
  data: ClientFormData;
  setData: (d: ClientFormData) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const isEdit = !!clientId;

  const saveMut = useMutation({
    mutationFn: async () => {
      const url = isEdit ? `/api/admin/clients/${clientId}` : "/api/admin/clients";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => onSaved(),
    onError: (err: Error) => setError(err.message),
  });

  const set = (key: keyof ClientFormData, val: string) => {
    setData({ ...data, [key]: val });
    setError("");
  };

  const handleSave = () => {
    if (!data.name.trim()) { setError("Nome é obrigatório"); return; }
    if (!data.email.trim()) { setError("E-mail é obrigatório"); return; }
    if (!isEdit && !data.password) { setError("Senha é obrigatória para novo cliente"); return; }
    if (data.password && data.password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    if (data.password && data.password !== data.confirmPassword) { setError("As senhas não coincidem"); return; }
    saveMut.mutate();
  };

  const Field = ({ label, field, placeholder, type = "text", span2 = false }: {
    label: string; field: Exclude<keyof ClientFormData, "isVip">; placeholder?: string; type?: string; span2?: boolean;
  }) => (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 text-xs font-semibold text-gray-600">{label}</label>
      <input type={type} value={data[field]} onChange={(e) => set(field, e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder={placeholder} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar Cliente" : "Novo Cliente"}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>
          )}

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><FiUser className="h-4 w-4" /> Dados Pessoais</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome *" field="name" placeholder="Nome completo" span2 />
              <Field label="E-mail *" field="email" placeholder="email@exemplo.com" type="email" />
              <Field label="Telefone" field="phone" placeholder="(62) 99999-9999" />
              <Field label="CPF" field="cpf" placeholder="000.000.000-00" />
              <Field label="CNPJ" field="cnpj" placeholder="00.000.000/0001-00" />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Grupo VIP</p>
                <p className="text-xs text-gray-400">Aprovação manual — libera o preço de Grupo VIP nos produtos.</p>
              </div>
              <button
                type="button"
                onClick={() => setData({ ...data, isVip: !data.isVip })}
                className={cn("relative h-7 w-12 rounded-full transition-colors", data.isVip ? "bg-primary" : "bg-gray-300")}
              >
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", data.isVip ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><FiLock className="h-4 w-4" /> Senha</h3>
            {isEdit && (
              <p className="mb-3 text-[11px] text-gray-400">Deixe em branco para manter a senha atual.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <PasswordField label={isEdit ? "Nova Senha" : "Senha *"} field="password" placeholder="Mínimo 6 caracteres" data={data} set={set} />
              <PasswordField label="Confirmar Senha" field="confirmPassword" placeholder="Repita a senha" data={data} set={set} />
            </div>
            {data.password && data.confirmPassword && data.password !== data.confirmPassword && (
              <p className="mt-1.5 text-[11px] font-medium text-red-500">As senhas não coincidem</p>
            )}
            {data.password && data.confirmPassword && data.password === data.confirmPassword && data.password.length >= 6 && (
              <p className="mt-1.5 text-[11px] font-medium text-green-600">✓ Senhas coincidem</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><FiMapPin className="h-4 w-4" /> Endereço</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rua" field="street" placeholder="Rua, Avenida..." span2 />
              <Field label="Número" field="number" placeholder="123" />
              <Field label="Complemento" field="complement" placeholder="Apto, Bloco..." />
              <Field label="Bairro" field="neighborhood" placeholder="Centro" />
              <Field label="Cidade" field="city" placeholder="São Paulo" />
              <Field label="Estado" field="state" placeholder="GO" />
              <Field label="CEP" field="zipCode" placeholder="74000-000" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saveMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
            {saveMut.isPending ? "Salvando..." : isEdit ? "Atualizar" : "Criar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PASSWORD FIELD (with toggle visibility)
// ═══════════════════════════════════════

function PasswordField({ label, field, placeholder, data, set }: {
  label: string;
  field: Exclude<keyof ClientFormData, "isVip">;
  placeholder?: string;
  data: ClientFormData;
  set: (key: keyof ClientFormData, val: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 text-xs font-semibold text-gray-600">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={data[field]} onChange={(e) => set(field, e.target.value)}
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary" placeholder={placeholder} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DELETE CONFIRMATION MODAL
// ═══════════════════════════════════════

function DeleteClientModal({ client, onClose, onDeleted }: {
  client: AdminClient;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir");
      }
      return res.json();
    },
    onSuccess: () => onDeleted(),
    onError: (err: Error) => setError(err.message),
  });

  const canDelete = confirmText.toLowerCase() === "excluir";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <FiAlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Excluir Cliente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tem certeza que deseja excluir <strong>{client.name}</strong>?
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Esta ação é irreversível. Todos os dados do cliente serão removidos permanentemente.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>
          )}

          <div className="text-left">
            <label className="mb-1.5 text-xs font-semibold text-gray-600">
              Digite <strong className="text-red-600">excluir</strong> para confirmar
            </label>
            <input value={confirmText} onChange={(e) => { setConfirmText(e.target.value); setError(""); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-400" placeholder="excluir" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={() => deleteMut.mutate()} disabled={!canDelete || deleteMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {deleteMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
            {deleteMut.isPending ? "Excluindo..." : "Excluir Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
