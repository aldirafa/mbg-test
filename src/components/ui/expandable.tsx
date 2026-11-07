"use client";

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  type BadgeProps,
} from "@fluentui/react-components";
import type { ReactNode } from "react";

// Baris "Lihat rincian" generik pakai Fluent Accordion (animasi collapse bawaan) --
// dipakai buat riwayat distribusi, rincian menu, dan teks panduan checklist BGN.
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
    <Accordion collapsible defaultOpenItems={defaultOpen ? ["item"] : []} className={className}>
      <AccordionItem value="item">
        <AccordionHeader size="small" expandIconPosition="start" className="-mx-3">
          <span className="text-sm text-fg2">{summary}</span>
        </AccordionHeader>
        <AccordionPanel className="mx-0! pb-1">{children}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export type TrafficStatus = "hijau" | "kuning" | "merah";

const BADGE_COLOR: Record<TrafficStatus, BadgeProps["color"]> = {
  hijau: "success",
  kuning: "warning",
  merah: "danger",
};

// Badge status lampu lalu lintas (hijau/kuning/merah) berbasis Fluent Badge.
export function TrafficBadge({ status, children }: { status: TrafficStatus; children: ReactNode }) {
  return (
    <Badge appearance="tint" color={BADGE_COLOR[status]} shape="rounded">
      {children}
    </Badge>
  );
}
