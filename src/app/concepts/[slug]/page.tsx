"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LayerTraversal } from "@/components/feature/LayerTraversal";

const LAYER_COLORS: Record<string, string> = {
  l0: "bg-purple-900 text-purple-300",
  l1: "bg-cyan-900 text-cyan-300",
  l2: "bg-orange-900 text-orange-300",
  l3: "bg-green-900 text-green-300",
  l4: "bg-yellow-900 text-yellow-300",
  l5: "bg-blue-900 text-blue-300",
};

type LayerEntry = {
  id: string;
  layerId: string;
  content: string;
  layer: { id: string; slug: string; nameJa: string; colorClass: string; index: number };
};

type Concept = {
  id: string;
  slug: string;
  titleJa: string;
  summary: string | null;
  tags: string[];
  isPublished: boolean;
  layerEntries: LayerEntry[];
  linksFrom: { id: string; relation: string; to: { slug: string; titleJa: string } }[];
};

export default function ConceptDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/concepts/${slug}`)
      .then((r) => {
        if (r.status === 404) { router.push("/concepts"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setConcept(d); })
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!concept) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/concepts" className="text-violet-400 hover:underline text-sm mb-6 inline-block">
          ← 概念一覧に戻る
        </Link>

        <div className="mb-8">
          <p className="font-mono text-gray-500 text-sm mb-2">{concept.slug}</p>
          <h1 className="text-4xl font-bold text-white mb-4">{concept.titleJa}</h1>
          {concept.summary && (
            <p className="text-gray-300 text-lg leading-relaxed mb-4">{concept.summary}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {concept.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Layer entries */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">層ごとの定義</h2>
          <LayerTraversal entries={concept.layerEntries} />
        </div>

        {/* Links */}
        {concept.linksFrom.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">関連概念</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concept.linksFrom.map((link) => (
                <Link
                  key={link.id}
                  href={`/concepts/${link.to.slug}`}
                  className="flex items-center gap-3 bg-gray-900 border border-gray-700 hover:border-violet-500 rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="text-gray-400 text-sm">{link.relation}</span>
                  <span className="text-white font-medium">{link.to.titleJa}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-10 flex gap-3">
          <Link
            href={`/analysis?ref=${concept.slug}`}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            この概念を分析する
          </Link>
          <Link
            href={`/compare?ids=${concept.id}`}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-semibold transition-colors"
          >
            他の概念と比較する
          </Link>
        </div>
      </div>
    </div>
  );
}
