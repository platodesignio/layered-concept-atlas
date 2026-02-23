"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface Conversation {
  id: string;
  unreadCount: number;
  participants: Array<{ userId: string; user: { id: string; displayName: string | null; name: string | null } }>;
  messages: Array<{ createdAt: string }>;
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return <div className="max-w-2xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">メッセージ</h1>
      {loading ? (
        <p className="text-sm">読み込み中...</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-gray-400">会話がありません。友達ページから DM を開始できます。</p>
      ) : (
        <div className="divide-y">
          {conversations.map((c) => {
            const other = c.participants.find((p) => p.userId !== session.user?.id)?.user;
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="block py-3 no-underline hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {other?.displayName ?? other?.name ?? "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    {c.unreadCount > 0 && (
                      <span className="bg-black text-white text-xs rounded-full px-1">{c.unreadCount}</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDateTime(c.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
