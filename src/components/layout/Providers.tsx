"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { http } from "viem";
import { injected } from "wagmi/connectors";

// @walletconnect/* is stubbed in next.config.mjs so pino never reaches
// the client bundle. injected() is safe — it has no Node.js dependencies.
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
