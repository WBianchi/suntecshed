"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { FiTag } from "react-icons/fi";

const stats = [
  { value: "13+", label: "Anos no mercado" },
  { value: "5k+", label: "Clientes satisfeitos" },
  { value: "10k+", label: "Pedidos entregues" },
  { value: "4.8", label: "Avaliação média" },
];

export function BrandsAndTrust() {
  const { data: brands = [] } = useQuery<any[]>({
    queryKey: ["public-brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <section className="border-t border-gray-100 py-14">
      <div className="mx-auto max-w-[1440px] px-4">
        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-6 text-center transition-all hover:shadow-md">
              <p className="text-3xl font-extrabold text-primary" style={{ fontFamily: "var(--font-poppins)" }}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Brands */}
        {brands.length > 0 && (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                Marcas que trabalhamos
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">As melhores marcas de  do Brasil</p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
              {brands.map((brand: any) => (
                <Link
                  key={brand.id}
                  href={`/produtos?brand=${brand.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-gray-100 transition-colors group-hover:border-primary/30">
                    {brand.image ? (
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        fill
                        sizes="64px"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-50">
                        <FiTag className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 group-hover:text-primary">{brand.name}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
