/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-lib", "@prisma/client", "prisma", "pusher", "ably"],

  webpack(config, { isServer }) {
    if (!isServer) {
      // Use alias (stronger than fallback for ESM) to stub out Node.js-only
      // modules that leak into the client bundle via WalletConnect / MetaMask SDK.
      config.resolve.alias = {
        ...config.resolve.alias,
        // pino is pulled in by @walletconnect/logger → universal-provider → ethereum-provider
        "pino": false,
        "pino-pretty": false,
        // React Native modules pulled in by MetaMask SDK / wagmi connectors
        "@react-native-async-storage/async-storage": false,
        "react-native": false,
        "encoding": false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        encoding: false,
        "pino-pretty": false,
        pino: false,
        "@react-native-async-storage/async-storage": false,
        "react-native": false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
