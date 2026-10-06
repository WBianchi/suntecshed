"use client";

import Image from "next/image";

interface CategoryHeaderProps {
  name: string;
  description: string;
  productCount: number;
  image?: string | null;
}

export function CategoryHeader({ name, description, productCount, image }: CategoryHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gray-900">
      <div className="absolute inset-0">
        {image && <Image src={image} alt={name} fill sizes="100vw" className="object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent" />
      </div>
      <div className="relative z-10 px-5 py-8 sm:px-12 sm:py-16">
        <span className="mb-2 inline-block rounded-full bg-primary/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm sm:mb-3 sm:px-4 sm:py-1 sm:text-xs">
          {productCount} produtos
        </span>
        <h1
          className="text-2xl font-bold text-white sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          {name}
        </h1>
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-gray-300 sm:mt-3 sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
