"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useQuery } from "@tanstack/react-query";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function HeroSlider() {
  const { data: apiBanners = [] } = useQuery<any[]>({
    queryKey: ["public-banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const heroBanners = apiBanners;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const getAlignment = (position: string) => {
    switch (position) {
      case "CENTER":
        return "items-center text-center";
      case "RIGHT":
        return "items-end text-right";
      default:
        return "items-start text-left";
    }
  };

  if (heroBanners.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {heroBanners.map((banner) => (
            <div key={banner.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative flex min-h-[320px] items-center justify-center sm:min-h-[500px] lg:min-h-[600px]">
                <div
                  className="absolute inset-0 sm:hidden"
                  style={{
                    backgroundImage: `url(${banner.bgImageMobile || banner.bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div
                  className="absolute inset-0 hidden sm:block"
                  style={{
                    backgroundImage: `url(${banner.bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-10">
                  <div
                    className={cn(
                      "flex max-w-xl flex-col gap-5",
                      getAlignment(banner.itemsPosition),
                      banner.itemsPosition === "CENTER" && "mx-auto"
                    )}
                  >
                    {banner.badge && (
                      <span className="inline-block w-fit rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white badge-pulse">
                        {banner.badge}
                      </span>
                    )}
                    <h2
                      className="text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-6xl"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    >
                      {banner.title}
                    </h2>
                    {banner.paragraph && (
                      <p className="text-sm text-white/80 sm:text-base lg:text-lg">
                        {banner.paragraph}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {banner.button1Text && (
                        <Link
                          href={banner.button1Link || "/"}
                          className="rounded-full bg-primary px-6 py-3 text-xs font-bold text-white transition-all sm:px-8 sm:py-3.5 sm:text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                        >
                          {banner.button1Text}
                        </Link>
                      )}
                      {banner.button2Text && (
                        <Link
                          href={banner.button2Link || "/"}
                          className="rounded-full border-2 border-white/30 bg-white/10 px-6 py-3 text-xs font-bold text-white backdrop-blur-sm transition-all sm:px-8 sm:py-3.5 sm:text-sm hover:border-white/60 hover:bg-white/20 active:scale-95"
                        >
                          {banner.button2Text}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40"
      >
        <FiChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {heroBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              selectedIndex === index
                ? "w-8 bg-primary"
                : "w-2 bg-white/50 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </section>
  );
}
