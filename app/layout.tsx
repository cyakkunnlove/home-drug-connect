import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HOME-DRUG CONNECT - 在宅医療マッチングプラットフォーム",
    template: "%s | HOME-DRUG CONNECT",
  },
  description: "クリニックと在宅対応薬局をつなぐマッチングプラットフォーム。24時間対応可能な薬局を簡単に検索。",
  keywords: ["在宅医療", "薬局", "24時間対応", "訪問薬剤師", "在宅訪問", "薬局検索"],
  authors: [{ name: "HOME-DRUG CONNECT" }],
  creator: "HOME-DRUG CONNECT",
  publisher: "HOME-DRUG CONNECT",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "HOME-DRUG CONNECT - 在宅医療マッチングプラットフォーム",
    description: "クリニックと在宅対応薬局をつなぐマッチングプラットフォーム。",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://homedrug-connect.com",
    siteName: "HOME-DRUG CONNECT",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HOME-DRUG CONNECT",
    description: "クリニックと在宅対応薬局をつなぐマッチングプラットフォーム。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
