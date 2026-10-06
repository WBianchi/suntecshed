"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  FiLock, FiShield, FiEye, FiEyeOff, FiCheck, FiLoader,
  FiAlertTriangle, FiInfo, FiKey,
} from "react-icons/fi";

export default function SegurancaPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const changePwMut = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/admin/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao alterar senha");
      }
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword) return;
    if (newPassword.length < 6) return;
    if (newPassword !== confirmPassword) return;
    changePwMut.mutate({ currentPassword, newPassword });
  };

  const passwordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Fraca", color: "bg-red-500", width: "20%" };
    if (score === 2) return { label: "Razoável", color: "bg-orange-500", width: "40%" };
    if (score === 3) return { label: "Boa", color: "bg-yellow-500", width: "60%" };
    if (score === 4) return { label: "Forte", color: "bg-green-400", width: "80%" };
    return { label: "Muito forte", color: "bg-green-600", width: "100%" };
  };

  const strength = passwordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = currentPassword && newPassword.length >= 6 && passwordsMatch && !changePwMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <FiShield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segurança</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gerencie sua senha e configurações de segurança</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FiKey className="h-4 w-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Alterar Senha</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-green-700">
            <FiCheck className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium">Senha alterada com sucesso!</p>
          </div>
        )}

        {changePwMut.error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-600">
            <FiAlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium">{(changePwMut.error as Error).message}</p>
          </div>
        )}

        <div className="max-w-md space-y-4">
          {/* Current password */}
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Senha Atual</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary" placeholder="••••••••" />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Nova Senha</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary" placeholder="Mínimo 6 caracteres" />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div className={cn("h-full rounded-full transition-all", strength.color)} style={{ width: strength.width }} />
                </div>
                <p className="text-[10px] font-medium text-gray-500">Força: {strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 text-xs font-semibold text-gray-600">Confirmar Nova Senha</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn("w-full rounded-xl border py-2.5 pl-3 pr-10 text-sm outline-none focus:border-primary",
                  confirmPassword && !passwordsMatch ? "border-red-300" : "border-gray-200")}
                placeholder="Repita a nova senha" />
              <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-[10px] font-medium text-red-500">As senhas não coincidem</p>
            )}
            {passwordsMatch && (
              <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-green-600"><FiCheck className="h-3 w-3" /> Senhas coincidem</p>
            )}
          </div>

          <button onClick={handleChangePassword} disabled={!canSubmit}
            className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all",
              "bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed")}>
            {changePwMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiLock className="h-4 w-4" />}
            {changePwMut.isPending ? "Alterando..." : "Alterar Senha"}
          </button>
        </div>
      </div>

      {/* Security Tips */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Dicas de Segurança</h2>
        <div className="space-y-2">
          {[
            { icon: FiKey, text: "Use uma senha forte com letras maiúsculas, números e caracteres especiais" },
            { icon: FiShield, text: "Nunca compartilhe suas credenciais de acesso ao painel admin" },
            { icon: FiLock, text: "Altere sua senha periodicamente (a cada 3 meses é recomendado)" },
            { icon: FiAlertTriangle, text: "Verifique sempre se está acessando o site pelo domínio correto" },
            { icon: FiInfo, text: "Mantenha seu navegador e sistema operacional sempre atualizados" },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
              <tip.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Session Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Informações da Sessão</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Navegador</p>
            <p className="mt-0.5 text-xs font-medium text-gray-700">{typeof navigator !== "undefined" ? navigator.userAgent.split(" ").slice(-2).join(" ").replace(/[()]/g, "") : "—"}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Plataforma</p>
            <p className="mt-0.5 text-xs font-medium text-gray-700">{typeof navigator !== "undefined" ? navigator.platform : "—"}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Idioma</p>
            <p className="mt-0.5 text-xs font-medium text-gray-700">{typeof navigator !== "undefined" ? navigator.language : "—"}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Resolução</p>
            <p className="mt-0.5 text-xs font-medium text-gray-700">{typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
