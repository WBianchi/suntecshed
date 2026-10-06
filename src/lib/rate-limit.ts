import { prisma } from "@/lib/prisma";

/**
 * Rate limiter baseado em banco de dados (PostgreSQL via Prisma).
 * Serverless-safe — usa a tabela rate_limit_entries para persistir
 * contadores entre invocações na Vercel.
 */

interface RateLimitConfig {
  /** Identificador único do endpoint, ex: "/api/orders" */
  endpoint: string;
  /** Chave de identificação, ex: "ip:192.168.1.1" ou "user:abc123" */
  key: string;
  /** Número máximo de requisições permitidas na janela */
  maxRequests: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
}

interface RateLimitResult {
  /** Se a requisição está permitida */
  allowed: boolean;
  /** Quantas requisições já foram feitas na janela atual */
  currentCount: number;
  /** Limite configurado */
  limit: number;
  /** Segundos restantes até a janela resetar */
  retryAfterSeconds: number;
}

/**
 * Verifica se uma requisição excede o limite configurado.
 * Se permitida, incrementa o contador. Se bloqueada, retorna
 * quantos segundos faltam para liberar.
 *
 * IMPORTANTE: SEMPRE chame esta função ANTES de criar o pedido,
 * e NUNCA chame de novo se o pedido já foi criado com sucesso
 * (para não contar duas vezes).
 */
// Contador de janela fixa, incrementado atomicamente num único INSERT ...
// ON CONFLICT DO UPDATE — sem essa atomicidade, um "count" e um "create"
// separados criam uma corrida onde N requisições simultâneas todas leem a
// mesma contagem baixa antes de qualquer uma delas gravar, e todas passam
// juntas (foi exatamente assim que o ataque de carding driblou o rate
// limit anterior mesmo com o limite configurado corretamente).
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { endpoint, key, maxRequests, windowSeconds } = config;

  const now = new Date();
  const windowMs = windowSeconds * 1000;
  // Janela fixa: todo mundo que cai no mesmo intervalo de windowSeconds
  // compartilha a mesma linha/contador (não é janela deslizante por
  // requisição — é o preço de ser atômico e barato).
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit_entries" ("id", "key", "endpoint", "count", "windowStart", "createdAt")
    VALUES (gen_random_uuid()::text, ${key}, ${endpoint}, 1, ${windowStart}, ${now})
    ON CONFLICT ("key", "endpoint", "windowStart")
    DO UPDATE SET "count" = "rate_limit_entries"."count" + 1
    RETURNING "count"
  `;
  const count = rows[0]?.count ?? 1;
  const allowed = count <= maxRequests;

  const resetAt = new Date(windowStart.getTime() + windowMs);
  const retryAfterSeconds = allowed ? 0 : Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));

  return {
    allowed,
    currentCount: count,
    limit: maxRequests,
    retryAfterSeconds,
  };
}

// Limpeza best-effort de janelas antigas — chamado ocasionalmente, não
// precisa ser em toda requisição (a tabela não cresce descontroladamente
// já que agora é 1 linha por key+endpoint+janela, não por tentativa).
export async function cleanupOldRateLimitEntries(olderThanSeconds = 3600): Promise<void> {
  await prisma.rateLimitEntry.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - olderThanSeconds * 1000) } },
  }).catch(() => {});
}

/**
 * Velocidade global de TENTATIVAS de pedido (não só as que ficam salvas no
 * banco) — última linha de defesa contra bots que driblam o rate limit por
 * IP/usuário usando múltiplas contas/IPs. Usa o mesmo contador atômico do
 * checkRateLimit com uma chave global compartilhada por todo mundo.
 *
 * IMPORTANTE: antes essa função contava só prisma.order.count() — pedidos
 * de verdade persistidos. Num ataque de carding a maioria das tentativas
 * falha e nunca chega a salvar (cartão recusado, corrida no orderNumber),
 * então o contador real de tentativas ficava bem maior que o de pedidos
 * salvos, e esse limite nunca disparava mesmo sob rajada pesada.
 */
export async function checkOrdersVelocity(maxOrders: number, windowSeconds: number): Promise<RateLimitResult> {
  return checkRateLimit({
    endpoint: "/api/orders:global",
    key: "global:all",
    maxRequests: maxOrders,
    windowSeconds,
  });
}

/**
 * Mesma ideia, só que restrita a tentativas de pagamento com cartão —
 * padrão clássico de carding é testar muitos cartões diferentes em rajada,
 * então esse limite fica mais apertado que o velocity geral.
 */
export async function checkCardBinVelocity(bin: string, maxOrders: number, windowSeconds: number): Promise<RateLimitResult> {
  return checkRateLimit({
    endpoint: "/api/orders:global",
    key: "global:card",
    maxRequests: maxOrders,
    windowSeconds,
  });
}

/**
 * Extrai o IP real do request, considerando proxies (x-forwarded-for).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Bloqueia User-Agents suspeitos (bots, scripts, ferramentas de automação).
 * Retorna true se o user-agent deve ser BLOQUEADO.
 */
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true;

  const ua = userAgent.toLowerCase();

  // User-agent muito curto (< 18 chars) é suspeito
  if (ua.length < 18) return true;

  // Lista de padrões de bots/scripts comuns
  const botPatterns = [
    "python",
    "curl",
    "wget",
    "go-http-client",
    "java/",
    "libwww-perl",
    "scrapy",
    "axios",
    "node-fetch",
    "got (",
    "undici",
    "apache-httpclient",
    "okhttp",
    "insomnia",
    "postmanruntime",
    "bruno",
    "httpie",
    "l9explore",
    "zgrab",
    "masscan",
    "nmap",
    "sqlmap",
    "nikto",
    "nessus",
    "openvas",
    "burpsuite",
    "wpscan",
    "acunetix",
    "netsparker",
    "headlesschrome",
    "phantomjs",
    "selenium",
    "puppeteer",
    "playwright",
  ];

  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// E-MAILS SEGUROS (WHITELIST)
// ═══════════════════════════════════════════════════════════════
// E-mails hardcoded aqui NUNCA sofrem bloqueio de segurança:
// reCAPTCHA, rate limit por IP, por usuário, bloqueio de conta
// suspeita, velocidade global — tudo é pulado.
//
// Também respeita a variável de ambiente WHITELIST_EMAILS
// (e-mails separados por vírgula, case-insensitive) para
// adicionar mais sem deploy.
// ═══════════════════════════════════════════════════════════════

/** E-mails hardcoded como seguros (case-insensitive) */
const HARDCODED_WHITELIST: string[] = [
  "nattanliz@hotmail.com",
];

export function isWhitelistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const normalized = email.toLowerCase().trim();

  // Hardcoded: sempre ativo, não depende de env var
  if (HARDCODED_WHITELIST.includes(normalized)) return true;

  // Env var: flexível para adicionar/remover sem deploy
  const raw = process.env.WHITELIST_EMAILS || "";
  if (raw.trim()) {
    const envWhitelist = raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (envWhitelist.includes(normalized)) return true;
  }

  return false;
}
