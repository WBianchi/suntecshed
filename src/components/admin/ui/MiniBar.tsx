"use client";

import { cn } from "@/lib/utils";

interface MiniBarProps {
  data: number[];
  color?: string;
}

export function MiniBar({ data, color = "bg-primary" }: MiniBarProps) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px]">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn("w-[6px] rounded-sm transition-all", color)}
          style={{ height: `${Math.max((v / max) * 32, 2)}px`, opacity: 0.4 + (v / max) * 0.6 }}
        />
      ))}
    </div>
  );
}
