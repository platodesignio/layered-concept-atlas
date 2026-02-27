"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { http } from "viem";

// wagmi/connectors is NOT imported here at all.
// Importing it would pull @wagmi/connectors → @walletconnect → pino
// into the build bundle. Connectors are added lazily on user interaction
// in wallet/page.tsx instead.
const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [],
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
