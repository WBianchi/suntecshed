"use client";

import { use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import {
  FiCalendar, FiUser, FiTag, FiArrowLeft, FiShare2, FiLoader,
  FiBookOpen, FiClock, FiFacebook, FiTwitter, FiCopy, FiCheck,
} from "react-icons/fi";
import { useState } from "react";

interface BlogPostFull {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  author: string | null;
  published: boolean;
  createdAt: string;
}

function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) return null;
      return res.json() as Promise<BlogPostFull>;
    },
  });
}

function useRelatedPosts(category: string | null, currentId: string) {
  return useQuery({
    queryKey: ["blog-related", category, currentId],
    queryFn: async () => {
      if (!category) return [];
      const res = await fetch(`/api/blog?category=${category}&published=true`);
      if (!res.ok) return [];
      const data = await res.json();
      const posts = data.posts || data || [];
      return posts.filter((p: any) => p.id !== currentId).slice(0, 3);
    },
    enabled: !!category,
  });
}

function readingTime(text: string): number {
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: post, isLoading } = useBlogPost(slug);
  const { data: related = [] } = useRelatedPosts(post?.category || null, post?.id || "");
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {isLoading && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <FiLoader className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        )}

        {!isLoading && !post && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <FiBookOpen className="h-16 w-16 text-gray-200" />
            <h2 className="mt-4 text-xl font-bold text-gray-700">Artigo não encontrado</h2>
            <p className="mt-2 text-sm text-gray-500">Este artigo pode ter sido removido ou o link está incorreto.</p>
            <Link href="/blog" className="mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              <FiArrowLeft className="h-4 w-4" /> Voltar ao Blog
            </Link>
          </div>
        )}

        {post && (
          <>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
              <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-6 sm:pb-14 sm:pt-8">
                <Breadcrumb items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
                <div className="mt-6 max-w-3xl sm:mt-8">
                  {post.category && (
                    <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
                      <FiTag className="h-3 w-3" /> {post.category}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold text-white sm:text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-playfair)" }}>
                    {post.title}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/50 sm:text-sm">
                    <span className="flex items-center gap-1.5">
                      <FiCalendar className="h-3.5 w-3.5" /> {new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {post.author && (
                      <span className="flex items-center gap-1.5"><FiUser className="h-3.5 w-3.5" /> {post.author}</span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <FiClock className="h-3.5 w-3.5" /> {readingTime(post.content)} min de leitura
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mx-auto -mt-1 max-w-[1440px] px-4">
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg sm:rounded-3xl">
                  <img src={post.coverImage} alt={post.title} className="w-full object-cover" style={{ maxHeight: "480px" }} />
                </div>
              </div>
            )}

            {/* Content */}
            <section className="py-8 sm:py-12">
              <div className="mx-auto max-w-[1440px] px-4">
                <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                  {/* Article */}
                  <article className="mx-auto max-w-3xl lg:mx-0">
                    <div
                      className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:leading-relaxed prose-p:text-gray-600 prose-a:text-primary prose-img:rounded-xl prose-strong:text-gray-800"
                      style={{ fontFamily: "var(--font-inter)" }}
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Share */}
                    <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 sm:p-6">
                      <h3 className="mb-3 text-sm font-bold text-gray-900">Compartilhe este artigo</h3>
                      <div className="flex flex-wrap gap-2">
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                          <FiFacebook className="h-3.5 w-3.5" /> Facebook
                        </a>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                          <FiTwitter className="h-3.5 w-3.5" /> Twitter
                        </a>
                        <button onClick={copyLink}
                          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                          {copied ? <FiCheck className="h-3.5 w-3.5 text-green-600" /> : <FiCopy className="h-3.5 w-3.5" />}
                          {copied ? "Copiado!" : "Copiar Link"}
                        </button>
                      </div>
                    </div>

                    {/* Back */}
                    <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                      <FiArrowLeft className="h-4 w-4" /> Voltar ao Blog
                    </Link>
                  </article>

                  {/* Sidebar */}
                  <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-6">
                      {/* Author Card */}
                      <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                            {(post.author || "H")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{post.author || "C7drop"}</p>
                            <p className="text-[11px] text-gray-500">Equipe C7 Drop</p>
                          </div>
                        </div>
                      </div>

                      {/* Related */}
                      {related.length > 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-white p-5">
                          <h4 className="mb-4 text-sm font-bold text-gray-900">Artigos Relacionados</h4>
                          <div className="space-y-3">
                            {related.map((r: any) => (
                              <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                                <h5 className="line-clamp-2 text-xs font-semibold text-gray-700 transition-colors group-hover:text-primary">
                                  {r.title}
                                </h5>
                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          </>
        )}

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
