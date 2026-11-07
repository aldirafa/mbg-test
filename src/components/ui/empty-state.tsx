"use client";

import { Body1, Caption1 } from "@fluentui/react-components";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-fluent-l border border-dashed border-stroke2 px-4 py-8 text-center">
      {icon && <span className="text-[32px] leading-none text-fg4">{icon}</span>}
      <Body1 className="font-semibold text-fg2">{title}</Body1>
      {description && <Caption1 className="max-w-md text-fg3">{description}</Caption1>}
      {action}
    </div>
  );
}
