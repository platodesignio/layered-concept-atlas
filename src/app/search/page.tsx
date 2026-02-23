"use client";

import { useState } from "react";
import Link from "next/link";

interface Result {
  type: string;
  id: string;
  title: string;
  excerpt: string;
}

const TYPE_PATHS: Record<string, string> = {
  project: "/projects/",
  report: "/reports/",
  stpf: "/stpf/",
  user: "/users/",
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setResults(d.results ?? []);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">検索</h1>
      <form onSubmit={doSearch} className="flex gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 border border-black px-2 py-1 text-sm"
          placeholder="プロジェクト・報告・STPF・ユーザーを検索..."
          minLength={2}
        />
        <button type="submit" disabled={loading} className="bg-black text-white px-3 py-1 text-sm disabled:opacity-50">
          {loading ? "検索中..." : "検索"}
        </button>
      </form>

      <div className="divide-y">
        {results.map((r) => (
          <div key={r.id} className="py-2">
            <p className="text-xs text-gray-400 mb-0.5">{r.type.toUpperCase()}</p>
            <Link href={`${TYPE_PATHS[r.type] ?? "/"}${r.id}`} className="font-medium text-sm">
              {r.title}
            </Link>
            {r.excerpt && <p className="text-xs text-gray-500 mt-0.5">{r.excerpt}</p>}
          </div>
        ))}
        {results.length === 0 && q && !loading && (
          <p className="py-4 text-sm text-gray-400">結果なし</p>
        )}
      </div>
    </div>
  );
}
