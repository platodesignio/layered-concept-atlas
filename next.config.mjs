import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyModule = path.resolve(__dirname, "src/lib/empty-module.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-lib", "@prisma/client", "prisma", "pusher", "ably"],

  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // Replace ALL pino-related modules and @walletconnect/logger with an
      // empty stub. The regex matches pino, pino/*, pino-pretty, and
      // @walletconnect/logger (which is the only consumer of pino).
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^pino(\/.*)?$/,
          emptyModule,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^pino-pretty(\/.*)?$/,
          emptyModule,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^@walletconnect\/logger(\/.*)?$/,
          emptyModule,
        ),
      );

      config.resolve.alias = {
        ...config.resolve.alias,
        "pino": emptyModule,
        "pino-pretty": emptyModule,
        "@walletconnect/logger": emptyModule,
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
