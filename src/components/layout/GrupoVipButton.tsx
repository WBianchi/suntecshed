"use client";

import { useState } from "react";
import { FaCrown } from "react-icons/fa";
import { GrupoVipModal } from "./GrupoVipModal";

export function GrupoVipButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden shrink-0 items-center gap-3 lg:flex">
        {/* Grupo VIP */}
        <button
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-transform hover:scale-105"
        >
          <FaCrown className="h-3.5 w-3.5" />
          Grupo VIP
        </button>
      </div>

      {open && <GrupoVipModal onClose={() => setOpen(false)} />}
    </>
  );
}
