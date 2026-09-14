import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "MBG Digital Triangulasi",
  description: "Sistem Pengelolaan MBG Digital - Model Triangulasi Sekolah-Orangtua-SPPG",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased bg-gray-100 dark:bg-gray-900">
      <body className="min-h-full flex flex-col h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
