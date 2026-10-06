import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://suntecshed.com.br";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/loja", priority: 0.9, changeFrequency: "daily" },
  { path: "/produtos", priority: 0.9, changeFrequency: "daily" },
  { path: "/ofertas", priority: 0.8, changeFrequency: "daily" },
  { path: "/quem-somos", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contato", priority: 0.5, changeFrequency: "monthly" },
  { path: "/ajuda", priority: 0.4, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/formas-de-pagamento", priority: 0.3, changeFrequency: "yearly" },
  { path: "/prazo-de-entrega", priority: 0.3, changeFrequency: "yearly" },
  { path: "/trocas-e-devolucoes", priority: 0.3, changeFrequency: "yearly" },
  { path: "/politica-de-privacidade", priority: 0.2, changeFrequency: "yearly" },
  { path: "/termos-de-uso", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, posts] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categoria/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/produto/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const postEntries: MetadataRoute.Sitemap = (posts as { slug: string; updatedAt: Date }[]).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...postEntries];
}
