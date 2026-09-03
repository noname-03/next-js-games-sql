import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL Quest",
  description: "Game pembelajaran SQL — belajar PostgreSQL lewat level interaktif.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
