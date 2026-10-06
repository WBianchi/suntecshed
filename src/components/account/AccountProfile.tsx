"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FiSave, FiLoader, FiEdit2, FiMapPin, FiUser, FiMail, FiPhone, FiFileText } from "react-icons/fi";

export function AccountProfile() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });

  const [form, setForm] = useState({
    name: "", phone: "", cpf: "",
    street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
  });

  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      setForm({
        name: u.name || "", phone: u.phone || "", cpf: u.cpf || "",
        street: u.street || "", number: u.number || "", complement: u.complement || "",
        neighborhood: u.neighborhood || "", city: u.city || "", state: u.state || "", zipCode: u.zipCode || "",
      });
    }
  }, [profileData]);

  const saveMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/auth/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => saveMut.mutate(form);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const user = profileData?.user;
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <FiUser className="h-4 w-4 text-primary" /> Dados Pessoais
          </h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5">
              <FiEdit2 className="h-3.5 w-3.5" /> Editar
            </button>
          ) : (
            <button onClick={handleSave} disabled={saveMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {saveMut.isPending ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiSave className="h-3.5 w-3.5" />}
              Salvar
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-medium text-green-700">
            ✓ Dados salvos com sucesso!
          </div>
        )}

        {!editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: FiUser, label: "Nome", value: user.name },
              { icon: FiMail, label: "Email", value: user.email },
              { icon: FiPhone, label: "Telefone", value: user.phone || "—" },
              { icon: FiFileText, label: "CPF", value: user.cpf || "—" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                <item.icon className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
              <FiMail className="h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-500">{user.email}</p>
              </div>
            </div>
            <InputField label="Telefone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <InputField label="CPF" value={form.cpf} onChange={(v) => setForm((f) => ({ ...f, cpf: v }))} />
          </div>
        )}
      </div>

      {/* Address */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
          <FiMapPin className="h-4 w-4 text-primary" /> Endereço
        </h3>
        {!editing ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
            {user.street ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {user.street}, {user.number}{user.complement ? ` - ${user.complement}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {user.neighborhood}, {user.city} - {user.state} · CEP {user.zipCode}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Nenhum endereço cadastrado</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="CEP" value={form.zipCode} onChange={(v) => setForm((f) => ({ ...f, zipCode: v }))} />
            <InputField label="Rua" value={form.street} onChange={(v) => setForm((f) => ({ ...f, street: v }))} />
            <InputField label="Número" value={form.number} onChange={(v) => setForm((f) => ({ ...f, number: v }))} />
            <InputField label="Complemento" value={form.complement} onChange={(v) => setForm((f) => ({ ...f, complement: v }))} />
            <InputField label="Bairro" value={form.neighborhood} onChange={(v) => setForm((f) => ({ ...f, neighborhood: v }))} />
            <InputField label="Cidade" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
            <InputField label="Estado" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
    </div>
  );
}
