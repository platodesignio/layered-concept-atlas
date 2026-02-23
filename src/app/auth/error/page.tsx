"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error");

  const messages: Record<string, string> = {
    Configuration: "サーバーの設定に問題があります。管理者に連絡してください。",
    AccessDenied: "アクセスが拒否されました。",
    Verification: "認証リンクが無効または期限切れです。再度お試しください。",
    Default: "認証エラーが発生しました。",
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-2">エラー</h1>
      <p className="text-sm mb-4">{messages[error ?? "Default"] ?? messages.Default}</p>
      <Link href="/auth/signin" className="no-underline border border-black px-3 py-1 text-sm">
        ログインページへ
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto px-4 py-16">読み込み中...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
