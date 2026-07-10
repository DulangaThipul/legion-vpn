import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "600", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "LEGION VPN | Fast, Secure & Private",
  description: "Secure-Grade Encryption, Global Server Network, Strict No-Logs Policy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
