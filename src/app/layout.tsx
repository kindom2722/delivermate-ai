import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeliverMate AI",
  description: "AI delivery workbench for requirements, documents, knowledge, and UAT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
