"use client";

import { Checkbox, Field, Label, Description } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

// Checkbox bergaya Headless UI, ganti raw <input type="checkbox"> per instruksi tim.
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
    <Field className={clsx("flex items-start gap-2.5", className)}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          "mt-0.5 cursor-pointer group size-5 shrink-0 rounded border border-neutral-300 bg-white flex items-center justify-center",
          "data-checked:bg-neutral-900 data-checked:border-neutral-900",
          "data-disabled:opacity-60 data-disabled:cursor-not-allowed",
          "focus:outline-none data-focus:ring-2 data-focus:ring-neutral-900 data-focus:ring-offset-1",
        )}
      >
        <CheckIcon className="size-3.5 fill-white opacity-0 group-data-checked:opacity-100" />
      </Checkbox>
      <div>
        <Label className={clsx("cursor-pointer text-sm text-neutral-800", disabled && "cursor-not-allowed opacity-60")}>
          {label}
        </Label>
        {description && <Description className="text-xs text-neutral-500">{description}</Description>}
      </div>
    </Field>
  );
}
