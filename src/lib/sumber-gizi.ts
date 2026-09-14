// Tag "item ini sumber apa" per item menu -- single-select, diisi manual sama SPPG
// (GANTIIN sistem highlight otomatis berdasarkan nama menu yang sempat ada). Harus
// selaras sama enum SumberGizi di prisma/schema.prisma.
export type SumberGizi = "karbohidrat" | "energi" | "lemak" | "protein";

export const SUMBER_GIZI_OPSI: { value: SumberGizi; label: string }[] = [
  { value: "karbohidrat", label: "Karbohidrat" },
  { value: "energi", label: "Energi" },
  { value: "lemak", label: "Lemak" },
  { value: "protein", label: "Protein" },
];

export const LABEL_SUMBER_GIZI: Record<SumberGizi, string> = {
  karbohidrat: "Karbohidrat",
  energi: "Energi",
  lemak: "Lemak",
  protein: "Protein",
};
