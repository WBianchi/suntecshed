import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { HeroSlider } from "@/components/home/HeroSlider";
import { CategoriesCarousel } from "@/components/home/CategoriesCarousel";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CentralBanner } from "@/components/home/CentralBanner";
import { PromoProducts } from "@/components/home/PromoProducts";
import { BestSellers } from "@/components/home/BestSellers";
import { OutOfStockProducts } from "@/components/home/OutOfStockProducts";


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSlider />
        <CategoriesCarousel />
        <FeaturedProducts />
        <CentralBanner />
        <PromoProducts />
        <BestSellers />
        <OutOfStockProducts />

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
