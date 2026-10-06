"use client";

import { useQuery } from "@tanstack/react-query";
import { FiStar, FiLoader, FiClock, FiCheck, FiExternalLink } from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? <FaStar key={i} className="h-3 w-3 text-amber-400" /> : <FaRegStar key={i} className="h-3 w-3 text-gray-300" />
      )}
    </div>
  );
}

export function AccountReviews() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews", { method: "PUT", credentials: "include" });
      if (!res.ok) return { reviews: [] };
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const reviews = data?.reviews || [];

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <FiStar className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-500">Você ainda não fez nenhuma avaliação</p>
        <p className="mt-1 text-xs text-gray-400">Avalie produtos que você comprou para ajudar outros clientes</p>
        <Link href="/produtos" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review: any) => {
        const product = review.product;
        const productImg = product?.images?.[0]?.url;

        return (
          <div key={review.id} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              {/* Product image */}
              <Link href={`/produto/${product?.slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                {productImg ? (
                  <Image src={productImg} alt={product.name} fill sizes="56px" className="object-contain p-1" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FiStar className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/produto/${product?.slug}`} className="truncate text-sm font-semibold text-gray-900 hover:text-primary">
                    {product?.name}
                  </Link>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    review.approved
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {review.approved ? (
                      <span className="flex items-center gap-1"><FiCheck className="h-2.5 w-2.5" /> Aprovada</span>
                    ) : (
                      <span className="flex items-center gap-1"><FiClock className="h-2.5 w-2.5" /> Pendente</span>
                    )}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>

                {review.title && <h4 className="mt-2 text-xs font-bold text-gray-900">{review.title}</h4>}
                {review.comment && <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{review.comment}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
