"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, ExternalLink, Zap, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BillingStatus {
  plan: "FREE" | "CREATOR" | "AXIS";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  capabilities: string[];
  entitlementSource: string;
}

const PLANS = [
  {
    key: "FREE" as const,
    name: "Free",
    nameJa: "フリー",
    price: "¥0",
    period: "",
    color: "from-gray-500 to-gray-600",
    border: "border-gray-700",
    icon: Layers,
    features: [
      "公開概念カードの閲覧",
      "テキスト分析（セッション内のみ）",
      "概念比較（セッション内のみ）",
      "層間写像の閲覧",
    ],
    limitations: [
      "分析結果は保存されません",
      "概念カードの作成不可",
      "独自辞書・写像の設計不可",
    ],
  },
  {
    key: "CREATOR" as const,
    name: "Creator",
    nameJa: "クリエイター",
    price: "¥980",
    period: "/月",
    color: "from-violet-600 to-purple-600",
    border: "border-violet-500",
    icon: Zap,
    recommended: true,
    features: [
      "プライベート概念の作成・編集",
      "分析Runの永続保存・履歴閲覧",
      "概念パックの作成・バージョン管理",
      "比較結果のエクスポート",
      "Freeの全機能",
    ],
  },
  {
    key: "AXIS" as const,
    name: "Axis",
    nameJa: "アクシス",
    price: "¥2,980",
    period: "/月",
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500",
    icon: Layers,
    features: [
      "ユーザー辞書の追加・編集",
      "写像ルールの設計・定義",
      "レイヤー定義の書き換え",
      "独自の評価軸を持つ",
      "Creatorの全機能",
    ],
  },
];

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login?next=/billing");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => {});
  }, [router]);

  async function handleUpgrade(plan: "creator" | "axis") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "エラーが発生しました");
        setLoading(null);
      }
    } catch {
      setError("通信エラーが発生しました");
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "エラーが発生しました");
        setPortalLoading(false);
      }
    } catch {
      setError("通信エラーが発生しました");
      setPortalLoading(false);
    }
  }

  const currentPlan = status?.plan ?? "FREE";
  const isPaid = currentPlan !== "FREE";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-2">Billing</p>
          <h1 className="text-3xl font-bold mb-3">プランと課金</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            あなたの思考の深さに合わせてプランを選択してください。いつでもアップグレード・ダウングレードできます。
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-lg flex items-center gap-2 text-red-300 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Current Plan Status */}
        {status && (
          <div className="mb-8 p-5 bg-gray-900 border border-gray-700 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">現在のプラン</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">
                    {PLANS.find((p) => p.key === currentPlan)?.nameJa ?? currentPlan}
                  </span>
                  {status.status === "active" && (
                    <span className="text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded-full">
                      有効
                    </span>
                  )}
                  {status.status === "past_due" && (
                    <span className="text-xs bg-red-900/50 text-red-400 border border-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      支払い遅延
                    </span>
                  )}
                  {status.status === "trialing" && (
                    <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-700 px-2 py-0.5 rounded-full">
                      トライアル中
                    </span>
                  )}
                </div>
                {status.currentPeriodEnd && (
                  <p className="text-xs text-gray-500 mt-1">
                    {status.cancelAtPeriodEnd ? "キャンセル予定日：" : "次回更新日："}
                    {new Date(status.currentPeriodEnd).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </div>
              {isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {portalLoading ? "移動中..." : "支払い管理・キャンセル"}
                </Button>
              )}
            </div>

            {/* Capabilities */}
            {status.capabilities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2">有効な機能</p>
                <div className="flex flex-wrap gap-2">
                  {status.capabilities.map((cap) => (
                    <span key={cap} className="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded font-mono">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isUpgrade =
              (currentPlan === "FREE" && (plan.key === "CREATOR" || plan.key === "AXIS")) ||
              (currentPlan === "CREATOR" && plan.key === "AXIS");
            const planKeyLower = plan.key.toLowerCase() as "free" | "creator" | "axis";

            return (
              <div
                key={plan.key}
                className={`relative rounded-xl border p-6 flex flex-col transition-all ${
                  plan.border
                } ${
                  isCurrent
                    ? "bg-gray-800 ring-1 ring-violet-500/50"
                    : plan.recommended
                    ? "bg-gray-800/60"
                    : "bg-gray-900/60"
                }`}
              >
                {plan.recommended && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                      おすすめ
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-700 text-gray-200 border border-gray-600">
                      現在のプラン
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className={`text-xs font-semibold uppercase tracking-widest bg-gradient-to-r ${plan.color} bg-clip-text text-transparent mb-1`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {"limitations" in plan && plan.limitations?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                      <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gray-600 mt-0.5">–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gray-700 text-gray-400 cursor-default"
                  >
                    現在のプラン
                  </button>
                ) : isUpgrade && planKeyLower !== "free" ? (
                  <button
                    onClick={() => handleUpgrade(planKeyLower as "creator" | "axis")}
                    disabled={loading !== null}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r ${plan.color} text-white hover:opacity-90 disabled:opacity-50`}
                  >
                    {loading === planKeyLower ? "移動中..." : `${plan.nameJa}プランへアップグレード`}
                  </button>
                ) : currentPlan !== "FREE" && plan.key === "FREE" ? (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? "移動中..." : "ダウングレード"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* FAQ / Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">よくある質問</h2>
          <div className="space-y-4">
            {[
              {
                q: "いつでもキャンセルできますか？",
                a: "はい。「支払い管理・キャンセル」ボタンからいつでもキャンセルできます。キャンセル後も現在の課金期間終了まで機能をご利用いただけます。",
              },
              {
                q: "支払いは安全ですか？",
                a: "Stripeによる安全な決済を使用しています。カード情報はStripeが管理し、当サービスには保存されません。",
              },
              {
                q: "プランのアップグレード・ダウングレードはできますか？",
                a: "いつでも変更可能です。アップグレードは即座に反映されます。ダウングレードは次回の更新日から反映されます。",
              },
            ].map((item) => (
              <div key={item.q}>
                <p className="text-sm font-medium text-gray-200 mb-1">{item.q}</p>
                <p className="text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-600 text-center">
            Stripeによる安全な決済 · いつでもキャンセル可能 · 税込価格
          </p>
        </div>
      </div>
    </div>
  );
}
