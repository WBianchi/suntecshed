import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) return { title: "Categoria" };

  return {
    title: category.name,
    description: category.description || `Confira os produtos de ${category.name} na Suntecshed — atacado e dropshipping com procedência garantida.`,
    openGraph: category.image ? { images: [category.image] } : undefined,
  };
}

export default function CategoriaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
