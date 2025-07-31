import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/mobile-enhancements.css";
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
    default: "在宅薬局ナビ - 医師と薬局をつなぐマッチングサービス",
    template: "%s | 在宅薬局ナビ",
  },
  description: "クリニックと在宅対応薬局をつなぐマッチングプラットフォーム。24時間対応可能な薬局を簡単に検索。",
  keywords: ["在宅医療", "薬局", "24時間対応", "訪問薬剤師", "在宅訪問", "薬局検索"],
  authors: [{ name: "在宅薬局ナビ" }],
  creator: "在宅薬局ナビ",
  publisher: "在宅薬局ナビ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "在宅薬局ナビ - 医師と薬局をつなぐマッチングサービス",
    description: "クリニックと在宅対応薬局をつなぐマッチングプラットフォーム。",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://zaitaku-yakkyoku-navi.com",
    siteName: "在宅薬局ナビ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "在宅薬局ナビ",
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="在宅薬局ナビ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ios-scroll`}
      >
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              maxWidth: '90vw',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
