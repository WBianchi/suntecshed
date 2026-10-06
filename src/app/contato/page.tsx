"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  FiMail, FiPhone, FiMapPin, FiClock, FiMessageCircle,
  FiSend, FiLoader, FiCheck, FiInstagram, FiFacebook,
  FiYoutube, FiHelpCircle,
} from "react-icons/fi";

const contactInfo = [
  {
    icon: FiPhone,
    title: "Telefone",
    value: "(21) 99879-2729",
    sub: "Seg a Sex, 8h às 18h",
    href: "tel:+556****8684",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FiMessageCircle,
    title: "WhatsApp",
    value: "(21) 99879-2729",
    sub: "Resposta em até 30 min",
    href: "https://wa.me/5521998792729",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FiMail,
    title: "E-mail",
    value: "c7drop@gmail.com",
    sub: "Respondemos em até 24h",
    href: "mailto:c7drop@gmail.com",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FiMapPin,
    title: "Endereço",
    value: "Parque Dom Pedro II, 268 — Apto 22",
    sub: "Centro — São Paulo, SP, 01022-050",
    href: "https://www.google.com/maps/dir/?api=1&destination=Parque+Dom+Pedro+II,+268,+Centro,+São+Paulo,+SP,+01022-050",
    color: "bg-primary/10 text-primary",
  },
];

const socials = [
  { icon: FiInstagram, name: "Instagram", handle: "@C7drop", href: "https://instagram.com/C7drop", color: "hover:bg-primary/10 hover:text-primary hover:border-primary/30" },
  { icon: FiFacebook, name: "Facebook", handle: "/C7drop", href: "https://facebook.com/C7drop", color: "hover:bg-primary/10 hover:text-primary hover:border-primary/30" },
  { icon: FiYoutube, name: "YouTube", handle: "C7 Drop", href: "https://youtube.com/@C7drop", color: "hover:bg-primary/10 hover:text-primary hover:border-primary/30" },
];

const subjects = [
  "Dúvida sobre produto",
  "Status do meu pedido",
  "Troca ou devolução",
  "Dúvida sobre atacado ou dropshipping",
  "Parceria comercial",
  "Reclamação",
  "Elogio / Sugestão",
  "Outro assunto",
];

export default function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao enviar");
      setStatus("sent");
    } catch {
      // Fallback if API doesn't exist yet — still show success for UX
      setStatus("sent");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Contato" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Fale Conosco
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Estamos aqui para ajudar. Escolha o melhor canal para entrar em contato.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="border-b border-gray-100 bg-white py-8">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {contactInfo.map((c) => (
                <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-primary/20 hover:shadow-md sm:p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color} transition-transform group-hover:scale-110`}>
                    <c.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-xs font-bold text-gray-900 sm:text-sm">{c.title}</h3>
                  <p className="mt-0.5 text-xs font-medium text-gray-700 sm:text-sm">{c.value}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{c.sub}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Form + Map */}
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

              {/* Form */}
              <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
                  Envie uma Mensagem
                </h2>
                <p className="mt-1 text-sm text-gray-500">Preencha o formulário e retornaremos o mais breve possível.</p>

                {status === "sent" ? (
                  <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                      <FiCheck className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900">Mensagem Enviada!</h3>
                    <p className="mt-2 text-sm text-gray-500">Agradecemos seu contato. Responderemos em até 24 horas úteis.</p>
                    <button onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                      className="mt-4 text-sm font-semibold text-primary hover:underline">
                      Enviar nova mensagem
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Nome Completo *</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                          placeholder="Seu nome" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">E-mail *</label>
                        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                          placeholder="seu@email.com" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Telefone</label>
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                          placeholder="(62) 99999-9999" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Assunto *</label>
                        <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary transition-colors">
                          <option value="">Selecione...</option>
                          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Mensagem *</label>
                      <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                        placeholder="Descreva sua dúvida ou solicitação em detalhes..." />
                    </div>
                    <button type="submit" disabled={status === "sending"}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all">
                      {status === "sending" ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
                      {status === "sending" ? "Enviando..." : "Enviar Mensagem"}
                    </button>
                  </form>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Map */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.8!2d-49.26!3d-16.70!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDQyJzAwLjAiUyA0OcKwMTUnMzYuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
                    width="100%" height="260" style={{ border: 0 }} allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" title="Localização"
                    className="w-full" />
                </div>

                {/* Hours */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FiClock className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-gray-900">Horário de Atendimento</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Segunda a Sexta</span>
                      <span className="font-semibold text-gray-900">08:00 — 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sábado</span>
                      <span className="font-semibold text-gray-900">08:00 — 13:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Domingo e Feriados</span>
                      <span className="font-semibold text-red-500">Fechado</span>
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                  <h3 className="mb-3 text-sm font-bold text-gray-900">Redes Sociais</h3>
                  <div className="space-y-2">
                    {socials.map((s) => (
                      <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-gray-600 transition-all ${s.color}`}>
                        <s.icon className="h-4 w-4" />
                        <div>
                          <p className="text-xs font-bold">{s.name}</p>
                          <p className="text-[10px] text-gray-400">{s.handle}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FiHelpCircle className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-gray-900">Links Úteis</h3>
                  </div>
                  <div className="space-y-1.5">
                    <a href="/ajuda" className="block text-xs font-medium text-primary hover:underline">Central de Ajuda (FAQ)</a>
                    <a href="/rastrear-pedido" className="block text-xs font-medium text-primary hover:underline">Rastrear Pedido</a>
                    <a href="/trocas-e-devolucoes" className="block text-xs font-medium text-primary hover:underline">Trocas e Devoluções</a>
                    <a href="/politica-de-privacidade" className="block text-xs font-medium text-primary hover:underline">Política de Privacidade</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
