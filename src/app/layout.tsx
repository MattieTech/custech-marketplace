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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CUSTECH Marketplace - Buy. Sell. Connect. Safely.",
  description: "The trusted marketplace for the CUSTECH community to buy, sell, offer services, find accommodation, discover businesses and connect with verified members.",
  keywords: "CUSTECH, marketplace, campus, students, buy, sell, housing, services",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white text-gray-900 min-h-screen flex flex-col`}>
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
        </ToastProvider>
      </body>
    </html>
  );
}
