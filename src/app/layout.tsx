import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { FeedbackButton } from "@/components/layout/FeedbackButton";
import { BillingStatusBanner } from "@/components/billing/BillingStatusBanner";

export const metadata: Metadata = {
  title: "Layered Concept Atlas",
  description: "概念の多層構造を可視化・分析するツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <Header />
        <BillingStatusBanner />
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
