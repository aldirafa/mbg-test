"use client";

import {
  Button,
  tokens,
  Menu,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
  type MenuProps,
} from "@fluentui/react-components";
import { DesktopRegular, WeatherMoonRegular, WeatherSunnyRegular } from "@fluentui/react-icons";
import { useThemeMode, type ThemeMode } from "@/components/fluent/theme-mode";

const LABEL: Record<ThemeMode, string> = { system: "Ikuti sistem", light: "Terang", dark: "Gelap" };

export function ThemeToggle({
  appearance = "subtle",
  onBrand = false,
}: {
  appearance?: "subtle" | "transparent";
  onBrand?: boolean;
}) {
  const { mode, resolved, setMode } = useThemeMode();
  const icon = mode === "system" ? <DesktopRegular /> : resolved === "dark" ? <WeatherMoonRegular /> : <WeatherSunnyRegular />;
  const onCheckedValueChange: MenuProps["onCheckedValueChange"] = (_, d) => {
    const v = d.checkedItems[0] as ThemeMode | undefined;
    if (v) setMode(v);
  };
  return (
    <Menu checkedValues={{ theme: [mode] }} onCheckedValueChange={onCheckedValueChange}>
      <Tooltip content={`Tema: ${LABEL[mode]}`} relationship="label">
        <MenuTrigger disableButtonEnhancement>
          <Button
            appearance={appearance}
            icon={icon}
            style={onBrand ? { color: tokens.colorNeutralForegroundOnBrand } : undefined}
          />
        </MenuTrigger>
      </Tooltip>
      <MenuPopover>
        <MenuList>
          <MenuItemRadio name="theme" value="system" icon={<DesktopRegular />}>
            {LABEL.system}
          </MenuItemRadio>
          <MenuItemRadio name="theme" value="light" icon={<WeatherSunnyRegular />}>
            {LABEL.light}
          </MenuItemRadio>
          <MenuItemRadio name="theme" value="dark" icon={<WeatherMoonRegular />}>
            {LABEL.dark}
          </MenuItemRadio>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
