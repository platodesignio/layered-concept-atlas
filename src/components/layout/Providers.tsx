"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { http } from "viem";
import { injected } from "wagmi/connectors";

// Only include injected() at build time.
// walletConnect (which pulls in pino via @walletconnect) is added
// dynamically at runtime to prevent it from being bundled.
const baseConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [injected()],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));
  const [wagmiConfig, setWagmiConfig] = useState(baseConfig);

  useEffect(() => {
    // Add walletConnect connector at runtime only (browser), so pino
    // and all @walletconnect/* deps are excluded from the build bundle.
    let cancelled = false;
    import("wagmi/connectors").then(({ walletConnect }) => {
      if (cancelled) return;
      const config = createConfig({
        chains: [base],
        transports: { [base.id]: http() },
        connectors: [
          injected(),
          walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "" }),
        ],
        ssr: true,
      });
      setWagmiConfig(config);
    });
    return () => { cancelled = true; };
  }, []);

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
