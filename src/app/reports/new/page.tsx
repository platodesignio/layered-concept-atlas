"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function NewReportForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";

  const [form, setForm] = useState({
    periodFrom: "",
    periodTo: "",
    outcomes: "",
    progress: "",
    issues: "",
    risks: "",
    nextActions: "",
    visibility: "PROJECT_ONLY",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) return <div className="max-w-xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) { setError("projectId が必要です"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        periodFrom: new Date(form.periodFrom).toISOString(),
        periodTo: new Date(form.periodTo).toISOString(),
        outcomes: form.outcomes,
        progress: form.progress,
        issues: form.issues,
        risks: form.risks,
        nextActions: form.nextActions,
        visibility: form.visibility,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(JSON.stringify(data.error)); setLoading(false); return; }
    router.push(`/reports/${data.report.id}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">報告作成</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">期間 開始 *</label>
            <input type="date" required value={form.periodFrom} onChange={(e) => setForm({ ...form, periodFrom: e.target.value })} className="w-full border border-black px-2 py-1 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">期間 終了 *</label>
            <input type="date" required value={form.periodTo} onChange={(e) => setForm({ ...form, periodTo: e.target.value })} className="w-full border border-black px-2 py-1 text-sm" />
          </div>
        </div>
        {(["outcomes", "progress", "issues", "risks", "nextActions"] as const).map((field) => {
          const labels: Record<string, string> = { outcomes: "成果 *", progress: "進捗 *", issues: "課題 *", risks: "リスク *", nextActions: "次のアクション *" };
          return (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">{labels[field]}</label>
              <textarea
                required
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-black px-2 py-1 text-sm"
                rows={3}
                maxLength={10000}
              />
            </div>
          );
        })}
        <div>
          <label className="block text-sm font-medium mb-1">公開範囲</label>
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full border border-black px-2 py-1 text-sm">
            <option value="PROJECT_ONLY">PROJECT_ONLY</option>
            <option value="NETWORK_ONLY">NETWORK_ONLY</option>
            <option value="LINK_ONLY">LINK_ONLY</option>
            <option value="PUBLIC">PUBLIC</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 text-sm disabled:opacity-50">
          {loading ? "作成中..." : "報告を作成（下書き）"}
        </button>
      </form>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-8">読み込み中...</div>}>
      <NewReportForm />
    </Suspense>
  );
}
