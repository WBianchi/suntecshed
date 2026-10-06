import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todos os Produtos",
  description: "Explore o catálogo completo da Suntecshed — produtos para atacado e dropshipping com procedência garantida.",
};

export default function ProdutosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
