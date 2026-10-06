"use client";

import { FiAward } from "react-icons/fi";
import Link from "next/link";

export function SupportWidget() {
  return (
    <Link
      href="/hall-da-fama"
      className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
        <FiAward className="h-4 w-4" />
      </div>
      <div className="hidden text-left leading-tight xl:block">
        <p className="text-[10px] text-gray-400">Conquistas</p>
        <p className="text-xs font-bold text-gray-900">Hall da Fama</p>
      </div>
    </Link>
  );
}
