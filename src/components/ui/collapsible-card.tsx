"use client";

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Caption1,
  Card,
  Subtitle2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  card: { padding: `0 ${tokens.spacingHorizontalS}` },
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontSize: "18px",
    flexShrink: 0,
  },
});

// Kartu yang bisa dibuka-tutup. Isi panel baru di-mount saat dibuka, jadi komponen di
// dalamnya bisa lazy-fetch data di useEffect saat mount.
export function CollapsibleCard({
  title,
  description,
  icon,
  defaultOpen = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const s = useStyles();
  return (
    <Card className={`${s.card} mbg-rise`}>
      <Accordion collapsible defaultOpenItems={defaultOpen ? ["x"] : []}>
        <AccordionItem value="x">
          <AccordionHeader size="large" expandIconPosition="end">
            <span className="flex min-w-0 items-center gap-3 py-2">
              {icon && <span className={s.icon}>{icon}</span>}
              <span className="flex min-w-0 flex-col text-left">
                <Subtitle2>{title}</Subtitle2>
                {description && <Caption1 className="text-fg3">{description}</Caption1>}
              </span>
            </span>
          </AccordionHeader>
          <AccordionPanel className="pb-4">{children}</AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
