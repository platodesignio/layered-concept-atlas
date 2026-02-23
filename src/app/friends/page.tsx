"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatDateTime } from "@/lib/utils";

interface Friend {
  id: string;
  displayName: string | null;
  name: string | null;
  email: string;
}

interface Request {
  id: string;
  message: string | null;
  createdAt: string;
  sender?: Friend;
  receiver?: Friend;
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<Request[]>([]);
  const [outgoing, setOutgoing] = useState<Request[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"friends" | "requests">("friends");

  const load = async () => {
    const [fr, req] = await Promise.all([
      fetch("/api/friends").then((r) => r.json()),
      fetch("/api/friends/requests").then((r) => r.json()),
    ]);
    setFriends(fr.friends ?? []);
    setIncoming(req.incoming ?? []);
    setOutgoing(req.outgoing ?? []);
  };

  useEffect(() => { if (session) load(); }, [session]);

  const sendRequest = async () => {
    setError("");
    const res = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, message }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setReceiverId("");
    setMessage("");
    await load();
  };

  const respondToRequest = async (id: string, action: "accept" | "decline") => {
    await fetch(`/api/friends/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  };

  if (!session) return <div className="max-w-2xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">友達</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("friends")} className={`border px-3 py-1 text-sm ${tab === "friends" ? "bg-black text-white" : "border-black"}`}>
          友達一覧 ({friends.length})
        </button>
        <button onClick={() => setTab("requests")} className={`border px-3 py-1 text-sm ${tab === "requests" ? "bg-black text-white" : "border-black"}`}>
          申請 ({incoming.length})
        </button>
      </div>

      {tab === "friends" && (
        <div>
          <div className="mb-4 flex gap-2">
            <input value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="ユーザーID" className="border border-black px-2 py-1 text-sm flex-1" />
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="メッセージ（任意）" className="border border-black px-2 py-1 text-sm flex-1" />
            <button onClick={sendRequest} className="bg-black text-white px-3 py-1 text-sm">申請</button>
          </div>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="divide-y">
            {friends.map((f) => (
              <div key={f.id} className="py-2 flex items-center justify-between">
                <span className="text-sm">{f.displayName ?? f.name ?? f.email}</span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const res = await fetch("/api/conversations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ participantId: f.id }),
                      });
                      if (res.ok) {
                        const d = await res.json();
                        window.location.href = `/messages/${d.conversation.id}`;
                      }
                    }}
                    className="text-xs border px-2 py-0.5"
                  >
                    DM
                  </button>
                  <button
                    onClick={async () => {
                      await fetch("/api/friends/blocks", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ targetUserId: f.id }),
                      });
                      await load();
                    }}
                    className="text-xs border px-2 py-0.5"
                  >
                    ブロック
                  </button>
                </div>
              </div>
            ))}
            {friends.length === 0 && <p className="text-sm text-gray-400 py-2">友達がいません。</p>}
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div>
          <h2 className="font-bold mb-2">届いた申請</h2>
          <div className="divide-y mb-4">
            {incoming.map((r) => (
              <div key={r.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-sm">{r.sender?.displayName ?? r.sender?.name ?? r.sender?.email}</span>
                  {r.message && <p className="text-xs text-gray-500">{r.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respondToRequest(r.id, "accept")} className="text-xs bg-black text-white px-2 py-0.5">承認</button>
                  <button onClick={() => respondToRequest(r.id, "decline")} className="text-xs border px-2 py-0.5">拒否</button>
                </div>
              </div>
            ))}
            {incoming.length === 0 && <p className="text-sm text-gray-400">申請なし</p>}
          </div>

          <h2 className="font-bold mb-2">送った申請</h2>
          <div className="divide-y">
            {outgoing.map((r) => (
              <div key={r.id} className="py-2 text-sm">
                {r.receiver?.displayName ?? r.receiver?.name ?? r.receiver?.email}
                {" — "}
                <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
              </div>
            ))}
            {outgoing.length === 0 && <p className="text-sm text-gray-400">送信済み申請なし</p>}
          </div>
        </div>
      )}
    </div>
  );
}
