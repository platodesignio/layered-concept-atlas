"use client";
import { useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  trigger: "concept:write" | "run:persist" | "pack:write" | "dictionary:write" | "mapping:write" | "layerdef:write";
}

const TRIGGER_COPY: Record<UpgradeModalProps["trigger"], {
  title: string;
  body: string;
  recommend: "creator" | "axis";
}> = {
  "concept:write": {
    title: "概念カードを自分の資産として所有する",
    body: "あなたが構築した概念の体系を、永続的な資産として保存できます。思考の積み重ねを失わずに蓄積し、いつでも参照・編集できます。",
    recommend: "creator",
  },
  "run:persist": {
    title: "分析結果を履歴として蓄積する",
    body: "分析のたびに結果が消えてしまいます。Creatorプランでは全ての分析Runが保存され、過去の思考プロセスをいつでも振り返れます。",
    recommend: "creator",
  },
  "pack:write": {
    title: "概念をパックとして体系化する",
    body: "関連する概念をまとめてパックとして管理し、バージョン管理・エクスポートができます。思考の体系を一つの作品として完成させましょう。",
    recommend: "creator",
  },
  "dictionary:write": {
    title: "自分の評価軸を設計する",
    body: "既存の辞書ではなく、あなた自身の語彙と重みで概念を評価できます。他の誰でもない、あなた固有の座標系を持つことができます。",
    recommend: "axis",
  },
  "mapping:write": {
    title: "写像ルールを自分で定義する",
    body: "概念がどのように別の層に変換されるかを、あなた自身が設計できます。分析エンジンをあなたの思想に合わせて調整する能力です。",
    recommend: "axis",
  },
  "layerdef:write": {
    title: "評価軸の定義を書き換える",
    body: "6つのレイヤーの説明・判定基準をあなた独自の定義で上書きできます。世界を書き換えるのではなく、あなた固有の座標系を持つことです。",
    recommend: "axis",
  },
};

const PLANS = {
  creator: {
    name: "Creator",
    nameJa: "クリエイター",
    price: "¥980/月",
    features: [
      "プライベート概念の作成・編集",
      "分析Runの永続保存",
      "概念パックの作成・バージョン管理",
      "比較結果のエクスポート",
    ],
    color: "from-violet-600 to-purple-600",
    border: "border-violet-500",
  },
  axis: {
    name: "Axis",
    nameJa: "アクシス",
    price: "¥2,980/月",
    features: [
      "Creatorの全機能",
      "ユーザー辞書の追加・編集",
      "写像ルールの設計",
      "レイヤー定義の書き換え",
    ],
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500",
  },
};

export function UpgradeModal({ open, onClose, trigger }: UpgradeModalProps) {
  const [loading, setLoading] = useState<"creator" | "axis" | null>(null);
  const copy = TRIGGER_COPY[trigger];

  if (!open) return null;

  async function handleUpgrade(plan: "creator" | "axis") {
    setLoading(plan);
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
        alert(data.error ?? "エラーが発生しました");
        setLoading(null);
      }
    } catch {
      alert("通信エラーが発生しました");
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">アップグレードが必要です</p>
              <h2 className="text-xl font-bold text-white">{copy.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed">{copy.body}</p>
        </div>

        {/* Plan cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["creator", "axis"] as const).map((planKey) => {
            const plan = PLANS[planKey];
            const isRecommended = copy.recommend === planKey;
            return (
              <div
                key={planKey}
                className={`relative rounded-xl border p-5 flex flex-col ${plan.border} ${isRecommended ? "bg-gray-800" : "bg-gray-850 border-gray-700"}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                      おすすめ
                    </span>
                  </div>
                )}
                <div className="mb-3">
                  <p className={`text-xs font-medium uppercase tracking-widest bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {plan.name}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">{plan.price}</p>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={loading !== null}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r ${plan.color} text-white hover:opacity-90 disabled:opacity-50`}
                >
                  {loading === planKey ? "移動中..." : `${plan.nameJa}プランへ`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-500">
            Stripeによる安全な決済 · いつでもキャンセル可能
          </p>
        </div>
      </div>
    </div>
  );
}
