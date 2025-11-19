import { AuthProvider } from "../context/AuthContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import NetworkStatus from "@/components/NetworkStatus";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAWrapper from "@/components/PWAWrapper";

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "SmartCare Connect",
  description: "A Comprehensive Healthcare Management Platform",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartCare Connect"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PWAWrapper>
          <AuthProvider>
            <NetworkStatus />
            {children}
            <PWAInstallPrompt />
            <Toaster position="bottom-center" />
          </AuthProvider>
        </PWAWrapper>
      </body>
    </html>
  );
}
