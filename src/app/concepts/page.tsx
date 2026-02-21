"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConceptCard } from "@/components/feature/ConceptCard";

type Concept = {
  id: string;
  slug: string;
  titleJa: string;
  summary: string | null;
  tags: string[];
  layerEntries: { layerId: string; layer: { slug: string; nameJa: string } }[];
};

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (q) params.set("q", q);
    fetch(`/api/concepts?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setConcepts(d.concepts ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(inputQ);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">概念ライブラリ</h1>
            <p className="text-gray-400 mt-1">全 {total} 件の概念</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              placeholder="概念名で検索..."
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 w-52"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              検索
            </button>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : concepts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">概念が見つかりません</p>
            {q && (
              <button onClick={() => { setQ(""); setInputQ(""); }} className="mt-4 text-violet-400 hover:underline">
                検索をクリア
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {concepts.map((c) => (
              <ConceptCard
                key={c.id}
                id={c.id}
                slug={c.slug}
                titleJa={c.titleJa}
                summary={c.summary ?? undefined}
                tags={c.tags}
                layerEntries={c.layerEntries}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-sm transition-colors"
            >
              前へ
            </button>
            <span className="px-4 py-2 text-gray-400 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-sm transition-colors"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
