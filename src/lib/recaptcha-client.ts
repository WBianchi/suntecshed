// Carrega o script do reCAPTCHA v3 sob demanda (só quando alguém realmente
// vai finalizar um pedido/criar conta) e retorna um token pra mandar junto
// com a requisição. Roda invisível — sem desafio visual pro usuário.
let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).grecaptcha) return resolve();

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar reCAPTCHA"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return undefined;

  try {
    await loadRecaptchaScript(siteKey);
    const grecaptcha = (window as any).grecaptcha;
    return await new Promise<string>((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve).catch(reject);
      });
    });
  } catch {
    return undefined; // Se falhar, segue sem token — o backend decide (fail-open se não configurado)
  }
}
