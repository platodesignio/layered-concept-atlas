"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props { params: { id: string } }

export default function ReviseReportPage({ params }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    revisionReason: "",
    outcomes: "",
    progress: "",
    issues: "",
    risks: "",
    nextActions: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.report) {
          const r = d.report;
          setForm((f) => ({
            ...f,
            outcomes: r.outcomes,
            progress: r.progress,
            issues: r.issues,
            risks: r.risks,
            nextActions: r.nextActions,
          }));
        }
      });
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/reports/${params.id}/revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(JSON.stringify(data.error)); setLoading(false); return; }
    router.push(`/reports/${params.id}`);
  };

  if (!session) return <div className="max-w-xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">報告を改訂する</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">改訂理由 * (10文字以上)</label>
          <textarea
            required
            value={form.revisionReason}
            onChange={(e) => setForm({ ...form, revisionReason: e.target.value })}
            className="w-full border border-black px-2 py-1 text-sm"
            rows={3}
            minLength={10}
            maxLength={1000}
          />
        </div>
        {(["outcomes", "progress", "issues", "risks", "nextActions"] as const).map((field) => {
          const labels: Record<string, string> = { outcomes: "成果", progress: "進捗", issues: "課題", risks: "リスク", nextActions: "次のアクション" };
          return (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">{labels[field]}</label>
              <textarea
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-black px-2 py-1 text-sm"
                rows={3}
                maxLength={10000}
              />
            </div>
          );
        })}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 text-sm disabled:opacity-50">
          {loading ? "保存中..." : "改訂を保存（承認待ちに戻ります）"}
        </button>
      </form>
    </div>
  );
}
