import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyModule = path.resolve(__dirname, "src/lib/empty-module.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-lib", "@prisma/client", "prisma", "pusher", "ably"],

  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // The import chain causing the build failure is:
      //   wagmi/connectors → @wagmi/connectors/walletConnect
      //   → @walletconnect/ethereum-provider
      //   → @walletconnect/universal-provider
      //   → @walletconnect/logger
      //   → pino  ← Node.js only, fails in browser bundle
      //
      // Strategy: stub out the entire @walletconnect/* namespace and pino/*
      // with an empty module. This allows wagmi/connectors (and injected())
      // to be imported normally, while walletConnect() gracefully degrades
      // to a no-op at build time (it's only called at runtime via onClick).
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/@walletconnect\/logger\//,
          emptyModule,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/@walletconnect\/universal-provider\//,
          emptyModule,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/@walletconnect\/ethereum-provider\//,
          emptyModule,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/pino\//,
          emptyModule,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/pino-pretty\//,
          emptyModule,
        ),
      );

      config.resolve.alias = {
        ...config.resolve.alias,
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
