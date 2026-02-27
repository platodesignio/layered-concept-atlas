"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { http } from "viem";
// Import injected directly from @wagmi/core to avoid the wagmi/connectors barrel
// which re-exports walletConnect → @walletconnect/* → pino (Node.js-only).
import { injected } from "@wagmi/core";
const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [injected()],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));

  return (
    <SessionProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
