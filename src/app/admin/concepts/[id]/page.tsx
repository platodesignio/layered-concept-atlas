"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Layer = { id: string; slug: string; nameJa: string; index: number };
type LayerEntry = { id: string; layerId: string; content: string; layer: { id: string; slug: string; nameJa: string; colorClass: string; index: number } };
type Concept = {
  id: string; slug: string; titleJa: string; summary: string | null;
  tags: string[]; isPublished: boolean; layerEntries: LayerEntry[];
};

export default function AdminConceptEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [form, setForm] = useState({ titleJa: "", summary: "", tags: "", isPublished: false });
  const [entryContent, setEntryContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savingLayer, setSavingLayer] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/concepts/${id}`).then((r) => r.json()),
      fetch("/api/layers").then((r) => r.json()),
    ]).then(([c, ls]) => {
      setConcept(c);
      setLayers(ls);
      setForm({ titleJa: c.titleJa, summary: c.summary ?? "", tags: c.tags?.join(", ") ?? "", isPublished: c.isPublished });
      const map: Record<string, string> = {};
      (c.layerEntries as LayerEntry[]).forEach((e) => { map[e.layerId] = e.content; });
      setEntryContent(map);
    });
  }, [id]);

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/concepts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleJa: form.titleJa,
          summary: form.summary || undefined,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          isPublished: form.isPublished,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "保存失敗"); }
      setSuccess("保存しました");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLayer(layerId: string) {
    setSavingLayer(layerId);
    try {
      await fetch(`/api/concepts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layerId, content: entryContent[layerId] ?? "" }),
      });
    } finally {
      setSavingLayer(null);
    }
  }

  if (!concept) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/admin/concepts" className="text-violet-400 hover:underline text-sm mb-6 inline-block">
          ← 概念一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-white mb-8">概念を編集: {concept.titleJa}</h1>

        {/* Meta form */}
        <form onSubmit={handleSaveMeta} className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 space-y-4">
          <h2 className="text-white font-semibold">基本情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">日本語タイトル</label>
              <input value={form.titleJa} onChange={(e) => setForm((f) => ({ ...f, titleJa: e.target.value }))} required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">タグ（カンマ区切り）</label>
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">サマリー</label>
            <textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4 accent-violet-600" />
            <span className="text-sm text-gray-300">公開する</span>
          </label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors">
            {saving ? "保存中..." : "保存"}
          </button>
        </form>

        {/* Layer entries */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold">層ごとのテキスト</h2>
          {layers.map((layer) => (
            <div key={layer.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-xs text-violet-400 mr-2">{layer.slug.toUpperCase()}</span>
                  <span className="text-white text-sm font-medium">{layer.nameJa}</span>
                </div>
                <button
                  onClick={() => handleSaveLayer(layer.id)}
                  disabled={savingLayer === layer.id}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white rounded text-xs font-semibold transition-colors"
                >
                  {savingLayer === layer.id ? "保存中..." : "保存"}
                </button>
              </div>
              <textarea
                value={entryContent[layer.id] ?? ""}
                onChange={(e) => setEntryContent((prev) => ({ ...prev, [layer.id]: e.target.value }))}
                rows={4}
                placeholder={`${layer.nameJa} の観点からの記述...`}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
