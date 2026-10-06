"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { FiLock, FiSave, FiLoader, FiLogOut, FiEye, FiEyeOff, FiBell, FiMail } from "react-icons/fi";

export function AccountSettings() {
  const { logout } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const changePwdMut = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/auth/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => setError(err.message || "Erro ao alterar senha"),
  });

  const handleChangePassword = () => {
    setError("");
    if (!form.currentPassword) { setError("Informe a senha atual"); return; }
    if (form.newPassword.length < 6) { setError("Nova senha deve ter no mínimo 6 caracteres"); return; }
    if (form.newPassword !== form.confirmPassword) { setError("As senhas não conferem"); return; }
    changePwdMut.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
          <FiLock className="h-4 w-4 text-primary" /> Alterar Senha
        </h3>

        {saved && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-medium text-green-700">
            ✓ Senha alterada com sucesso!
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">Senha atual</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              <button onClick={() => setShowCurrent(!showCurrent)} type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">Nova senha</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              <button onClick={() => setShowNew(!showNew)} type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">Confirmar nova senha</label>
            <input type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>

          <button onClick={handleChangePassword} disabled={changePwdMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50">
            {changePwdMut.isPending ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiSave className="h-3.5 w-3.5" />}
            Alterar Senha
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
          <FiBell className="h-4 w-4 text-primary" /> Preferências
        </h3>
        <div className="space-y-3">
          {[
            { label: "Receber ofertas por email", desc: "Promoções e novidades", icon: FiMail },
            { label: "Notificações de pedidos", desc: "Atualizações sobre seus pedidos", icon: FiBell },
          ].map((pref) => (
            <label key={pref.label} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-all hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <pref.icon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{pref.label}</p>
                  <p className="text-[10px] text-gray-400">{pref.desc}</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            </label>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 pt-6">
        <button onClick={() => logout()}
          className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-xs font-bold text-red-500 transition-all hover:bg-red-50">
          <FiLogOut className="h-3.5 w-3.5" /> Sair da Conta
        </button>
      </div>
    </div>
  );
}
