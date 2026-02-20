"use client";

import { useEffect, useState } from "react";

const LAYER_NAMES: Record<string, string> = {
  l0: "生成位相",
  l1: "可能性空間",
  l2: "時間因果",
  l3: "主体心理",
  l4: "社会評価",
  l5: "制度形式",
};

type Layer = { id: string; slug: string; nameJa: string; index: number };
type MappingResult = {
  scores: { layerSlug: string; normalizedScore: number }[];
  mappings: { ruleId: string; applied: boolean; reason: string }[];
};

export default function MappingPage() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [text, setText] = useState("");
  const [fromLayerId, setFromLayerId] = useState("");
  const [toLayerId, setToLayerId] = useState("");
  const [result, setResult] = useState<MappingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/layers")
      .then((r) => r.json())
      .then((d: Layer[]) => {
        setLayers(d);
        if (d.length >= 2) {
          setFromLayerId(d[0].id);
          setToLayerId(d[1].id);
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !fromLayerId || !toLayerId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fromLayerId, toLayerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `サーバーエラー (${res.status})`);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">層間写像</h1>
        <p className="text-gray-400 mb-8">
          テキストと変換元・変換先の層を指定すると、マッピングルールを適用した結果を表示します。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mb-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">変換元の層</label>
              <select
                value={fromLayerId}
                onChange={(e) => setFromLayerId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.slug.toUpperCase()}: {l.nameJa}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">変換先の層</label>
              <select
                value={toLayerId}
                onChange={(e) => setToLayerId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.slug.toUpperCase()}: {l.nameJa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">テキスト</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="写像するテキストを入力..."
              rows={5}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-vertical"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "実行中..." : "写像を実行"}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>

        {result && (
          <div className="space-y-6">
            {/* Applied rules */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">適用されたルール</h2>
              {result.mappings.length === 0 ? (
                <p className="text-gray-500 text-sm">この層間のルールは登録されていません。</p>
              ) : (
                <div className="space-y-2">
                  {result.mappings.map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 px-4 py-3 rounded-lg ${
                        m.applied ? "bg-green-900/30 border border-green-700" : "bg-gray-800 border border-gray-700"
                      }`}
                    >
                      <span className={`mt-0.5 text-sm font-bold ${m.applied ? "text-green-400" : "text-gray-500"}`}>
                        {m.applied ? "✓" : "✗"}
                      </span>
                      <p className="text-sm text-gray-300">{m.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scores */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">層スコア</h2>
              <div className="space-y-2">
                {result.scores.map((s) => (
                  <div key={s.layerSlug} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-mono text-gray-400 shrink-0">
                      {s.layerSlug.toUpperCase()}: {LAYER_NAMES[s.layerSlug] ?? s.layerSlug}
                    </span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, s.normalizedScore * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {(s.normalizedScore * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
