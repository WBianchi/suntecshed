import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/utils";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  if (!product) return { title: "Product" };

  const description = stripHtml(product.shortDescription || product.description || "", 160)
    || `${product.name} — buy at Suntecshed with guaranteed authenticity.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default function ProdutoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
