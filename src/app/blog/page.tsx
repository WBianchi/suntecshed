"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiCalendar, FiUser, FiArrowRight, FiLoader, FiBookOpen, FiTag } from "react-icons/fi";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  author: string | null;
  published: boolean;
  createdAt: string;
}

const categories = [
  { value: "", label: "Todos" },
  { value: "dicas", label: "Dicas" },
  { value: "decoracao", label: "Decoração" },
  { value: "tendencias", label: "Tendências" },
  { value: "cuidados", label: "Cuidados" },
  { value: "receitas-lar", label: "Receitas do Lar" },
];

function useBlogPosts(search: string, category: string) {
  return useQuery({
    queryKey: ["blog-posts", search, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      params.set("published", "true");
      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.posts || data || []) as BlogPost[];
    },
  });
}

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [category, setCategory] = useState("");
  const { data: posts = [], isLoading } = useBlogPosts(searchDebounced, category);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__blogSearch);
    (window as any).__blogSearch = setTimeout(() => setSearchDebounced(val), 400);
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Blog" }]} />
            <div className="mt-6 max-w-2xl sm:mt-8">
              <h1 className="text-3xl font-bold text-white sm:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Blog
              </h1>
              <p className="mt-3 text-base text-white/60 sm:mt-4 sm:text-lg">
                Dicas de decoração, tendências e inspirações para transformar seu lar
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-[1440px] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button key={c.value} onClick={() => setCategory(c.value)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      category === c.value
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary sm:w-64"
                  placeholder="Buscar artigos..." />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50/50 py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">

            {isLoading && (
              <div className="flex justify-center py-20">
                <FiLoader className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            )}

            {!isLoading && posts.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                <FiBookOpen className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-bold text-gray-600">Nenhum artigo encontrado</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {search ? "Tente outro termo de busca" : "Em breve teremos novos artigos para você"}
                </p>
              </div>
            )}

            {/* Featured Post */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="group mb-8 block">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg">
                  <div className="grid sm:grid-cols-2">
                    <div className="aspect-[16/10] overflow-hidden bg-gray-100 sm:aspect-auto sm:min-h-[320px]">
                      {featured.coverImage ? (
                        <img src={featured.coverImage} alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <FiBookOpen className="h-16 w-16 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-10">
                      {featured.category && (
                        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <FiTag className="h-3 w-3" /> {featured.category}
                        </span>
                      )}
                      <h2 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-primary sm:text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500">{featured.excerpt}</p>
                      )}
                      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" /> {new Date(featured.createdAt).toLocaleDateString("pt-BR")}</span>
                        {featured.author && <span className="flex items-center gap-1"><FiUser className="h-3 w-3" /> {featured.author}</span>}
                      </div>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        Ler artigo <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                    <article className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <FiBookOpen className="h-10 w-10 text-gray-200" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {post.category && (
                          <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            {post.category}
                          </span>
                        )}
                        <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-primary sm:text-base" style={{ fontFamily: "var(--font-playfair)" }}>
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 line-clamp-2 text-xs text-gray-500">{post.excerpt}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <FiCalendar className="h-3 w-3" /> {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            Ler <FiArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}

          </div>
        </section>

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
