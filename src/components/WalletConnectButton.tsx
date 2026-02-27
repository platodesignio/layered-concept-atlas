"use client";

import dynamic from "next/dynamic";

// Dynamically imported so that walletConnect (and its pino/WalletConnect deps)
// are NEVER included in the initial client bundle at build time.
const WalletConnectInner = dynamic(() => import("./WalletConnectInner"), {
  ssr: false,
  loading: () => (
    <button disabled className="border border-black px-3 py-1 text-sm opacity-50">
      WalletConnect
    </button>
  ),
});

export default function WalletConnectButton() {
  return <WalletConnectInner />;
}
