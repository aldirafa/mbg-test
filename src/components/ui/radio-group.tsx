"use client";

import { Field, Radio, RadioGroup } from "@fluentui/react-components";

export type RadioOption<T extends string = string> = {
  value: T;
  label: string;
};

// Grup pilihan tunggal berbasis Fluent RadioGroup (horizontal, wrap di layar sempit).
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
  const group = (
    <RadioGroup
      layout="horizontal"
      style={{ flexWrap: "wrap" }}
      value={value}
      onChange={(_, d) => onChange(d.value as T)}
      disabled={disabled}
      aria-label={label}
    >
      {options.map((opt) => (
        <Radio key={opt.value} value={opt.value} label={opt.label} />
      ))}
    </RadioGroup>
  );
  if (!label) return <div className={className}>{group}</div>;
  return (
    <Field label={label} className={className}>
      {group}
    </Field>
  );
}
