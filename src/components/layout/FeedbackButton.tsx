"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";

let executionId = crypto.randomUUID();
const operationHistory: string[] = [];

export function trackOperation(op: string) {
  operationHistory.push(op);
  if (operationHistory.length > 10) operationHistory.shift();
}

export function refreshExecutionId() {
  executionId = crypto.randomUUID();
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const pathname = usePathname();

  const submit = useCallback(async () => {
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executionId,
          rating,
          comment,
          pagePath: pathname,
          url: window.location.href,
          context: {
            operationHistory: [...operationHistory],
            walletConnected: false,
          },
        }),
      });
      setSent(true);
      setComment("");
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    } finally {
      setSending(false);
    }
  }, [rating, comment, pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 border border-black bg-white px-3 py-1 text-sm"
      >
        フィードバック
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-black p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">フィードバックを送る</h3>
            {sent ? (
              <p>送信しました。</p>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-sm mb-1">評価 (1〜5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className={`w-8 h-8 border ${rating === n ? "bg-black text-white" : "border-black"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm mb-1">コメント（任意）</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-black p-2 text-sm"
                    rows={4}
                    maxLength={2000}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setOpen(false)} className="px-4 py-1 border border-black text-sm">
                    キャンセル
                  </button>
                  <button
                    onClick={submit}
                    disabled={sending}
                    className="px-4 py-1 bg-black text-white text-sm disabled:opacity-50"
                  >
                    {sending ? "送信中..." : "送信"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
