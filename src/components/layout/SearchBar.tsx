"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiSearch, FiX, FiTrendingUp, FiLoader } from "react-icons/fi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
}

const trendingSearches = [
  "Fone Bluetooth",
  "Smartwatch",
  "Bluetooth Speaker",
  "Power Bank",
  "Digital Camera",
  "Mini Ventilador",
];

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchProducts = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(term)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchProducts]);

  const handleSubmit = () => {
    if (query.trim()) {
      setIsFocused(false);
      router.push(`/produtos?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        className={cn(
          "flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 transition-all duration-300 dark:bg-gray-900",
          isFocused
            ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
            : "border-border hover:border-gray-400 dark:hover:border-gray-600"
        )}
      >
        <FiSearch className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="What are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiX className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {/* Dropdown — search results */}
      {isFocused && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-xl dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <FiLoader className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div>
              {results.map((p) => (
                <Link
                  key={p.id}
                  href={`/produto/${p.slug}`}
                  onClick={() => setIsFocused(false)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-contain p-0.5" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <FiSearch className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        R$ {p.price.toFixed(2).replace(".", ",")}
                      </span>
                      {p.compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          R$ {p.compareAtPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <button
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-3 text-sm font-semibold text-primary hover:bg-gray-50"
              >
                See all results
              </button>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}

      {/* Dropdown — trending when empty */}
      {isFocused && query.length < 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-white p-4 shadow-xl dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FiTrendingUp className="h-3.5 w-3.5" />
            Most searched
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                }}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
