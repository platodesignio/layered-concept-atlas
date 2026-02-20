"use client";

import { useState } from "react";
import { ScoreBar } from "@/components/feature/ScoreBar";
import { HighlightView } from "@/components/feature/HighlightView";

type LayerScore = {
  layerSlug: string;
  layerId: string;
  rawScore: number;
  normalizedScore: number;
  matchedTerms: string[];
};

type HighlightSpan = {
  text: string;
  layerSlug: string | null;
  start: number;
  end: number;
};

type AnalysisResult = {
  runId: string;
  cached: boolean;
  scores: LayerScore[];
  dominantLayer: string;
  crossoverDegree: number;
  entropy: number;
  decompositionHints: string[];
  highlights: HighlightSpan[];
  inputText: string;
};

const LAYER_NAMES: Record<string, string> = {
  l0: "生成位相",
  l1: "可能性空間",
  l2: "時間因果",
  l3: "主体心理",
  l4: "社会評価",
  l5: "制度形式",
};

export default function AnalysisPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `サーバーエラー (${res.status})`);
      }
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">テキスト分析</h1>
        <p className="text-gray-400 mb-8">
          テキストを入力すると、6つの概念層に分解してスコアとハイライトを表示します。
        </p>

        <form onSubmit={handleSubmit} className="mb-10">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="分析したいテキストを入力してください（最大5000文字）"
            maxLength={5000}
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-vertical"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-500 text-sm">{text.length} / 5000</span>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "分析中..." : "分析する"}
            </button>
          </div>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </form>

        {result && (
          <div className="space-y-8">
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="px-3 py-1 bg-violet-900 text-violet-300 rounded-full">
                主要層: {LAYER_NAMES[result.dominantLayer] ?? result.dominantLayer}
              </span>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full">
                クロスオーバー度: {(result.crossoverDegree * 100).toFixed(0)}%
              </span>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full">
                エントロピー: {result.entropy.toFixed(3)}
              </span>
              {result.cached && (
                <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full">キャッシュ済み</span>
              )}
            </div>

            {/* Decomposition Hints */}
            {result.decompositionHints.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                <h2 className="text-white font-semibold mb-3">分解ヒント</h2>
                <ul className="space-y-1">
                  {result.decompositionHints.map((hint, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-violet-400">›</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Score Bar */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">層スコア</h2>
              <ScoreBar scores={result.scores} layerNames={LAYER_NAMES} />
            </div>

            {/* Highlight */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">ハイライト表示</h2>
              <HighlightView spans={result.highlights} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
