"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { ReactNode } from "react";

// Baris "Lihat rincian / Sembunyikan" generik pakai Headless UI Disclosure -- dipakai
// buat riwayat distribusi (SPPG & Sekolah), rincian menu Orang Tua, dan teks panduan
// expandable di checklist BGN.
export function Expandable({
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <Disclosure defaultOpen={defaultOpen} as="div" className={className}>
      <DisclosureButton className="cursor-pointer group flex w-full items-center gap-1 text-left text-xs text-neutral-500 hover:text-neutral-800">
        <ChevronDownIcon className="size-3.5 shrink-0 transition-transform group-data-open:rotate-180" />
        {summary}
      </DisclosureButton>
      <DisclosurePanel className="mt-2">{children}</DisclosurePanel>
    </Disclosure>
  );
}

export function badgeClassForStatus(status: "hijau" | "kuning" | "merah") {
  return clsx(
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
    status === "hijau" && "bg-green-100 text-green-800",
    status === "kuning" && "bg-amber-100 text-amber-800",
    status === "merah" && "bg-red-100 text-red-800",
  );
}
