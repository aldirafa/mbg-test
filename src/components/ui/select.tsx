"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

// Select bergaya Headless UI Listbox, ganti raw <select> per instruksi tim (maksimalkan
// Headless UI + Heroicons di semua form).
export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  disabled,
  className,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;
  return (
    <Listbox value={value ?? undefined} onChange={onChange} disabled={disabled}>
      <div className={clsx("relative", className)}>
        <ListboxButton className="cursor-pointer relative w-full rounded-md border border-neutral-300 bg-white py-2 pl-3 pr-10 text-left text-sm disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-900">
          <span className={clsx("block truncate", !selected && "text-neutral-400")}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="size-4 text-neutral-400" />
          </span>
        </ListboxButton>
        <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg border border-neutral-200 focus:outline-none">
          {options.length === 0 && (
            <div className="px-3 py-2 text-neutral-400 italic">Tidak ada opsi</div>
          )}
          {options.map((opt) => (
            <ListboxOption
              key={opt.value}
              value={opt.value}
              className="cursor-pointer group flex items-center gap-2 px-3 py-2 data-focus:bg-neutral-100"
            >
              <CheckIcon className="size-4 shrink-0 invisible group-data-selected:visible" />
              <span className="flex flex-col">
                <span className="group-data-selected:font-medium">{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-neutral-500">{opt.description}</span>
                )}
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
