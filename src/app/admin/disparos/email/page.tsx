"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminClients } from "@/hooks/use-admin-clients";
import {
  FiMail, FiPlus, FiSave, FiLoader, FiTrash2, FiSend, FiClock,
  FiEdit2, FiX, FiZap, FiUsers, FiUser, FiFileText, FiCalendar,
  FiCheck, FiAlertTriangle, FiEye, FiChevronDown,
} from "react-icons/fi";

// ═══════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════

function useEmailTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/disparos/email/templates");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

function useEmailCampaigns() {
  return useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/disparos/email/campaigns");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

// ═══════════════════════════════════════
// PAGE
// ═══════════════════════════════════════

export default function EmailDisparosPage() {
  const [tab, setTab] = useState<"templates" | "campaigns">("templates");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disparos por E-mail</h1>
        <p className="mt-0.5 text-sm text-gray-500">Crie templates, campanhas e envie e-mails para seus clientes</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(["templates", "campaigns"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t === "templates" ? <><FiFileText className="h-4 w-4" /> Templates</> : <><FiSend className="h-4 w-4" /> Campanhas</>}
          </button>
        ))}
      </div>

      {tab === "templates" ? <TemplatesTab /> : <CampaignsTab />}
    </div>
  );
}

// ═══════════════════════════════════════
// TEMPLATES TAB
// ═══════════════════════════════════════

function TemplatesTab() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useEmailTemplates();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", footer: "" });
  const [generating, setGenerating] = useState(false);
  const [aiPurpose, setAiPurpose] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      const url = editId ? `/api/admin/disparos/email/templates/${editId}` : "/api/admin/disparos/email/templates";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/disparos/email/templates/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const resetForm = () => {
    setForm({ name: "", subject: "", body: "", footer: "" });
    setEditId(null);
    setFormOpen(false);
    setAiPurpose("");
  };

  const openEdit = (t: any) => {
    setForm({ name: t.name, subject: t.subject, body: t.body, footer: t.footer || "" });
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
        body: JSON.stringify({ channel: "email", purpose: aiPurpose, storeName: "C7 Drop" }),
      });
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setForm((f) => ({
        ...f,
        subject: data.subject || f.subject,
        body: data.body || f.body,
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
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Novo Template
        </button>
      </div>

      {templates.length === 0 && !formOpen && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <FiMail className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">Nenhum template criado</p>
          <p className="text-xs text-gray-400">Crie seu primeiro template para começar os disparos</p>
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
          <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiZap className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700">Gerar com DeepSeek IA</span>
            </div>
            <div className="flex gap-2">
              <input value={aiPurpose} onChange={(e) => setAiPurpose(e.target.value)}
                className="flex-1 rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                placeholder="Ex: Promoção de inverno com 30% off em edredons" />
              <button onClick={generateWithAI} disabled={generating || !aiPurpose.trim()}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
                {generating ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiZap className="h-4 w-4" />}
                {generating ? "Gerando..." : "Gerar"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Nome do Template *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Ex: Promoção Inverno" />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Assunto do E-mail *</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Ex: 🔥 Promoção especial só para você!" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Corpo do E-mail (HTML) *</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary font-mono"
              placeholder='<p>Olá {{nome}},</p><p>Temos uma oferta especial...</p>' />
            <p className="mt-1 text-[10px] text-gray-400">Use {"{{nome}}"} para nome do cliente. Suporta HTML.</p>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Rodapé</label>
            <input value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="C7 Drop — Conforto para sua casa" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name || !form.subject || !form.body}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              {saveMut.isPending ? "Salvando..." : editId ? "Atualizar" : "Criar Template"}
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid gap-3">
        {templates.map((t: any) => (
          <div key={t.id} className="group rounded-2xl border border-gray-100 bg-white p-5 hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                <p className="mt-0.5 text-xs text-gray-500">Assunto: {t.subject}</p>
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
                <button onClick={() => { if (confirm("Excluir este template?")) deleteMut.mutate(t.id); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {previewId === t.id && (
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Preview do corpo</p>
                <div className="prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: t.body }} />
                {t.footer && <p className="mt-3 border-t pt-2 text-[11px] text-gray-400">{t.footer}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CAMPAIGNS TAB
// ═══════════════════════════════════════

function CampaignsTab() {
  const qc = useQueryClient();
  const { data: campaigns = [], isLoading } = useEmailCampaigns();
  const { data: templates = [] } = useEmailTemplates();
  const { data: clientsData } = useAdminClients({ limit: 500 });
  const clients = clientsData?.clients || [];

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", templateId: "", recipientType: "all" as string, recipientIds: [] as string[], scheduledAt: "" });
  const [sendingId, setSendingId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/disparos/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-campaigns"] });
      setFormOpen(false);
      setForm({ name: "", templateId: "", recipientType: "all", recipientIds: [], scheduledAt: "" });
    },
  });

  const sendMut = useMutation({
    mutationFn: async (campaignId: string) => {
      setSendingId(campaignId);
      const res = await fetch("/api/admin/disparos/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Envio concluído!\n✅ Enviados: ${data.totalSent}\n❌ Falhas: ${data.totalFailed}`);
      qc.invalidateQueries({ queryKey: ["email-campaigns"] });
      setSendingId(null);
    },
    onError: (err: Error) => { alert(err.message); setSendingId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/disparos/email/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-campaigns"] }),
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
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
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
            <h3 className="text-sm font-bold text-gray-900">Nova Campanha</h3>
            <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX className="h-5 w-5" /></button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Nome da Campanha *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Ex: Black Friday 2025" />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Template *</label>
              <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Selecione...</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Destinatários</label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "Todos os clientes", icon: FiUsers },
                { value: "specific", label: "Clientes específicos", icon: FiUser },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setForm({ ...form, recipientType: opt.value, recipientIds: [] })}
                  className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                    form.recipientType === opt.value ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                  <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.recipientType === "specific" && (
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Selecione os clientes ({form.recipientIds.length} selecionados)</label>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {clients.map((c: any) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.recipientIds.includes(c.id)} onChange={() => toggleRecipient(c.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-700">{c.name}</p>
                      <p className="truncate text-[10px] text-gray-400">{c.email}</p>
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
            <p className="mt-1 text-[10px] text-gray-400">Deixe em branco para criar como rascunho e enviar manualmente</p>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setFormOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.name || !form.templateId}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
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
                    <button onClick={() => { if (confirm("Enviar esta campanha agora?")) sendMut.mutate(c.id); }}
                      disabled={sendingId === c.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {sendingId === c.id ? <FiLoader className="h-3 w-3 animate-spin" /> : <FiSend className="h-3 w-3" />}
                      Enviar
                    </button>
                  )}
                  {c.status !== "sending" && (
                    <button onClick={() => { if (confirm("Excluir esta campanha?")) deleteMut.mutate(c.id); }}
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
