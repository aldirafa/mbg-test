import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/session-provider";
import { THEME_INIT_SCRIPT } from "@/components/fluent/theme-script";

export const metadata: Metadata = {
  title: "MBG Digital Triangulasi",
  description: "Sistem Pengelolaan MBG Digital - Model Triangulasi Sekolah-Orangtua-SPPG",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#04844D" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
