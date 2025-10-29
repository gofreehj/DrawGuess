import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/animations.css";
import { initializeApp } from "../lib/startup";
import Providers from "@/components/Providers";

// 在服务器端初始化应用（仅客户端相关的初始化）
if (typeof window === 'undefined') {
  initializeApp();
}

export const metadata: Metadata = {
  title: "I Draw, You Guess! - AI Drawing Game",
  description: "Draw animals and let AI guess what you've drawn. A fun interactive game powered by artificial intelligence.",
  keywords: "drawing game, AI, artificial intelligence, drawing recognition, interactive game",
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile for better drawing experience
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="I Draw, You Guess!" />
      </head>
      <body className="antialiased font-sans touch-manipulation">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
