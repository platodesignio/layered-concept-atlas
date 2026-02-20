"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface FeedbackButtonProps {
  runId?: string;
}

export function FeedbackButton({ runId }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (rating === 0) {
      toast("評価を選択してください", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, rating, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        toast("フィードバックを送信しました", "success");
        setOpen(false);
        setRating(0);
        setComment("");
      } else {
        const err = await res.json();
        toast(err.error ?? "送信に失敗しました", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-20",
          "flex items-center gap-2 rounded-full px-4 py-2",
          "bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-colors",
          "text-sm font-medium"
        )}
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">フィードバック</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="フィードバックを送信">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">評価</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={cn(
                    "w-10 h-10 rounded-full text-sm font-bold transition-colors",
                    rating >= n
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="コメント（任意）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ご意見・ご感想をお聞かせください"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button onClick={submit} loading={loading}>送信</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
