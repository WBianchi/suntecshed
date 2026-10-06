"use client";

import { useAuth } from "@/providers/auth-provider";
import { FaCrown } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";

const benefits = [
  "Preços exclusivos até 20% menores",
  "Acesso a produtos antecipados",
  "Suporte prioritário",
  "Mentoria completa de dropshipping",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function AccountVip() {
  const { user } = useAuth();
  const expiresAt = user?.vipExpiresAt ? new Date(user.vipExpiresAt) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-brand-50/60 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <FaCrown className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-gray-900">Seu Grupo VIP está ativo</p>
          <p className="text-sm text-gray-500">
            {expiresAt ? `Válido até ${formatDate(user!.vipExpiresAt!)}` : "Sem data de expiração"}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Seus benefícios</p>
        <div className="space-y-2.5 rounded-2xl border border-gray-100 p-4">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-2 text-sm text-gray-700">
              <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
