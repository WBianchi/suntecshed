"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIntegration, useSaveIntegration } from "@/hooks/use-admin-integrations";
import { FiSave, FiLoader, FiCheck, FiEyeOff, FiEye } from "react-icons/fi";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "password" | "textarea" | "select" | "toggle";
  placeholder?: string;
  options?: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
}

interface IntegrationPageProps {
  provider: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  docsUrl?: string;
  fields: FieldDef[];
}

export function IntegrationPage({ provider, title, description, icon, docsUrl, fields }: IntegrationPageProps) {
  const { data, isLoading } = useIntegration(provider);
  const saveMut = useSaveIntegration();
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setConfig(data.config || {});
    }
  }, [data]);

  const setField = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await saveMut.mutateAsync({ provider, enabled, config });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  const togglePasswordVisibility = (key: string) => {
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Documentação ↗
          </a>
        )}
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">Ativar integração</p>
          <p className="text-xs text-gray-400 mt-0.5">Habilitar ou desabilitar esta integração no sistema</p>
        </div>
        <button onClick={() => { setEnabled(!enabled); setSaved(false); }}
          className={cn("relative h-7 w-12 rounded-full transition-colors duration-200",
            enabled ? "bg-green-500" : "bg-gray-300"
          )}>
          <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
      </div>

      {/* Fields */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Configurações</h2>

        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-600">
              {f.label}
              {f.required && <span className="text-red-400">*</span>}
            </label>

            {f.type === "textarea" ? (
              <textarea
                value={config[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder={f.placeholder}
              />
            ) : f.type === "select" ? (
              <select
                value={config[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Selecione...</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === "toggle" ? (
              <button onClick={() => setField(f.key, !config[f.key])}
                className={cn("relative h-7 w-12 rounded-full transition-colors duration-200",
                  config[f.key] ? "bg-green-500" : "bg-gray-300"
                )}>
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
                  config[f.key] ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            ) : f.type === "password" ? (
              <div className="relative">
                <input
                  type={showPasswords[f.key] ? "text" : "password"}
                  value={config[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={f.placeholder}
                />
                <button onClick={() => togglePasswordVisibility(f.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPasswords[f.key] ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={config[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder={f.placeholder}
              />
            )}

            {f.hint && <p className="mt-1 text-[11px] text-gray-400">{f.hint}</p>}
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saveMut.isPending}
          className={cn("flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all",
            saved ? "bg-green-500" : "bg-primary hover:bg-primary/90",
            saveMut.isPending && "opacity-50"
          )}>
          {saveMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : saved ? <FiCheck className="h-4 w-4" /> : <FiSave className="h-4 w-4" />}
          {saveMut.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
