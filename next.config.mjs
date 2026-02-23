/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-lib", "@prisma/client", "prisma"],
  },

  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // クライアントバンドルでNode.js専用モジュールを解決しない
      config.resolve.fallback = {
        ...config.resolve.fallback,
        encoding: false,
        "pino-pretty": false,
        net: false,
        tls: false,
        fs: false,
        dns: false,
      };
    }
    if (isServer) {
      // サーバーサイドで WalletConnect / MetaMask SDK の IndexedDB 依存を無視
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(idb-keyval|keyvaluestorage-interface)$/,
        })
      );
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
