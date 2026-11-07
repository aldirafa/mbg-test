"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { FluentRoot } from "@/components/fluent/providers";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FluentRoot>{children}</FluentRoot>
    </SessionProvider>
  );
}
