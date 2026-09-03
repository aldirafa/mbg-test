import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "MBG Digital Triangulasi",
  description: "Sistem Pengelolaan MBG Digital - Model Triangulasi Sekolah-Orangtua-SPPG",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
