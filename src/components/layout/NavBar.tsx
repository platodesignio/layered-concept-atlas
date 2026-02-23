"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavBar() {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    const source = new EventSource("/api/realtime/sse");
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "unread") setUnread(data.count);
      } catch {}
    };
    return () => source.close();
  }, [session]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black bg-white h-12 flex items-center px-4 gap-4">
      <Link href="/" className="font-bold no-underline">Plato Network</Link>
      <Link href="/projects" className="no-underline text-sm">プロジェクト</Link>
      <Link href="/timeline" className="no-underline text-sm">タイムライン</Link>
      {session && (
        <>
          <Link href="/friends" className="no-underline text-sm">友達</Link>
          <Link href="/messages" className="no-underline text-sm flex items-center gap-1">
            DM
            {unread > 0 && (
              <span className="bg-black text-white text-xs rounded-full px-1">{unread}</span>
            )}
          </Link>
        </>
      )}
      <div className="ml-auto flex items-center gap-4 text-sm">
        <Link href="/search" className="no-underline">検索</Link>
        {session ? (
          <>
            <Link href="/settings" className="no-underline">{session.user?.email}</Link>
            <Link href="/billing" className="no-underline">課金</Link>
            <button onClick={() => signOut()} className="underline">ログアウト</button>
          </>
        ) : (
          <Link href="/auth/signin" className="no-underline">ログイン</Link>
        )}
      </div>
    </nav>
  );
}
