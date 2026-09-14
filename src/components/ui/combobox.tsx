"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

// Combobox creatable: user boleh pilih dari daftar opsi ATAU ngetik nama bebas (dipakai
// buat nama item menu -- lihat src/lib/menu-item-opsi.ts). Value selalu string bebas;
// daftar opsi cuma bantuan cepat, bukan validasi/pembatasan.
export function CreatableCombobox({
  value,
  onChange,
  options,
  placeholder = "Ketik atau pilih...",
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered =
    query === ""
      ? options
      : options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  const queryTrim = query.trim();
  const showCreate = queryTrim !== "" && !options.some((o) => o.toLowerCase() === queryTrim.toLowerCase());

  return (
    <Combobox
      value={value}
      onChange={(v: string | null) => {
        if (v != null) onChange(v);
      }}
      disabled={disabled}
    >
      <div className={clsx("relative", className)}>
        <ComboboxInput
          className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-3 pr-10 text-sm disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-900"
          displayValue={(v: string) => v}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
        />
        <ComboboxButton className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon className="size-4 text-neutral-400" />
        </ComboboxButton>
        <ComboboxOptions
          transition
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg border border-neutral-200 focus:outline-none empty:hidden"
        >
          {filtered.map((opt) => (
            <ComboboxOption
              key={opt}
              value={opt}
              className="cursor-pointer group flex items-center gap-2 px-3 py-2 data-focus:bg-neutral-100"
            >
              <CheckIcon className="size-4 shrink-0 invisible group-data-selected:visible" />
              <span>{opt}</span>
            </ComboboxOption>
          ))}
          {showCreate && (
            <ComboboxOption
              value={queryTrim}
              className="cursor-pointer px-3 py-2 text-neutral-500 italic data-focus:bg-neutral-100"
            >
              Pakai &ldquo;{queryTrim}&rdquo;
            </ComboboxOption>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
