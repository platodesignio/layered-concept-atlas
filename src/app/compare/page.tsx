"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CompareGrid } from "@/components/feature/CompareGrid";

const LAYER_NAMES: Record<string, string> = {
  l0: "生成位相",
  l1: "可能性空間",
  l2: "時間因果",
  l3: "主体心理",
  l4: "社会評価",
  l5: "制度形式",
};

type Concept = { id: string; slug: string; titleJa: string };
type CompareResult = {
  conceptId: string;
  slug: string;
  titleJa: string;
  scores: { layerSlug: string; layerId: string; normalizedScore: number; matchedTerms: string[] }[];
  dominantLayer: string;
  crossoverDegree: number;
  layerEntries: { content: string; layer: { slug: string; nameJa: string; index: number } }[];
};

function CompareInner() {
  const searchParams = useSearchParams();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<CompareResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/concepts?limit=100&published=true")
      .then((r) => r.json())
      .then((d) => setConcepts(d.concepts ?? []));
  }, []);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (ids) setSelected(ids.split(",").filter(Boolean));
  }, [searchParams]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  async function handleCompare() {
    if (selected.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptIds: selected }),
      });
      if (!res.ok) throw new Error("比較に失敗しました");
      const data = await res.json();
      setResults(data.results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">概念比較</h1>
        <p className="text-gray-400 mb-8">2〜5つの概念を選択して層スコアを比較します。</p>

        {/* Concept selector */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">
            概念を選択 ({selected.length}/5)
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {concepts.map((c) => {
              const isSel = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSel
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {c.titleJa}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleCompare}
            disabled={selected.length < 2 || loading}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "比較中..." : "比較する"}
          </button>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </div>

        {results && (
          <CompareGrid results={results} layerNames={LAYER_NAMES} />
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CompareInner />
    </Suspense>
  );
}
