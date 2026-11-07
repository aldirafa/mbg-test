"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Body1, Caption1, Title2, makeStyles, tokens } from "@fluentui/react-components";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const useStyles = makeStyles({
  hero: {
    backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackgroundPressed} 100%)`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
});

// Kerangka halaman publik (tanpa login): Transparansi & Suara Anak.
export function PublicShell({
  title,
  subtitle,
  children,
  maxWidth = "max-w-5xl",
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) {
  const s = useStyles();
  return (
    <div className="flex min-h-full flex-col">
      <div className={s.hero}>
        <div className={`mx-auto flex w-full ${maxWidth} items-center justify-between px-4 py-3 sm:px-6`}>
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <div className="flex flex-col leading-tight">
              <Body1 className="font-semibold">MBG Digital</Body1>
              <Caption1 className="opacity-85">Program Makan Bergizi Gratis</Caption1>
            </div>
          </Link>
          <ThemeToggle appearance="transparent" onBrand />
        </div>
        <div className={`mx-auto w-full ${maxWidth} px-4 pt-6 pb-20 sm:px-6 mbg-rise`}>
          <Title2 as="h1" className="block!">
            {title}
          </Title2>
          {subtitle && <Body1 className="block! mt-1 opacity-90">{subtitle}</Body1>}
        </div>
      </div>
      <main className={`relative -mt-14 mx-auto w-full flex-1 ${maxWidth} px-4 pb-12 sm:px-6`}>
        <div className="flex flex-col gap-4">{children}</div>
      </main>
    </div>
  );
}
