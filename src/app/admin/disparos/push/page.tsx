"use client";

import { FiSmartphone, FiBell, FiLock } from "react-icons/fi";

export default function PushDisparosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disparos Push / SMS</h1>
        <p className="mt-0.5 text-sm text-gray-500">Envie notificações push e SMS para seus clientes</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <FiBell className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-700">Em breve</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Estamos preparando a funcionalidade de disparos por Push e SMS. Em breve você poderá enviar
          notificações diretamente para o celular dos seus clientes.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
          <FiLock className="h-3.5 w-3.5" /> Funcionalidade em desenvolvimento
        </div>

        <div className="mx-auto mt-8 grid max-w-lg gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <FiBell className="h-4 w-4 text-purple-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-800">Push Notifications</h3>
            <p className="mt-1 text-xs text-gray-500">
              Notificações via navegador para clientes que optarem por receber.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <FiSmartphone className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-800">SMS Marketing</h3>
            <p className="mt-1 text-xs text-gray-500">
              Mensagens de texto para campanhas rápidas com alta taxa de abertura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
