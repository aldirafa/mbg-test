"use client";

import { Caption1, Card, Title2, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import type { ReactNode } from "react";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

const useStyles = makeStyles({
  card: { padding: tokens.spacingHorizontalL, gap: tokens.spacingVerticalXS, minWidth: 0 },
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    fontSize: "18px",
  },
  brand: { backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground1 },
  success: { backgroundColor: tokens.colorStatusSuccessBackground1, color: tokens.colorStatusSuccessForeground1 },
  warning: { backgroundColor: tokens.colorStatusWarningBackground1, color: tokens.colorStatusWarningForeground1 },
  danger: { backgroundColor: tokens.colorStatusDangerBackground1, color: tokens.colorStatusDangerForeground1 },
  neutral: { backgroundColor: tokens.colorNeutralBackground3, color: tokens.colorNeutralForeground2 },
});

// Tile KPI untuk baris ringkasan dashboard.
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const s = useStyles();
  return (
    <Card className={mergeClasses(s.card, "mbg-rise", className)}>
      <div className="flex items-start justify-between gap-2">
        <Caption1 className="text-fg3">{label}</Caption1>
        {icon && <span className={mergeClasses(s.icon, s[tone])}>{icon}</span>}
      </div>
      <Title2 as="p" className="tabular-nums">
        {value}
      </Title2>
      {hint && <Caption1 className="text-fg3">{hint}</Caption1>}
    </Card>
  );
}
