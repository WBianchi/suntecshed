"use client";

import { useState } from "react";
import { FiUser, FiMail, FiPhone, FiFileText, FiUpload, FiPaperclip, FiX, FiLoader } from "react-icons/fi";
import { cn } from "@/lib/utils";

export interface PersonalData {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  personType: "fisica" | "juridica";
  cpf: string;
  cnpj: string;
  labelUrl: string;
  labelName: string;
}

interface Props {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
  onNext: () => void;
}

const formatCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatCNPJ = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

interface FieldDef {
  key: "name" | "lastName" | "email" | "phone" | "cpf" | "cnpj";
  label: string;
  icon: typeof FiUser;
  placeholder: string;
  type: string;
  format?: (v: string) => string;
}

export function CheckoutPersonalData({ data, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const validate = () => {
    const e: Partial<Record<string, string>> = {};
    if (!data.name.trim()) e.name = "Nome obrigatório";
    if (!data.lastName.trim()) e.lastName = "Sobrenome obrigatório";
    if (!data.email.includes("@")) e.email = "Email inválido";
    if (data.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (data.personType === "fisica" && data.cpf.replace(/\D/g, "").length < 11) e.cpf = "CPF inválido";
    if (data.personType === "juridica" && data.cnpj.replace(/\D/g, "").length < 14) e.cnpj = "CNPJ inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onNext();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/checkout/upload-label", { method: "POST", body: formData, credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || "Erro ao enviar arquivo");
        return;
      }
      onChange({ ...data, labelUrl: json.url, labelName: json.name });
    } catch {
      setUploadError("Erro de conexão ao enviar o arquivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const fields: FieldDef[] = [
    { key: "name", label: "Nome", icon: FiUser, placeholder: "Seu nome", type: "text" },
    { key: "lastName", label: "Sobrenome", icon: FiUser, placeholder: "Seu sobrenome", type: "text" },
    { key: "email", label: "Email", icon: FiMail, placeholder: "seu@email.com", type: "email" },
    { key: "phone", label: "Telefone / WhatsApp", icon: FiPhone, placeholder: "(00) 00000-0000", type: "tel", format: formatPhone },
  ];

  return (
    <div className="neo-surface p-5 sm:p-8">
      <h2 className="mb-6 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
        Dados Pessoais
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.key === "email" ? "sm:col-span-2" : ""}>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">{f.label}</label>
            <div className="neo-inset relative flex items-center">
              <f.icon className="pointer-events-none absolute left-4 h-4 w-4 text-gray-400" />
              <input
                type={f.type}
                value={data[f.key]}
                onChange={(e) => {
                  const val = f.format ? f.format(e.target.value) : e.target.value;
                  onChange({ ...data, [f.key]: val });
                  if (errors[f.key]) setErrors((p) => ({ ...p, [f.key]: undefined }));
                }}
                placeholder={f.placeholder}
                className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
            {errors[f.key] && <p className="mt-1 text-xs text-red-500">{errors[f.key]}</p>}
          </div>
        ))}
      </div>

      {/* Tipo de Pessoa */}
      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-gray-600">Tipo de Pessoa</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["fisica", "juridica"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...data, personType: type })}
              className={cn(
                "neo-pill flex h-12 items-center justify-center gap-2 text-sm font-semibold transition-colors",
                data.personType === type ? "neo-pill-selected text-primary" : "text-gray-600"
              )}
            >
              {type === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
            </button>
          ))}
        </div>
      </div>

      {/* CPF ou CNPJ conforme o tipo */}
      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-gray-600">
          {data.personType === "juridica" ? "CNPJ" : "CPF"}
        </label>
        <div className="neo-inset relative flex items-center">
          <FiFileText className="pointer-events-none absolute left-4 h-4 w-4 text-gray-400" />
          {data.personType === "juridica" ? (
            <input
              type="text"
              value={data.cnpj}
              onChange={(e) => {
                onChange({ ...data, cnpj: formatCNPJ(e.target.value) });
                if (errors.cnpj) setErrors((p) => ({ ...p, cnpj: undefined }));
              }}
              placeholder="00.000.000/0001-00"
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          ) : (
            <input
              type="text"
              value={data.cpf}
              onChange={(e) => {
                onChange({ ...data, cpf: formatCPF(e.target.value) });
                if (errors.cpf) setErrors((p) => ({ ...p, cpf: undefined }));
              }}
              placeholder="000.000.000-00"
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          )}
        </div>
        {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf}</p>}
        {errors.cnpj && <p className="mt-1 text-xs text-red-500">{errors.cnpj}</p>}
      </div>

      {/* Anexar Etiqueta */}
      <div className="neo-inset mt-6 p-4">
        <div className="flex items-center gap-2">
          <FiPaperclip className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-gray-900">Anexar Etiqueta (opcional)</p>
        </div>
        <p className="mt-1 text-xs text-gray-500">Anexe a etiqueta de envio fornecida pelo seu fornecedor</p>

        {data.labelUrl ? (
          <>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3">
              <a href={data.labelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <FiFileText className="h-4 w-4" /> {data.labelName || "Arquivo anexado"}
              </a>
              <button onClick={() => onChange({ ...data, labelUrl: "", labelName: "" })} className="text-gray-400 hover:text-red-500">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Como a etiqueta já tem o endereço de entrega, a etapa de endereço será pulada e nenhum frete será cobrado.
            </p>
          </>
        ) : (
          <label className="neo-surface-sm mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 text-sm font-medium text-primary">
            {uploading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUpload className="h-4 w-4" />}
            {uploading ? "Enviando..." : "Selecionar arquivo"}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} disabled={uploading} />
          </label>
        )}
        {uploadError && <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>}
      </div>

      <button
        onClick={handleSubmit}
        className="neo-btn mt-6 flex w-full items-center justify-center bg-primary text-sm font-bold uppercase tracking-wide text-white"
        style={{ height: "52px" }}
      >
        {data.labelUrl ? "Continuar para Pagamento →" : "Continuar para Endereço →"}
      </button>
    </div>
  );
}
