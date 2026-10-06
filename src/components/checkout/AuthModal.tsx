"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiLoader, FiX } from "react-icons/fi";

type Mode = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass = "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";
const inputPasswordClass = "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";

export function AuthModal({ open, onClose, onSuccess }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  if (!open) return null;

  const switchMode = (m: Mode) => {
    setError("");
    setMode(m);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);
    if (result.success) onSuccess();
    else setError(result.error || "Error signing in");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirm) {
      setError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await register({ name: regName, email: regEmail, password: regPassword, phone: regPhone || undefined });
    setLoading(false);
    if (result.success) onSuccess();
    else setError(result.error || "Error creating account");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
              {mode === "login" ? "Sign in to finish" : "Create your account"}
            </h2>
            <p className="text-xs text-gray-500">Your order and cart stay here — it is quick</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Your email" className={inputClass} />
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Your password" className={inputPasswordClass} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50">
                {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : "Sign in and finish order"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")} className="font-semibold text-primary hover:underline">
                  Create free account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Full name" className={inputClass} />
              </div>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Your email" className={inputClass} />
              </div>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="Phone (optional)" className={inputClass} />
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Create password (min. 6 characters)" className={inputPasswordClass} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Confirm password" className={inputClass} />
              </div>
              <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50">
                {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : "Create account and finish order"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-primary hover:underline">
                  Fazer login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
