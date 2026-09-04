import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import UserBadge from "@/components/UserBadge";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SQL Quest",
  description:
    "Game pembelajaran SQL yang seru — taklukkan 200 level PostgreSQL dan jadilah master database!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${baloo.variable} ${nunito.variable} antialiased`}>
        <div className="fixed right-4 top-3 z-50">
          <UserBadge />
        </div>
        {children}
      </body>
    </html>
  );
}
