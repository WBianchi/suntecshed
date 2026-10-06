"use client";

import { cn } from "@/lib/utils";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}

export function KpiCard({ title, value, change, changeLabel = "vs. mês anterior", icon: Icon, iconBg }: KpiCardProps) {
  const isUp = change >= 0;
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          )}
        >
          {isUp ? <FiArrowUpRight className="h-3 w-3" /> : <FiArrowDownRight className="h-3 w-3" />}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{title}</p>
      </div>
      <p className="mt-3 text-[11px] text-gray-400">{changeLabel}</p>
    </div>
  );
}
