"use client";

import { useState } from "react";
import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin/concepts", label: "概念管理", desc: "概念の作成・編集・削除・公開管理", icon: "📝" },
  { href: "/admin/dictionary", label: "辞書管理", desc: "層ごとのキーワード辞書を管理", icon: "📖" },
  { href: "/admin/mapping-rules", label: "マッピングルール", desc: "層間の写像ルールを管理", icon: "🔀" },
  { href: "/admin/feedback", label: "フィードバック", desc: "ユーザーからのフィードバック一覧", icon: "💬" },
  { href: "/admin/audit", label: "監査ログ", desc: "概念変更の履歴を確認", icon: "🔍" },
];

export default function AdminPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `エラー (${res.status})`);
      setSeedResult(`完了: 概念 ${data.conceptCount}件 / 辞書 ${data.dictCount}件 / 層 ${data.layerCount}件`);
    } catch (e: unknown) {
      setSeedResult(`失敗: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">管理ダッシュボード</h1>
        <p className="text-gray-400 mb-10">Layered Concept Atlas の管理機能</p>

        {/* Seed panel */}
        <div className="bg-gray-900 border border-yellow-700 rounded-xl p-6 mb-8">
          <h2 className="text-yellow-400 font-semibold mb-1">🌱 初期データ投入</h2>
          <p className="text-gray-400 text-sm mb-4">
            概念・辞書・レイヤー・マッピングルールのサンプルデータをDBに投入します。
            既存データがある場合はスキップされます。
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {seeding ? "投入中..." : "シードデータを投入する"}
          </button>
          {seedResult && (
            <p className={`mt-3 text-sm ${seedResult.startsWith("失敗") ? "text-red-400" : "text-green-400"}`}>
              {seedResult}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex gap-4 items-start bg-gray-900 border border-gray-700 hover:border-violet-500 rounded-xl p-6 transition-colors"
            >
              <span className="text-3xl">{link.icon}</span>
              <div>
                <h2 className="text-white font-semibold">{link.label}</h2>
                <p className="text-gray-400 text-sm mt-1">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
