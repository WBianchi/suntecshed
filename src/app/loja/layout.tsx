import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja",
  description: "Produtos Archive - C7 Drop",
};

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
