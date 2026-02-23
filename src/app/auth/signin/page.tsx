"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("resend", { email, redirect: false });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-2">ログイン</h1>
      <p className="text-sm text-gray-500 mb-6">メールアドレスを入力するとマジックリンクが届きます。パスワードは不要です。</p>
      {sent ? (
        <div className="border border-black p-4">
          <p className="text-sm">メールを送信しました。リンクをクリックしてログインしてください。</p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-black px-2 py-1"
            placeholder="your@email.com"
          />
          <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 disabled:opacity-50">
            {loading ? "送信中..." : "マジックリンクを送る"}
          </button>
        </form>
      )}
    </div>
  );
}
