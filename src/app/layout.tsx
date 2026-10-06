import type { Metadata } from "next";
import { Inter, Playfair_Display, Poppins } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { CompareProvider } from "@/providers/compare-provider";
import { TrackingProvider } from "@/providers/tracking-provider";
import { QueryProvider } from "@/providers/query-provider";
import { CompareBar } from "@/components/layout/CompareBar";
import { CookieConsent } from "@/components/layout/CookieConsent";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://c7drop.com.br"),
  title: {
    default: "Início - C7 Drop",
    template: "%s - C7 Drop",
  },
  description:
    "Fornecemos produtos de alta qualidade e procedência, ATACADO E DROPSHIPPING. Com o dropshipping, a sua loja faz a venda do produto, envia a etiqueta dessa transação para nós. E somos nós que vamos enviar o produto para o cliente seu cliente final.",
  keywords:
    "dropshipping, atacado, fornecedor dropshipping, eletrônicos, acessórios, C7 Drop",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "C7 Drop - Atacado e Dropshipping",
    description:
      "Oferecemos produtos de alta qualidade e com total garantia de procedência, tanto no modelo de ATACADO quanto de DROPSHIPPING. No dropshipping, sua loja realiza a venda do produto, envia a etiqueta de transação para nós, e nós nos encarregamos de todo o processo de envio diretamente para o seu cliente final, com agilidade e segurança.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${poppins.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <FavoritesProvider>
                  <CompareProvider>
                    <TrackingProvider>
                      {children}
                      <CompareBar />
                      <CookieConsent />
                    </TrackingProvider>
                  </CompareProvider>
                </FavoritesProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
