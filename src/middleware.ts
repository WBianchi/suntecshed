import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const protectedClientRoutes = ["/minha-conta"];
const protectedAdminRoutes = ["/admin"];
const maintenanceBypassRoutes = ["/manutencao", "/admin", "/api", "/entrar"];

// Rotas de API sensíveis que exigem verificação de User-Agent
const botProtectedApiRoutes = ["/api/orders", "/api/auth/register"];

// Páginas da vitrine pública que scrapers/bots varrem em massa, carregando
// catálogo inteiro + imagens a cada visita (custo de Blob Data Transfer).
// Só bloqueia assinaturas de bibliotecas de automação (python, curl, scrapy,
// playwright etc.) — user-agents reais de navegador e de crawlers de SEO
// (Googlebot, Bingbot) ou de preview social (WhatsApp, Facebook) não batem
// nesses padrões e continuam passando normalmente.
const botProtectedPageRoutes = ["/produto/", "/produtos", "/categoria/"];

// Caminhos de ataque que NUNCA deveriam chegar ao serverless.
// São padrões de outras plataformas (WooCommerce, WordPress, Magento etc.)
// que bots de carding e scanners tentam explorar em massa. Bloquear no edge
// evita consumo desnecessário de função serverless e limite de DB.
const blockedAttackPaths = [
  "/wc-api/",       // WooCommerce webhook (Pagar.me, Mercado Pago, etc.)
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/wp-includes",
  "/wp-json/",
  "/xmlrpc.php",
  "/magento/",
  "/shopify/",
  "/.env",
  "/.git/",
  "/adminer",
  "/phpmyadmin",
  "/phpMyAdmin",
  "/vendor/",
  "/api/v1/",
  "/api/v2/",
  "/cgi-bin/",
];

// User-agents suspeitos (bots/scripts/ferramentas de automação)
function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true;

  const ua = userAgent.toLowerCase();

  if (ua.length < 18) return true;

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ═══════════════════════════════════════════════════════════
  // CAMADA 0: Bloqueio de caminhos de ataque conhecidos no edge
  // ═══════════════════════════════════════════════════════════
  for (const attackPath of blockedAttackPaths) {
    if (pathname.startsWith(attackPath)) {
      return NextResponse.json(
        { error: "Not Found" },
        { status: 404 }
      );
    }
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Bloqueio de bots nas rotas de API sensíveis
  const isBotProtectedApi = botProtectedApiRoutes.some((route) => pathname.startsWith(route));
  if (isBotProtectedApi && request.method === "POST") {
    const userAgent = request.headers.get("user-agent");
    if (isSuspiciousUserAgent(userAgent)) {
      return NextResponse.json(
        { error: "Acesso não permitido" },
        { status: 403 }
      );
    }
  }

  // Bloqueio de bots na vitrine pública (produto/categoria) — essas páginas
  // carregam várias imagens do Blob Storage por visita, e scraping em massa
  // aqui é o que mais pesa no consumo de Blob Data Transfer.
  const isBotProtectedPage = botProtectedPageRoutes.some((route) => pathname.startsWith(route));
  if (isBotProtectedPage && request.method === "GET") {
    const userAgent = request.headers.get("user-agent");
    if (isSuspiciousUserAgent(userAgent)) {
      return NextResponse.json(
        { error: "Acesso não permitido" },
        { status: 403 }
      );
    }
  }

  if (process.env.MAINTENANCE_MODE === "true") {
    const isBypassed = maintenanceBypassRoutes.some((route) => pathname.startsWith(route));
    if (!isBypassed) {
      const url = request.nextUrl.clone();
      url.pathname = "/manutencao";
      return NextResponse.rewrite(url);
    }
  }

  const isProtectedClient = protectedClientRoutes.some((route) => pathname.startsWith(route));
  const isProtectedAdmin = protectedAdminRoutes.some((route) => pathname.startsWith(route));

  if ((isProtectedClient || isProtectedAdmin) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"],
};
