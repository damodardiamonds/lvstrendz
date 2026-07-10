
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "LV's Trendz | Ethnic Wear for Women",
  description:
    "Shop the latest ethnic wear collection - Sarees, Lehenga Choli, Kurtis, Gowns & more. Free shipping on orders above $99.",
  keywords: [
    "ethnic wear",
    "sarees",
    "lehenga choli",
    "kurtis",
    "indian fashion",
    "women clothing",
  ],
  openGraph: {
    title: "LV's Trendz | Ethnic Wear for Women",
    description:
      "Shop the latest ethnic wear collection - Sarees, Lehenga Choli, Kurtis, Gowns & more.",
    url: "https://lvstrendz.com",
    siteName: "LV's Trendz",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <AnnouncementBar />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

