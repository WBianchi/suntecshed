"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function getEndDate() {
  const envDate = process.env.NEXT_PUBLIC_MAINTENANCE_END_AT;
  if (envDate) {
    const parsed = new Date(envDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

function getTimeLeft(end: Date) {
  const diff = Math.max(0, end.getTime() - Date.now());
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

export default function MaintenancePage() {
  const [end] = useState(getEndDate);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(end));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(end)), 1000);
    return () => clearInterval(interval);
  }, [end]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#7530fa] px-6 text-white">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#9d6bff] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#5a14cf] opacity-50 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center rounded-3xl bg-white px-8 py-12 text-center shadow-2xl sm:px-14">
        <div className="mb-6 flex h-20 w-40 items-center justify-center">
          <Image
            src="/logo.png"
            alt="Suntecshed"
            width={160}
            height={80}
            className="h-full w-auto object-contain"
            priority
          />
        </div>

        <h1 className="font-heading text-2xl font-bold text-[#7530fa] sm:text-3xl">
          Estamos em manutenção
        </h1>
        <p className="mt-3 text-sm text-[#6B7280] sm:text-base">
          Estamos fazendo alguns ajustes para melhorar sua experiência.
          Voltamos em breve!
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          {[
            { label: "Horas", value: timeLeft.hours },
            { label: "Min", value: timeLeft.minutes },
            { label: "Seg", value: timeLeft.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="flex w-20 flex-col items-center rounded-2xl bg-[#7530fa] py-4 text-white sm:w-24"
            >
              <span className="text-2xl font-bold tabular-nums sm:text-3xl">
                {pad(unit.value)}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-white/70 sm:text-xs">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-[#6B7280]">
          {timeLeft.done
            ? "Já estamos quase terminando, obrigado pela paciência."
            : "Previsão de retorno em até 24 horas."}
        </p>
      </div>
    </div>
  );
}
