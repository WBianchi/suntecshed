"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiFileText,
  FiSearch, FiEye, FiEyeOff, FiCalendar, FiTag,
} from "react-icons/fi";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  coverImage: string | null;
  author: string | null;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

function useBlogPosts(params: { search: string; status: string; page: number }) {
  return useQuery({
    queryKey: ["admin-blog", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.search) qs.set("search", params.search);
      if (params.status) qs.set("status", params.status);
      qs.set("page", String(params.page));
      const res = await fetch(`/api/admin/blog?${qs}`);
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<{ posts: BlogPost[]; total: number; pages: number }>;
    },
  });
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function BlogPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const { data, isLoading } = useBlogPosts({ search: debouncedSearch, status, page });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const saveMut = useMutation({
    mutationFn: async (post: any) => {
      const { id, createdAt, publishedAt, ...data } = post;
      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-blog"] }); setEditing(null); setIsNew(false); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog"] }),
  });

  const handleNew = () => {
    setEditing({
      id: "", title: "", slug: "", excerpt: null, content: null,
      coverImage: null, author: null, tags: [], published: false,
      publishedAt: null, createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  };

  const setField = (key: string, value: any) => {
    if (!editing) return;
    const updates: any = { [key]: value };
    if (key === "title" && isNew && !editing.slug) {
      updates.slug = slugify(value);
    }
    setEditing({ ...editing, ...updates });
  };

  const addTag = () => {
    if (!editing || !tagInput.trim()) return;
    if (!editing.tags.includes(tagInput.trim())) {
      setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="mt-0.5 text-sm text-gray-500">{data ? `${data.total} posts` : "Gerenciar posts do blog"}</p>
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Novo Post
        </button>
      </div>

      {/* Edit Panel */}
      {editing && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">{isNew ? "Novo Post" : "Editar Post"}</h3>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-gray-400 hover:text-gray-600"><FiX className="h-4 w-4" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Título *</label>
                <input value={editing.title} onChange={(e) => setField("title", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Título do post" />
              </div>
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Slug *</label>
                <input value={editing.slug} onChange={(e) => setField("slug", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-primary" placeholder="titulo-do-post" />
              </div>
              <ImageUpload label="Imagem de Capa" value={editing.coverImage} onChange={(url) => setField("coverImage", url)} aspectRatio="video" hint="Recomendado: 1200x630px" />
              <div>
                <label className="mb-1.5 text-xs font-semibold text-gray-600">Autor</label>
                <input value={editing.author || ""} onChange={(e) => setField("author", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="C7 Drop" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Resumo</label>
              <textarea value={editing.excerpt || ""} onChange={(e) => setField("excerpt", e.target.value)} rows={2}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Breve descrição do post..." />
            </div>

            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Conteúdo (HTML)</label>
              <textarea value={editing.content || ""} onChange={(e) => setField("content", e.target.value)} rows={10}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-primary" placeholder="<p>Conteúdo do post em HTML...</p>" />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-600">Tags</label>
              <div className="flex items-center gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Digite e pressione Enter" />
                <button onClick={addTag} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200">Adicionar</button>
              </div>
              {editing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editing.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500"><FiX className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                <input type="checkbox" checked={editing.published} onChange={(e) => setField("published", e.target.checked)} className="rounded" />
                Publicar post
              </label>
            </div>

            {saveMut.error && (
              <p className="text-xs text-red-500 font-medium">{(saveMut.error as Error).message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending || !editing.title || !editing.slug}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              <FiSave className="h-3.5 w-3.5" /> {saveMut.isPending ? "Salvando..." : "Salvar Post"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {!editing && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" placeholder="Buscar posts..." />
          </div>
          {["", "published", "draft"].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={cn("rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                status === s ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
              {s === "" ? "Todos" : s === "published" ? "Publicados" : "Rascunhos"}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Posts List */}
      {data && !editing && (
        <>
          {data.posts.length > 0 ? (
            <div className="space-y-2">
              {data.posts.map((post) => (
                <div key={post.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100"><FiFileText className="h-5 w-5 text-gray-400" /></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.published ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700"><FiEye className="h-2.5 w-2.5" /> Publicado</span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500"><FiEyeOff className="h-2.5 w-2.5" /> Rascunho</span>
                      )}
                      {post.author && <span className="text-[10px] text-gray-400">por {post.author}</span>}
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><FiCalendar className="h-2.5 w-2.5" /> {new Date(post.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">{tag}</span>
                        ))}
                        {post.tags.length > 3 && <span className="text-[9px] text-gray-400">+{post.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(post); setIsNew(false); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary"><FiEdit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm("Excluir este post?")) deleteMut.mutate(post.id); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><FiTrash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiFileText className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">Nenhum post encontrado</p>
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition-all",
                    page === p ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100")}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
