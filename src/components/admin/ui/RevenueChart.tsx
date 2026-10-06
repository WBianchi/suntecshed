"use client";

import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface RevenueChartProps {
  data: { month: string; value: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-48 items-end gap-2 pt-4">
      {data.map((d, i) => (
        <div key={`${d.month}-${i}`} className="group/bar flex flex-1 flex-col items-center gap-1.5">
          <div className="relative w-full">
            <div
              className={cn(
                "mx-auto w-full max-w-[32px] rounded-t-lg transition-all duration-300 group-hover/bar:opacity-100",
                i === data.length - 1 ? "bg-primary" : "bg-primary/20 group-hover/bar:bg-primary/40"
              )}
              style={{ height: `${Math.max((d.value / max) * 160, 4)}px` }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
              {formatBRL(d.value)}
            </div>
          </div>
          <span className="text-[10px] text-gray-400">{d.month}</span>
        </div>
      ))}
    </div>
  );
}
