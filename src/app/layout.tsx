
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/context/CurrencyContext";
import ChatWidget from "@/components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LV's Trendz — Women's Ethnic Wear",
  description:
    "Premium women's ethnic wear. Sarees, lehengas, suits, and more.",
  icons: {
    icon: [
      { url: '/icon.jpg', type: 'image/jpeg' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/icon.jpg',
    apple: '/apple-icon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
        <ChatWidget />
      </body>
    </html>
  );
}

