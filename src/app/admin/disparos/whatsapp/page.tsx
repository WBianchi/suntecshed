"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminClients } from "@/hooks/use-admin-clients";
import {
  FiMessageSquare, FiPlus, FiSave, FiLoader, FiTrash2, FiSend, FiClock,
  FiEdit2, FiX, FiZap, FiUsers, FiUser, FiFileText, FiCalendar,
  FiCheck, FiAlertTriangle, FiEye, FiWifi, FiWifiOff, FiRefreshCw,
  FiSmartphone, FiCheckCircle,
} from "react-icons/fi";

// ═══════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════

function useWhatsAppStatus() {
  return useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/disparos/whatsapp/qr");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/disparos/whatsapp/templates");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

function useWhatsAppCampaigns() {
  return useQuery({
    queryKey: ["whatsapp-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/disparos/whatsapp/campaigns");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

// ═══════════════════════════════════════
// PAGE
// ═══════════════════════════════════════

export default function WhatsAppDisparosPage() {
  const { data: waStatus, isLoading: statusLoading } = useWhatsAppStatus();
  const isConnected = waStatus?.status === "connected";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disparos por WhatsApp</h1>
        <p className="mt-0.5 text-sm text-gray-500">Conecte seu WhatsApp, crie templates e envie mensagens para seus clientes</p>
      </div>

      {/* Connection Status Card */}
      <ConnectionCard status={waStatus} isLoading={statusLoading} />

      {/* Content — only if connected */}
      {isConnected ? <WhatsAppContent /> : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <FiWifiOff className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">Conecte seu WhatsApp para acessar os disparos</p>
          <p className="text-xs text-gray-400">Use o QR code acima para conectar</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// CONNECTION CARD
// ═══════════════════════════════════════

function ConnectionCard({ status, isLoading }: { status: any; isLoading: boolean }) {
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const connectMut = useMutation({
    mutationFn: async () => {
      setConnecting(true);
      const res = await fetch("/api/admin/disparos/whatsapp/qr", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao conectar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-status"] });
      setConnecting(false);
    },
    onError: () => setConnecting(false),
  });

  const isConnected = status?.status === "connected";
  const isConnecting = status?.status === "connecting";
  const qrCode = status?.qrCode;

  return (
    <div className={cn(
      "rounded-2xl border p-6 transition-all",
      isConnected ? "border-green-200 bg-green-50/50" : "border-gray-100 bg-white"
    )}>
      <div className="flex items-start gap-6">
        {/* Status Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl",
              isConnected ? "bg-green-500" : "bg-gray-200")}>
              {isConnected ? <FiWifi className="h-5 w-5 text-white" /> : <FiSmartphone className="h-5 w-5 text-gray-500" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {isConnected ? "WhatsApp Conectado" : isConnecting ? "Conectando..." : "WhatsApp Desconectado"}
              </h3>
              <p className="text-xs text-gray-500">
                {isConnected ? `Número: ${status?.phone || "—"}` : "Escaneie o QR code para conectar"}
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <FiCheckCircle className="h-3 w-3" /> Online
              </span>
            </div>
          )}

          {!isConnected && (
            <button onClick={() => connectMut.mutate()} disabled={connecting || connectMut.isPending}
              className="mt-3 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {connecting || connectMut.isPending
                ? <><FiLoader className="h-4 w-4 animate-spin" /> Gerando QR Code...</>
                : <><FiRefreshCw className="h-4 w-4" /> {isConnecting ? "Atualizar QR Code" : "Conectar WhatsApp"}</>}
            </button>
          )}
        </div>

        {/* QR Code */}
        {isConnecting && qrCode && (
          <div className="shrink-0">
            <div className="rounded-xl border-2 border-green-200 bg-white p-3">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                alt="QR Code" className="h-[180px] w-[180px]" />
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">Escaneie com seu WhatsApp</p>
          </div>
        )}

        {isLoading && (
          <div className="flex h-[180px] w-[180px] items-center justify-center">
            <FiLoader className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// WHATSAPP CONTENT (Templates + Campaigns)
// ═══════════════════════════════════════

function WhatsAppContent() {
  const [tab, setTab] = useState<"templates" | "campaigns">("templates");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(["templates", "campaigns"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t === "templates" ? <><FiFileText className="h-4 w-4" /> Templates</> : <><FiSend className="h-4 w-4" /> Campanhas</>}
          </button>
        ))}
      </div>

      {tab === "templates" ? <WATemplatesTab /> : <WACampaignsTab />}
    </div>
  );
}

// ═══════════════════════════════════════
// WA TEMPLATES TAB
// ═══════════════════════════════════════

function WATemplatesTab() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useWhatsAppTemplates();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", message: "", footer: "" });
  const [generating, setGenerating] = useState(false);
  const [aiPurpose, setAiPurpose] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      const url = editId ? `/api/admin/disparos/whatsapp/templates/${editId}` : "/api/admin/disparos/whatsapp/templates";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/disparos/whatsapp/templates/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-templates"] }),
  });

  const resetForm = () => {
    setForm({ name: "", message: "", footer: "" });
    setEditId(null);
    setFormOpen(false);
    setAiPurpose("");
  };

  const openEdit = (t: any) => {
    setForm({ name: t.name, message: t.message, footer: t.footer || "" });
    setEditId(t.id);
    setFormOpen(true);
  };

  const generateWithAI = async () => {
    if (!aiPurpose.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/ai/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whatsapp", purpose: aiPurpose, storeName: "C7 Drop" }),
      });
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setForm((f) => ({
        ...f,
        message: data.body || f.message,
        footer: data.footer || f.footer,
      }));
    } catch { alert("Erro ao gerar com IA"); }
    finally { setGenerating(false); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><FiLoader className="h-6 w-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
          <FiPlus className="h-4 w-4" /> Novo Template
        </button>
      </div>

      {templates.length === 0 && !formOpen && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <FiMessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">Nenhum template criado</p>
        </div>
      )}

      {/* Template Form */}
      {formOpen && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">{editId ? "Editar Template" : "Novo Template"}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><FiX className="h-5 w-5" /></button>
          </div>

          {/* AI Generator */}
          <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiZap className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">Gerar com DeepSeek IA</span>
            </div>
            <div className="flex gap-2">
              <input value={aiPurpose} onChange={(e) => setAiPurpose(e.target.value)}
                className="flex-1 rounded-lg border border-green-200 px-3 py-2 text-sm outline-none focus:border-green-400"
                placeholder="Ex: Lembrar clientes sobre promoção de eletrônicos" />
              <button onClick={generateWithAI} disabled={generating || !aiPurpose.trim()}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                {generating ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiZap className="h-4 w-4" />}
                {generating ? "Gerando..." : "Gerar"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Nome do Template *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Ex: Promoção Eletrônicos" />
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Mensagem *</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder={"Olá {{nome}}! 👋\n\nTemos uma novidade incrível pra você..."} />
            <p className="mt-1 text-[10px] text-gray-400">Use {"{{nome}}"} para nome do cliente. Sem HTML, use emojis para destaque.</p>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Rodapé</label>
            <input value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="C7 Drop ✨" />
          </div>

          {/* Preview */}
          {form.message && (
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Preview</label>
              <div className="rounded-2xl bg-[#e5ddd5] p-4">
                <div className="max-w-[80%] rounded-lg rounded-tl-none bg-white p-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{form.message.replace(/\{\{nome\}\}/gi, "João")}</p>
                  {form.footer && <p className="mt-2 text-[11px] text-gray-400">{form.footer}</p>}
                  <p className="mt-1 text-right text-[10px] text-gray-400">14:32 ✓✓</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name || !form.message}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              {saveMut.isPending ? "Salvando..." : editId ? "Atualizar" : "Criar Template"}
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid gap-3">
        {templates.map((t: any) => (
          <div key={t.id} className="group rounded-2xl border border-gray-100 bg-white p-5 hover:border-green-200 transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{t.message}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                  <span>{t._count?.campaigns || 0} campanhas</span>
                  <span>Criado em {new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                  <FiEye className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(t)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600">
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button onClick={() => { if (confirm("Excluir?")) deleteMut.mutate(t.id); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {previewId === t.id && (
              <div className="mt-3 rounded-2xl bg-[#e5ddd5] p-4">
                <div className="max-w-[80%] rounded-lg rounded-tl-none bg-white p-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{t.message}</p>
                  {t.footer && <p className="mt-2 text-[11px] text-gray-400">{t.footer}</p>}
                  <p className="mt-1 text-right text-[10px] text-gray-400">14:32 ✓✓</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// WA CAMPAIGNS TAB
// ═══════════════════════════════════════

function WACampaignsTab() {
  const qc = useQueryClient();
  const { data: campaigns = [], isLoading } = useWhatsAppCampaigns();
  const { data: templates = [] } = useWhatsAppTemplates();
  const { data: clientsData } = useAdminClients({ limit: 500 });
  const clients = (clientsData?.clients || []).filter((c: any) => c.phone);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", templateId: "", recipientType: "all" as string, recipientIds: [] as string[], scheduledAt: "" });
  const [sendingId, setSendingId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/disparos/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      setFormOpen(false);
      setForm({ name: "", templateId: "", recipientType: "all", recipientIds: [], scheduledAt: "" });
    },
  });

  const sendMut = useMutation({
    mutationFn: async (campaignId: string) => {
      setSendingId(campaignId);
      const res = await fetch("/api/admin/disparos/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Envio concluído!\n✅ Enviados: ${data.totalSent}\n❌ Falhas: ${data.totalFailed}`);
      qc.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      setSendingId(null);
    },
    onError: (err: Error) => { alert(err.message); setSendingId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/disparos/whatsapp/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-campaigns"] }),
  });

  const toggleRecipient = (id: string) => {
    setForm((f) => ({
      ...f,
      recipientIds: f.recipientIds.includes(id) ? f.recipientIds.filter((r) => r !== id) : [...f.recipientIds, id],
    }));
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600", icon: FiFileText },
    scheduled: { label: "Agendado", color: "bg-blue-50 text-blue-600", icon: FiClock },
    sending: { label: "Enviando", color: "bg-amber-50 text-amber-600", icon: FiLoader },
    sent: { label: "Enviado", color: "bg-green-50 text-green-600", icon: FiCheck },
    failed: { label: "Falhou", color: "bg-red-50 text-red-600", icon: FiAlertTriangle },
  };

  if (isLoading) return <div className="flex justify-center py-20"><FiLoader className="h-6 w-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setFormOpen(true)} disabled={templates.length === 0}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
          <FiPlus className="h-4 w-4" /> Nova Campanha
        </button>
      </div>

      {templates.length === 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
          <strong>Atenção:</strong> Crie pelo menos um template antes de criar campanhas.
        </div>
      )}

      {/* Campaign Form */}
      {formOpen && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Nova Campanha WhatsApp</h3>
            <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX className="h-5 w-5" /></button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Nome da Campanha *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Ex: Promoção Eletrônicos Premium" />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Template *</label>
              <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Selecione...</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Destinatários</label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "Todos com telefone", icon: FiUsers },
                { value: "specific", label: "Específicos", icon: FiUser },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setForm({ ...form, recipientType: opt.value, recipientIds: [] })}
                  className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                    form.recipientType === opt.value ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                  <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                </button>
              ))}
            </div>
            {form.recipientType === "all" && (
              <p className="mt-1.5 text-[10px] text-gray-400">{clients.length} clientes com telefone cadastrado</p>
            )}
          </div>

          {form.recipientType === "specific" && (
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Selecione os clientes ({form.recipientIds.length} selecionados)</label>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {clients.map((c: any) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.recipientIds.includes(c.id)} onChange={() => toggleRecipient(c.id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-700">{c.name}</p>
                      <p className="truncate text-[10px] text-gray-400">{c.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Agendar para (opcional)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setFormOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.name || !form.templateId}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {createMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              Criar Campanha
            </button>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 && !formOpen && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <FiSend className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">Nenhuma campanha criada</p>
        </div>
      )}

      <div className="grid gap-3">
        {campaigns.map((c: any) => {
          const st = statusConfig[c.status] || statusConfig.draft;
          const StIcon = st.icon;
          return (
            <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{c.name}</h4>
                    <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", st.color)}>
                      <StIcon className={cn("h-3 w-3", c.status === "sending" && "animate-spin")} /> {st.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">Template: {c.template?.name}</p>
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiUsers className="h-3 w-3" /> {c.recipientType === "all" ? "Todos" : `${c.recipientIds?.length || 0} selecionados`}
                    </span>
                    {c.scheduledAt && (
                      <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" /> {new Date(c.scheduledAt).toLocaleString("pt-BR")}</span>
                    )}
                    {c.status === "sent" && (
                      <span className="flex items-center gap-1">
                        <FiCheck className="h-3 w-3 text-green-500" /> {c.totalSent} enviados {c.totalFailed > 0 && `· ${c.totalFailed} falhas`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <button onClick={() => { if (confirm("Enviar agora?")) sendMut.mutate(c.id); }}
                      disabled={sendingId === c.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {sendingId === c.id ? <FiLoader className="h-3 w-3 animate-spin" /> : <FiSend className="h-3 w-3" />}
                      Enviar
                    </button>
                  )}
                  {c.status !== "sending" && (
                    <button onClick={() => { if (confirm("Excluir?")) deleteMut.mutate(c.id); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
