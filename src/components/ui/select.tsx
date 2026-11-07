"use client";

import { Caption1, Dropdown, Option } from "@fluentui/react-components";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

// Select berbasis Fluent Dropdown. Konsumen tetap menerima null/T (tidak pernah ""),
// API sama seperti versi Headless UI sebelumnya.
export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;
  return (
    <Dropdown
      className={className}
      style={{ minWidth: 0, width: "100%" }}
      value={selected?.label ?? ""}
      selectedOptions={selected ? [selected.value] : []}
      onOptionSelect={(_, d) => {
        if (d.optionValue) onChange(d.optionValue as T);
      }}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {options.length === 0 ? (
        <Option value="" text="" disabled>
          Tidak ada opsi
        </Option>
      ) : (
        options.map((opt) => (
          <Option key={opt.value} value={opt.value} text={opt.label}>
            {opt.description ? (
              <span className="flex flex-col">
                <span>{opt.label}</span>
                <Caption1 className="text-fg3">{opt.description}</Caption1>
              </span>
            ) : (
              opt.label
            )}
          </Option>
        ))
      )}
    </Dropdown>
  );
}
