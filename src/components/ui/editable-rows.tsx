"use client";

import { Button, Caption1, Input, Spinner, Text } from "@fluentui/react-components";
import { CheckmarkCircleRegular, SaveRegular } from "@fluentui/react-icons";

export type EditableColumn<K extends string> = { key: K; label: string; placeholder?: string; inputMode?: "decimal" | "text" };

// Daftar baris yang bisa diedit inline (dipakai manager profil SPPG & lokasi sekolah):
// tiap baris = nama + beberapa Input + tombol Simpan. Di mobile jadi kartu bertumpuk.
export function EditableRows<K extends string>({
  rows,
  columns,
  draft,
  onDraftChange,
  onSave,
  busyId,
  savedId,
}: {
  rows: { id: string; nama: string }[];
  columns: EditableColumn<K>[];
  draft: Record<string, Record<K, string>>;
  onDraftChange: (id: string, key: K, value: string) => void;
  onSave: (id: string) => void;
  busyId: string | null;
  savedId: string | null;
}) {
  return (
    <ul className="flex flex-col divide-y divide-stroke2">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 py-3 lg:flex-row lg:items-end">
          <Text weight="semibold" className="block! truncate lg:w-48 lg:pb-1.5">
            {r.nama}
          </Text>
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((c) => (
              <label key={c.key} className="flex flex-col gap-0.5">
                <Caption1 className="text-fg3">{c.label}</Caption1>
                <Input
                  size="small"
                  inputMode={c.inputMode}
                  placeholder={c.placeholder ?? c.label}
                  value={draft[r.id]?.[c.key] ?? ""}
                  onChange={(_, d) => onDraftChange(r.id, c.key, d.value)}
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={busyId === r.id}
              onClick={() => onSave(r.id)}
              icon={busyId === r.id ? <Spinner size="extra-tiny" /> : <SaveRegular />}
            >
              {busyId === r.id ? "Menyimpan..." : "Simpan"}
            </Button>
            {savedId === r.id && (
              <Caption1 className="inline-flex items-center gap-1 text-success">
                <CheckmarkCircleRegular /> Tersimpan
              </Caption1>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
