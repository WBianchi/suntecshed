"use client";

import { FaCrown } from "react-icons/fa";
import { FiX, FiCheck } from "react-icons/fi";

const benefits = [
  "Preços exclusivos até 20% menores",
  "Acesso a produtos antecipados",
  "Suporte prioritário",
  "Mentoria completa de dropshipping",
];

const ANNUAL_PLAN_URL = "https://pay.hotmart.com/X75699383B?off=yzlk1xlh";
const MONTHLY_PLAN_URL = "https://go.hotmart.com/X75699383B?off=onu4ciia";

interface GrupoVipModalProps {
  onClose: () => void;
}

export function GrupoVipModal({ onClose }: GrupoVipModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-primary px-6 pb-6 pt-8 text-center">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white transition-colors hover:bg-black/20"
          >
            <FiX className="h-4 w-4" />
          </button>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/15">
            <FaCrown className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-poppins)" }}>
            Grupo VIP
          </h2>
          <p className="mt-1 text-xs font-medium text-white/80">
            Mentoria Dropshipping + Preços Exclusivos
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-2.5 rounded-2xl bg-amber-50/60 p-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-2 text-sm text-gray-700">
                <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {b}
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2.5">
            <a
              href={ANNUAL_PLAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold uppercase tracking-wide text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.02]"
            >
              🔥 Plano Anual 🔥
            </a>
            <a
              href={MONTHLY_PLAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-extrabold uppercase tracking-wide text-white transition-transform hover:scale-[1.02]"
            >
              🔥 Plano Mensal 🔥
            </a>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
