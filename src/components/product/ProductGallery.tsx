"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { FiZoomIn, FiChevronLeft, FiChevronRight, FiDownload } from "react-icons/fi";
import { cn, downloadFiles } from "@/lib/utils";

interface ProductGalleryProps {
  images: { src: string; alt: string }[];
  discount?: number;
  productName?: string;
}

export function ProductGallery({ images, discount, productName = "produto" }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const prev = () => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const slugBase = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const handleDownloadAll = () => {
    downloadFiles(
      images.map((img, i) => ({ url: img.src, name: `${slugBase || "product"}-${i + 1}.jpg` }))
    );
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Main Image */}
      <div
        ref={imgRef}
        className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 sm:cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={images[activeIndex]?.src || ""}
          alt={images[activeIndex]?.alt || ""}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-contain transition-transform duration-300",
            isZoomed && "hidden sm:block sm:scale-[2]"
          )}
          style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          priority
        />
        {/* Non-zoomed version for mobile */}
        <Image
          src={images[activeIndex]?.src || ""}
          alt={images[activeIndex]?.alt || ""}
          fill
          sizes="100vw"
          className={cn("object-contain sm:hidden", isZoomed && "block")}
          priority
        />

        {discount && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold text-white sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs">
            -{discount}%
          </span>
        )}

        {/* Arrows — always visible on mobile, hover on desktop */}
        <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-3 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm sm:h-10 sm:w-10 sm:transition-transform sm:hover:scale-110">
            <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm sm:h-10 sm:w-10 sm:transition-transform sm:hover:scale-110">
            <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Mobile dots */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-white/60"
              )}
            />
          ))}
        </div>

        <div className="absolute bottom-4 right-4 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          <FiZoomIn className="h-4 w-4" />
        </div>
      </div>

      {/* Thumbnails — hidden on mobile */}
      <div className="hidden gap-2 overflow-x-auto pb-1 sm:flex">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
              i === activeIndex
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent opacity-60 hover:opacity-100"
            )}
          >
            <Image src={img.src} alt={img.alt} fill sizes="80px" className="object-contain" />
          </button>
        ))}
      </div>

      {/* Baixar imagens — útil pra quem revende/anuncia o produto */}
      <button
        onClick={handleDownloadAll}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 transition-all hover:border-primary hover:text-primary sm:w-auto sm:self-start sm:px-4"
      >
        <FiDownload className="h-3.5 w-3.5" />
        Baixar Imagens
      </button>
    </div>
  );
}
