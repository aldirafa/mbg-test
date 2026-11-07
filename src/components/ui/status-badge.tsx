"use client";

import { Badge, type BadgeProps } from "@fluentui/react-components";
import {
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  VehicleTruckProfileRegular,
  ClockRegular,
} from "@fluentui/react-icons";

const MAP: Record<string, { label: string; color: BadgeProps["color"]; icon: React.ReactElement }> = {
  dikirim: { label: "Dikirim", color: "informative", icon: <VehicleTruckProfileRegular /> },
  diterima: { label: "Diterima", color: "success", icon: <CheckmarkCircleRegular /> },
  bermasalah: { label: "Bermasalah", color: "danger", icon: <ErrorCircleRegular /> },
  menunggu: { label: "Menunggu", color: "warning", icon: <ClockRegular /> },
};

// Badge status distribusi / alur (dikirim, diterima, bermasalah, ...).
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const m = MAP[status] ?? { label: status, color: "informative" as const, icon: <ClockRegular /> };
  return (
    <Badge appearance="tint" color={m.color} icon={m.icon} shape="rounded">
      {label ?? m.label}
    </Badge>
  );
}
