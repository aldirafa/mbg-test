"use client";

import { PhotoIcon, DocumentIcon } from "@heroicons/react/24/outline";

// Input file bergaya "dashed dropzone" -- diekstrak dari FotoInput SPPG (feedback Teh
// Lingga: bikin "Choose File" bawaan browser lebih jelas keliatan sbg tombol upload).
// Dipakai ulang di semua form upload file di app (task sweep Headless UI/Heroicons).
export function FileInput({
  file,
  onChange,
  placeholder,
  accept = "image/*",
  icon = "foto",
  disabled,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  placeholder: string;
  accept?: string;
  icon?: "foto" | "dokumen";
  disabled?: boolean;
}) {
  const Icon = icon === "dokumen" ? DocumentIcon : PhotoIcon;
  return (
    <label
      className={
        "flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3 py-2.5 text-sm text-neutral-600 transition-colors " +
        (disabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:bg-neutral-50 hover:border-neutral-400")
      }
    >
      <Icon className="size-5 text-neutral-400 shrink-0" />
      <span className="truncate">{file ? file.name : placeholder}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
      />
    </label>
  );
}
