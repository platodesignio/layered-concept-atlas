/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-lib", "@prisma/client", "prisma", "pusher", "ably"],

  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // Stub out Node.js-only modules with empty modules so that
      // pino / @walletconnect/* / react-native never fail client builds.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^pino$/,
          require.resolve("./src/lib/empty-module.js"),
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^pino-pretty$/,
          require.resolve("./src/lib/empty-module.js"),
        ),
      );

      config.resolve.alias = {
        ...config.resolve.alias,
        "pino": false,
        "pino-pretty": false,
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
