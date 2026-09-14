"use client";

import { RadioGroup, Radio, Label } from "@headlessui/react";
import clsx from "clsx";

export type RadioOption<T extends string = string> = {
  value: T;
  label: string;
};

// Grup pilihan bergaya "segmented control" pakai Headless UI RadioGroup, ganti raw
// <input type="radio"> per instruksi tim.
export function SegmentedRadioGroup<T extends string = string>({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadioGroup value={value} onChange={onChange} disabled={disabled} className={className}>
      {label && <Label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Radio
            key={opt.value}
            value={opt.value}
            className={clsx(
              "cursor-pointer rounded-md border px-3 py-1.5 text-sm select-none",
              "border-neutral-300 text-neutral-700 hover:bg-neutral-50",
              "data-checked:bg-neutral-900 data-checked:border-neutral-900 data-checked:text-white data-checked:hover:bg-neutral-900",
              "data-disabled:opacity-60 data-disabled:cursor-not-allowed",
              "focus:outline-none data-focus:ring-2 data-focus:ring-neutral-900 data-focus:ring-offset-1",
            )}
          >
            {opt.label}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
