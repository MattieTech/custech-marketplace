import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { CampusSecuritySOS } from "@/components/layout/campus-security-sos";
import { AppStartupSplash } from "@/components/layout/app-startup-splash";
import { AiSupportChatbot } from "@/components/layout/ai-support-chatbot";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://custechmarketplace.vercel.app'),
  title: {
    default: "CUSTECH Marketplace - Buy, Sell & Connect Safely",
    template: "%s | CUSTECH Marketplace",
  },
  description: "The official trusted campus marketplace for Confluence University of Science and Technology (CUSTECH) students. Trade textbooks, gadgets, find campus accommodation, and hire peer services safely with escrow protection.",
  keywords: ["CUSTECH", "Confluence University", "Osara", "campus marketplace", "student buying and selling", "campus housing", "student services", "escrow", "Kogi state"],
  authors: [{ name: "CUSTECH Marketplace Team" }],
  creator: "CUSTECH Marketplace",
  publisher: "CUSTECH Marketplace",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://custechmarketplace.vercel.app',
    siteName: "CUSTECH Marketplace",
    title: "CUSTECH Marketplace - Buy, Sell & Connect Safely",
    description: "The trusted campus marketplace for CUSTECH Osara students. Trade safely with verified student badges and campus escrow protection.",
    images: [
      {
        url: '/og-image.png',
        width: 1024,
        height: 1024,
        alt: 'CUSTECH Marketplace Logo',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CUSTECH Marketplace - Campus Commerce & Student Services",
    description: "The secure, escrow-backed marketplace built exclusively for CUSTECH Osara campus.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CUSTECH Market',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} antialiased bg-white text-gray-900 min-h-screen flex flex-col`}>
        <PwaRegister />
        <AppStartupSplash />
        <ToastProvider>
          <Header />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <CampusSecuritySOS />
          <AiSupportChatbot />
          <PwaInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
