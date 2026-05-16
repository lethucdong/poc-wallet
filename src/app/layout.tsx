import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoC Wallet",
  description: "Quản lý thu chi cá nhân",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
