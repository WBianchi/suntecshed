"use client";

import { useState } from "react";
import { FiX, FiCheck, FiLink } from "react-icons/fi";
import { FaWhatsapp, FaFacebook, FaTelegram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface ShareModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function ShareModal({ url, title, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    {
      label: "WhatsApp",
      icon: FaWhatsapp,
      color: "bg-[#25D366]",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "Facebook",
      icon: FaFacebook,
      color: "bg-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "X (Twitter)",
      icon: FaXTwitter,
      color: "bg-gray-900",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: "Telegram",
      icon: FaTelegram,
      color: "bg-[#26A5E4]",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">Share product</h2>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {networks.map((n) => (
              <a key={n.label} href={n.href} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 text-center"
                onClick={onClose}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-105 ${n.color}`}>
                  <n.icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium text-gray-500">{n.label}</span>
              </a>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 pl-3">
            <FiLink className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-xs text-gray-500">{url}</span>
            <button onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90">
              {copied ? <FiCheck className="h-3.5 w-3.5" /> : null}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
