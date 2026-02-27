"use client";

// This file is dynamically imported — walletConnect and its pino dependency
// are only loaded at runtime in the browser, never at build time.
import { useConnect } from "wagmi";
import { walletConnect } from "wagmi/connectors";

export default function WalletConnectInner() {
  const { connect } = useConnect();

  return (
    <button
      onClick={() =>
        connect({
          connector: walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
          }),
        })
      }
      className="border border-black px-3 py-1 text-sm"
    >
      WalletConnect
    </button>
  );
}
