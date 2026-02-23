"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { formatDateTime } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string | null; name: string | null };
}

interface Props { params: { id: string } }

export default function ConversationPage({ params }: Props) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages?conversationId=${params.id}`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages ?? []);
    }
  }, [params.id]);

  useEffect(() => { if (session) load(); }, [session, load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: params.id, body }),
    });
    if (res.ok) {
      setBody("");
      await load();
    } else {
      const d = await res.json();
      setError(d.error);
    }
    setSending(false);
  };

  if (!session) return <div className="max-w-2xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <h1 className="text-lg font-bold mb-4">会話</h1>
      <div className="flex-1 overflow-y-auto divide-y border mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`px-3 py-2 ${m.senderId === session.user?.id ? "text-right" : ""}`}>
            <p className="text-xs text-gray-400 mb-0.5">{m.sender.displayName ?? m.sender.name}</p>
            <p className="text-sm inline-block border px-2 py-1 max-w-xs text-left">{m.body}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(m.createdAt)}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 border border-black px-2 py-1 text-sm"
          placeholder="メッセージを入力..."
          maxLength={10000}
        />
        <button type="submit" disabled={sending} className="bg-black text-white px-3 py-1 text-sm disabled:opacity-50">
          送信
        </button>
      </form>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
