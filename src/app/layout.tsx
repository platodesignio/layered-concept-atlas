import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { NavBar } from "@/components/layout/NavBar";
import { FeedbackButton } from "@/components/layout/FeedbackButton";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "Plato Network",
  description: "STPF CYCLE — 研究・理論・論文・実装が因果リンクで接続された自走型ネットワーク",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <NavBar />
          <main className="min-h-screen pt-12">
            {children}
          </main>
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  );
}
