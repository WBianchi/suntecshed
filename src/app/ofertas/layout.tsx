import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promoções",
  description: "Os melhores produtos para seu negócio. Parcele em até 12x no cartão e aproveite as promoções da Suntecshed.",
};

export default function OfertasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
