// Verificação do Google reCAPTCHA v3 — roda invisível no cliente (sem
// desafio visual), retorna uma nota de 0 a 1 de "quão humano" foi o
// comportamento. Complementa o rate limit: um bot pode trocar de IP/conta
// facilmente, mas replicar o fingerprint/comportamento de um navegador real
// é bem mais difícil.
const MIN_SCORE = 0.5;

export async function verifyRecaptcha(token: string | undefined, expectedAction: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // não configurado — não bloqueia (fail-open)
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();

    if (!data.success) return false;
    if (data.action && data.action !== expectedAction) return false;
    if (typeof data.score === "number" && data.score < MIN_SCORE) return false;

    return true;
  } catch {
    return true; // Google fora do ar — não trava o checkout por isso (fail-open)
  }
}
