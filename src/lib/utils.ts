import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Baixa um ou mais arquivos em sequência. Busca cada um como blob antes de
// baixar — a maioria dos navegadores ignora o atributo `download` em links
// de outra origem (ex: imagens em suntecshed.com.br ou no Vercel Blob) e só abre
// o arquivo numa aba nova em vez de baixar, então isso força o download de
// verdade independente da origem.
export async function downloadFiles(files: { url: string; name: string }[]) {
  for (const { url, name } of files) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Se o fetch falhar (ex: bloqueado por CORS), pelo menos abre o arquivo
      // numa aba nova em vez de falhar silenciosamente.
      window.open(url, "_blank", "noopener,noreferrer");
    }
    await new Promise((r) => setTimeout(r, 350));
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDiscount(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function stripHtml(html: string, maxLength?: number): string {
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength).trim() + "…";
  }
  return text;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}
