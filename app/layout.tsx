import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAB DIG — 弾きたい曲を、無料のTABで。",
  description: "曲名からYouTube・Songsterr・Ultimate Guitarの無料公開TABをまとめて検索。弾きたい曲の譜面と動画へのURLが見つかります。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
