"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiLock, FiEye, FiEyeOff, FiLoader, FiCheck, FiArrowLeft } from "react-icons/fi";

const inputPasswordClass = "h-12 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido. Solicite uma nova redefinição de senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/entrar"), 2500);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/80 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-black/5">
          <div className="flex flex-col items-center pt-8 pb-2">
            <Link href="/" className="flex flex-col items-center gap-2">
              <img src="/logo.png" alt="Suntecshed" className="h-14 w-auto object-contain" />
            </Link>
          </div>

          <div className="px-8 pb-8 pt-4">
            {success ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <FiCheck className="h-7 w-7 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                  Senha redefinida!
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Sua senha foi alterada com sucesso. Redirecionando pro login...
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                    Criar nova senha
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Escolha uma nova senha para sua conta</p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nova senha"
                      className={inputPasswordClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirmar nova senha"
                      className={inputPasswordClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : "Redefinir Senha"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/entrar" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <FiArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
