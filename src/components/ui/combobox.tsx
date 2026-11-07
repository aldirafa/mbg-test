"use client";

import { useState } from "react";
import { Combobox, Option } from "@fluentui/react-components";

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
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q === "" ? options : options.filter((o) => o.toLowerCase().includes(q));
  const queryTrim = query.trim();
  const showCreate = queryTrim !== "" && !options.some((o) => o.toLowerCase() === q);

  return (
    <Combobox
      freeform
      className={className}
      style={{ minWidth: 0, width: "100%" }}
      value={value}
      selectedOptions={value ? [value] : []}
      onChange={(e) => {
        setQuery(e.target.value);
        onChange(e.target.value);
      }}
      onOptionSelect={(_, d) => {
        if (d.optionValue != null) {
          onChange(d.optionValue);
          setQuery("");
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {filtered.map((opt) => (
        <Option key={opt} value={opt}>
          {opt}
        </Option>
      ))}
      {showCreate && (
        <Option key="__create" value={queryTrim} text={queryTrim}>
          Pakai &ldquo;{queryTrim}&rdquo;
        </Option>
      )}
    </Combobox>
  );
}
