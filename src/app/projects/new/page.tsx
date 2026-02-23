"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
    visibility: "NETWORK_ONLY",
    receiptAddress: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p>ログインが必要です。</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          visibility: form.visibility,
          receiptAddress: form.receiptAddress || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data.error));
        return;
      }
      router.push(`/projects/${data.project.id}`);
    } catch (e) {
      setError("送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">プロジェクト作成</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-black px-2 py-1"
            maxLength={200}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">説明 *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-black px-2 py-1"
            rows={6}
            maxLength={5000}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">タグ（カンマ区切り）</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full border border-black px-2 py-1"
            placeholder="例: AI, 物理, 経済学"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">公開範囲</label>
          <select
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            className="w-full border border-black px-2 py-1"
          >
            <option value="PUBLIC">PUBLIC — 誰でも閲覧可</option>
            <option value="LINK_ONLY">LINK_ONLY — リンクを持つ人のみ</option>
            <option value="NETWORK_ONLY">NETWORK_ONLY — ネットワーク会員のみ</option>
            <option value="PROJECT_ONLY">PROJECT_ONLY — プロジェクトメンバーのみ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">受領アドレス（ETH、任意）</label>
          <input
            value={form.receiptAddress}
            onChange={(e) => setForm({ ...form, receiptAddress: e.target.value })}
            className="w-full border border-black px-2 py-1 font-mono text-sm"
            placeholder="0x..."
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "作成中..." : "作成する"}
        </button>
      </form>
    </div>
  );
}
