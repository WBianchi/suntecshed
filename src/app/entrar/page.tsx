"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiArrowLeft, FiCheck, FiLoader } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

type FormMode = "login" | "register" | "forgot";

export default function EntrarPage() {
  const router = useRouter();
  const { user, login, register, refreshUser } = useAuth();

  // Redirect if already logged in or after login/register
  useEffect(() => {
    if (user) {
      router.push(user.role === "ADMIN" ? "/admin" : "/minha-conta");
    }
  }, [user, router]);

  const [mode, setMode] = useState<FormMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Forgot fields
  const [forgotEmail, setForgotEmail] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = (newMode: FormMode) => {
    clearMessages();
    setShowPassword(false);
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      // refreshUser to get role, then redirect
      await refreshUser();
    } else {
      setError(result.error || "Error signing in");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (regPassword !== regConfirm) {
      setError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const result = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone || undefined,
    });

    if (result.success) {
      await refreshUser();
    } else {
      setError(result.error || "Error creating account");
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error processing request");
        return;
      }
      setSuccess(data.message || "If this email is registered, you will receive a link to reset your password.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return { level: 0, label: "", color: "" };
    if (pw.length < 6) return { level: 1, label: "Weak", color: "bg-red-400" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const score = [pw.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-400" };
    if (score === 2) return { level: 2, label: "Medium", color: "bg-yellow-400" };
    if (score === 3) return { level: 3, label: "Good", color: "bg-blue-400" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  };

  const strength = passwordStrength(regPassword);

  const inputClass = "h-12 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";
  const inputPasswordClass = "h-12 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/80 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-black/5">
          {/* Logo inside the form */}
          <div className="flex flex-col items-center pt-8 pb-2">
            <Link href="/" className="flex flex-col items-center gap-2">
              <img src="/logo.png" alt="Suntecshed" className="h-14 w-auto object-contain" />
            </Link>
          </div>

          <div className="px-8 pb-8 pt-4">
            {/* ============ LOGIN ============ */}
            {mode === "login" && (
              <div>
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                    Welcome back
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Social Buttons */}
                <div className="mb-5 flex gap-3">
                  <button
                    type="button"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <FcGoogle className="h-5 w-5" />
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <FaFacebook className="h-5 w-5 text-[#1877F2]" />
                    Facebook
                  </button>
                </div>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-gray-400">or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Your email"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Your password"
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
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                      />
                      <span className="text-xs text-gray-500">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : "Sign in"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchMode("register")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Create free account
                  </button>
                </p>
              </div>
            )}

            {/* ============ REGISTER ============ */}
            {mode === "register" && (
              <div>
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                    Create your account
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Sign up and enjoy exclusive deals</p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Social Buttons */}
                <div className="mb-5 flex gap-3">
                  <button
                    type="button"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <FcGoogle className="h-5 w-5" />
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <FaFacebook className="h-5 w-5 text-[#1877F2]" />
                    Facebook
                  </button>
                </div>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-gray-400">or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Full name"
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Your email"
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create password (min. 6 characters)"
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
                    {regPassword.length > 0 && (
                      <div className="mt-2 px-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= strength.level ? strength.color : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">Strength: <span className="font-medium">{strength.label}</span></p>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="Confirm password"
                      className={`h-12 w-full rounded-full border bg-gray-50/50 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 ${
                        regConfirm.length > 0 && regConfirm !== regPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : regConfirm.length > 0 && regConfirm === regPassword
                          ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                          : "border-gray-200 focus:border-primary focus:ring-primary/10"
                      }`}
                    />
                    {regConfirm.length > 0 && regConfirm === regPassword && (
                      <FiCheck className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : "Create my account"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* ============ FORGOT PASSWORD ============ */}
            {mode === "forgot" && (
              <div>
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                    Reset password
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your email to reset your password
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                    <div className="flex items-center gap-2">
                      <FiCheck className="h-4 w-4 shrink-0" />
                      {success}
                    </div>
                  </div>
                )}

                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Your email"
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : "Send reset link"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    onClick={() => switchMode("login")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <FiArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer outside card */}
        <p className="mt-6 text-center text-[11px] text-gray-400">
          By creating an account you agree to our{" "}
          <Link href="/termos-de-uso" className="underline hover:text-primary">Terms of Use</Link>{" "}
          e{" "}
          <Link href="/politica-de-privacidade" className="underline hover:text-primary">Privacy Policy</Link>.
        </p>
        <div className="mt-3 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-primary">
            <FiArrowLeft className="h-3 w-3" /> Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
