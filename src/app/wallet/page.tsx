"use client";

import { useSession } from "next-auth/react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { createSiweMessage } from "viem/siwe";
import { useState } from "react";

export default function WalletPage() {
  const { data: session } = useSession();
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const signAndVerify = async () => {
    if (!address) return;
    setStatus("ノンス取得中...");
    setError("");

    const nonceRes = await fetch("/api/siwe/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "wallet_connect" }),
    });
    if (!nonceRes.ok) { setError("ノンス取得失敗"); setStatus(""); return; }
    const { nonce } = await nonceRes.json();

    const domain = window.location.hostname;
    const message = createSiweMessage({
      domain,
      address,
      statement: `Plato Network へのウォレット接続を証明します。Purpose: wallet_connect`,
      uri: window.location.origin,
      version: "1",
      chainId: 8453,
      nonce,
      issuedAt: new Date(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000),
    });

    setStatus("署名待ち...");
    let signature: string;
    try {
      signature = await signMessageAsync({ message });
    } catch {
      setStatus("");
      setError("署名がキャンセルされました");
      return;
    }

    setStatus("検証中...");
    const verRes = await fetch("/api/siwe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    if (!verRes.ok) {
      const d = await verRes.json();
      setError(d.error);
    } else {
      setStatus("ウォレット接続完了");
    }
  };

  // walletConnect is imported lazily inside the click handler so that
  // pino / @walletconnect/* are NEVER part of the build-time bundle.
  const handleWalletConnect = async () => {
    const mod = await import("wagmi/connectors");
    connect({
      connector: mod.walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
      }),
    });
  };

  if (!session) return <div className="max-w-xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">ウォレット接続</h1>
      <p className="text-sm mb-4">
        ウォレット接続は投票・オンチェーン支援・支援証明バッジ発行・プロジェクト受領アドレス登録に必要です。
        署名はアドレス所有証明のみであり、トランザクション送信は行いません。
      </p>

      {isConnected ? (
        <div className="border border-black p-4 mb-4">
          <p className="text-sm">接続中: <span className="font-mono">{address}</span></p>
          <p className="text-sm">チェーン: {chain?.name} ({chain?.id})</p>
          {chain?.id !== 8453 && (
            <p className="text-sm text-red-600 mt-1">Base mainnet (chainId=8453) に切り替えてください。</p>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={signAndVerify} className="bg-black text-white px-3 py-1 text-sm">
              SIWE 署名してアカウントに紐付け
            </button>
            <button onClick={() => disconnect()} className="border border-black px-3 py-1 text-sm">
              切断
            </button>
          </div>
          {status && <p className="text-sm mt-2">{status}</p>}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => connect({ connector: injected() })}
            className="border border-black px-3 py-1 text-sm"
          >
            MetaMask / ブラウザウォレット
          </button>
          <button
            onClick={handleWalletConnect}
            className="border border-black px-3 py-1 text-sm"
          >
            WalletConnect
          </button>
        </div>
      )}

      <div className="border-t pt-4 mt-4">
        <h2 className="font-bold mb-2 text-sm">注意事項</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>署名はメッセージ署名のみ。ETH の送金は行いません。</li>
          <li>対応チェーン: Base mainnet (chainId=8453)</li>
          <li>署名メッセージにはノンス・ドメイン・発行時刻・期限・目的が含まれます。</li>
          <li>オンチェーン寄付を行う場合は、プロジェクトの受領アドレスへ直接 ETH を送金し、tx hash をアプリに記録してください。</li>
        </ul>
      </div>
    </div>
  );
}
