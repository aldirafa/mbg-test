"use client";

import { Caption1, Checkbox } from "@fluentui/react-components";

// Checkbox Fluent dengan label + deskripsi opsional.
export function LabeledCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Checkbox
      className={className}
      checked={checked}
      onChange={(_, d) => onChange(d.checked === true)}
      disabled={disabled}
      label={
        description ? (
          <span className="flex flex-col">
            <span>{label}</span>
            <Caption1 className="text-fg3">{description}</Caption1>
          </span>
        ) : (
          label
        )
      }
    />
  );
}
