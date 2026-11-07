import
  {
    createDarkTheme,
    createLightTheme,
    type BrandVariants,
    type Theme,
  } from "@fluentui/react-components";

// Ramp brand hijau MBG (gizi/pangan). 10 = paling gelap, 160 = paling terang.
// Shade 80 dipakai Fluent sbg warna primary di tema terang, 100-110 di tema gelap.
export const mbgBrand: BrandVariants = {
  10: "#020805",
  20: "#0B1F14",
  30: "#0D331F",
  40: "#0D4228",
  50: "#0C5231",
  60: "#0A623A",
  70: "#077344",
  80: "#04844D",
  90: "#1F9259",
  100: "#38A067",
  110: "#50AE76",
  120: "#68BB86",
  130: "#81C898",
  140: "#9AD5AB",
  150: "#B5E2C1",
  160: "#D1EFD8",
};

// Segoe UI dipakai kalau terpasang di perangkat (Windows), Selawik (self-host, metrik
// mirip Segoe) jadi fallback resmi di macOS/Linux/Android.
export const FONT_STACK =
  [
    "'Segoe UI Variable Text'",
    "'Segoe UI Variable Display'",
    "'Segoe UI Variable Static Display'",
    "'Segoe UI Variable'",
    "'Segoe UI Variable Static Text'",
    "'Segoe UI'",
    "var(--font-selawik)",
    "'Segoe UI Web (West European)'",
    "-apple-system",
    "BlinkMacSystemFont",
    "Roboto",
    "'Helvetica Neue'",
    "sans-serif",
  ].join( ", " );

function withFont ( theme: Theme ): Theme
{
  return { ...theme, fontFamilyBase: FONT_STACK };
}

export const mbgLightTheme: Theme = withFont( createLightTheme( mbgBrand ) );

const dark = createDarkTheme( mbgBrand );
export const mbgDarkTheme: Theme = withFont( {
  ...dark,
  // Rekomendasi Fluent: di tema gelap, foreground brand pakai shade lebih terang.
  colorBrandForeground1: mbgBrand[ 110 ],
  colorBrandForeground2: mbgBrand[ 120 ],
} );
