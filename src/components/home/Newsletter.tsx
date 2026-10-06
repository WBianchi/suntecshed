"use client";

import { useState } from "react";
import { FiMail, FiCheck } from "react-icons/fi";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section className="py-16 bg-primary">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <FiMail className="h-6 w-6 text-white" />
          </div>
          <h2
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-poppins)", color: "white" }}
          >
            Receba nossas novidades
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/70">
            Cadastre-se e receba ofertas exclusivas, lançamentos e cupons de desconto
            diretamente no seu e-mail.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <FiMail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-full bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              type="submit"
              disabled={submitted}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-primary transition-all hover:bg-white/90 hover:shadow-lg active:scale-95 disabled:opacity-70"
            >
              {submitted ? (
                <>
                  <FiCheck className="h-4 w-4" />
                  Cadastrado!
                </>
              ) : (
                "Cadastrar"
              )}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-white/50">
            Ao se cadastrar, você concorda com nossa Política de Privacidade.
            Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}
