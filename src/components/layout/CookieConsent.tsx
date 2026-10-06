"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import { TbCookie } from "react-icons/tb";

const CONSENT_KEY = "suntecshed_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  const decide = (value: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={[
        // Mobile: overlay de tela cheia com o card centralizado
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4",
        // Desktop: sem overlay, vira um balão flutuante no canto inferior esquerdo
        "sm:inset-auto sm:bottom-5 sm:left-5 sm:right-auto sm:top-auto sm:block sm:bg-transparent sm:p-0",
      ].join(" ")}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl sm:max-w-[22rem]">
        <button
          onClick={() => decide("declined")}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <FiX className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TbCookie className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">We use cookies</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              We use cookies to improve your experience, remember your preferences and
              analyze site usage. Learn more in our{" "}
              <Link href="/politica-de-privacidade" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => decide("declined")}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
