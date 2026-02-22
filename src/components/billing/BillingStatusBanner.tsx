"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

interface BillingStatus {
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

export function BillingStatusBanner() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => {});
  }, []);

  if (!status || dismissed) return null;

  // Show banner for past_due or canceling subscriptions
  const isPastDue = status.status === "past_due";
  const isCanceling = status.cancelAtPeriodEnd && status.status === "active";

  if (!isPastDue && !isCanceling) return null;

  const endDate = status.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString("ja-JP")
    : null;

  return (
    <div className={`w-full px-4 py-2 flex items-center justify-between gap-3 text-sm ${
      isPastDue ? "bg-red-900/80 text-red-100" : "bg-amber-900/60 text-amber-100"
    }`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        {isPastDue ? (
          <span>
            お支払いに問題があります。
            <Link href="/billing" className="underline ml-1 font-semibold">お支払い方法を更新</Link>
            してサービスを継続してください。
          </span>
        ) : (
          <span>
            プランは{endDate ? `${endDate}に` : ""}キャンセル予定です。
            <Link href="/billing" className="underline ml-1 font-semibold">継続する場合はこちら</Link>
          </span>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
