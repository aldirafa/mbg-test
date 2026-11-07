"use client";

import { Card, CardHeader, Subtitle2, Caption1, mergeClasses, makeStyles, tokens } from "@fluentui/react-components";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingHorizontalL,
    gap: tokens.spacingVerticalM,
    "@media (min-width: 640px)": { padding: tokens.spacingHorizontalXL },
  },
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontSize: "20px",
    flexShrink: 0,
  },
});

// Kartu bagian standar: ikon + judul + deskripsi + aksi (kanan) + isi.
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
}) {
  const s = useStyles();
  return (
    <Card id={id} className={mergeClasses(s.card, "mbg-rise", className)} appearance="filled">
      {(title || action) && (
        <CardHeader
          image={icon ? <span className={s.icon}>{icon}</span> : undefined}
          header={title ? <Subtitle2 as="h2">{title}</Subtitle2> : undefined}
          description={description ? <Caption1 className="text-fg3">{description}</Caption1> : undefined}
          action={action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : undefined}
        />
      )}
      {children}
    </Card>
  );
}
