"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Membership {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setMembership(d.user?.networkMembership ?? null))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return <div className="max-w-xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  const startCheckout = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const d = await res.json();
    if (d.url) window.location.href = d.url;
  };

  const openPortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const d = await res.json();
    if (d.url) window.location.href = d.url;
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">課金・会費</h1>
      <div className="border border-black p-4 mb-6">
        <h2 className="font-bold mb-2">ネットワーク会費</h2>
        {loading ? (
          <p className="text-sm">読み込み中...</p>
        ) : membership?.status === "active" ? (
          <div className="text-sm">
            <p>ステータス: <strong>有効</strong></p>
            <p>更新日: {new Date(membership.currentPeriodEnd).toLocaleDateString("ja-JP")}</p>
            {membership.cancelAtPeriodEnd && <p className="text-gray-500">期末解約予定</p>}
            <button onClick={openPortal} className="mt-3 border border-black px-3 py-1 text-sm">
              プランを管理する
            </button>
          </div>
        ) : (
          <div className="text-sm">
            <p>ネットワーク会費への参加でNetworkOnly コンテンツの閲覧・投票が可能になります。</p>
            <button onClick={startCheckout} className="mt-3 bg-black text-white px-3 py-1 text-sm">
              会費を支払う（Stripe）
            </button>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <p>会費はネットワーク運営費として使われます。収益分配・利回りは提供しません。</p>
      </div>
    </div>
  );
}
