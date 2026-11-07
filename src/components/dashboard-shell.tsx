"use client";

import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import {
  Avatar,
  Body1,
  Caption1,
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Title2,
  ToolbarButton,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { SignOutRegular } from "@fluentui/react-icons";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const ROLE_LABEL: Record<string, string> = {
  sppg: "SPPG",
  sekolah: "Sekolah",
  orangtua: "Orang Tua",
  dinas: "Dinas",
  admin: "Admin",
};

const useStyles = makeStyles({
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
  },
  hero: {
    backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackgroundPressed} 100%)`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  heroSub: { color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85 },
});

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const s = useStyles();
  const name = session?.user?.name ?? "";
  const role = session?.user?.role as string | undefined;

  return (
    <div className="min-h-full flex flex-col">
      <header className={s.topbar}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark size={28} />
            <div className="flex min-w-0 flex-col leading-tight">
              <Body1 className="block! truncate font-semibold">MBG Digital</Body1>
              <Caption1 className="block! hidden truncate text-fg3 sm:block">Triangulasi Sekolah · Orang Tua · SPPG</Caption1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {name && (
              <Menu positioning="below-end">
                <MenuTrigger disableButtonEnhancement>
                  <ToolbarButton
                    appearance="subtle"
                    aria-label={`Akun ${name}`}
                    icon={<Avatar name={name} size={28} color="colorful" />}
                  >
                    <span className="hidden max-w-[16ch] truncate md:inline">{name}</span>
                  </ToolbarButton>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuGroup>
                      <MenuGroupHeader>
                        {name}
                        {role && ROLE_LABEL[role] ? ` · ${ROLE_LABEL[role]}` : ""}
                      </MenuGroupHeader>
                    </MenuGroup>
                    <MenuDivider />
                    <MenuItem icon={<SignOutRegular />} onClick={() => signOut({ callbackUrl: "/login" })}>
                      Keluar
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            )}
          </div>
        </div>
      </header>

      <div className={s.hero}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-8 pb-20 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0 mbg-rise">
            <Title2 as="h1" className="block!">
              {title}
            </Title2>
            {subtitle && <Body1 className={`${s.heroSub} mt-1 block`}>{subtitle}</Body1>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      <main className="relative -mt-14 flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">{children}</div>
        </div>
      </main>
    </div>
  );
}
