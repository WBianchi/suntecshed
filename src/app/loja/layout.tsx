import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja",
  description: "Produtos Archive - Suntecshed",
};

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
