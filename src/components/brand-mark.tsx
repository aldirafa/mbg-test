import { tokens } from "@fluentui/react-components";

// Logo MBG sederhana: piring + daun (gizi), warna mengikuti token brand.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill={tokens.colorBrandBackground} />
      <circle cx="16" cy="17" r="8.5" fill="none" stroke={tokens.colorNeutralForegroundOnBrand} strokeWidth="2" />
      <path
        d="M16 21c-2.8-1.2-4-3.4-3.4-6.6 2.9.2 4.8 1.6 5.6 4.3.5-2.4 2-4 4.5-4.6.3 3.2-1.3 5.6-4.4 6.8"
        fill={tokens.colorNeutralForegroundOnBrand}
        opacity="0.9"
      />
      <path d="M16 6v3" stroke={tokens.colorNeutralForegroundOnBrand} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
