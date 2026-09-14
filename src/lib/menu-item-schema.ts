import { z } from "zod";

// Skema 1 item makanan dalam upload menu SPPG (model item-per-item, gantiin deskripsi
// tunggal lama). Dipakai di POST & PATCH /api/sppg/menu -- item dikirim sbg JSON string
// dalam 1 field FormData ("items") krn request-nya multipart (ada file foto).
export const menuItemInputSchema = z.object({
  siklus: z.number().int().positive(),
  namaMenu: z.string().trim().min(1),
  energi: z.number().nonnegative(),
  karbohidrat: z.number().nonnegative(),
  lemak: z.number().nonnegative(),
  proteinHewani: z.number().nonnegative(),
  proteinNabati: z.number().nonnegative(),
  pakaiPanganLokal: z.boolean().default(false),
  panganLokalRincian: z.string().trim().optional().nullable(),
});

export const menuItemsInputSchema = z.array(menuItemInputSchema).min(1, "Minimal 1 item menu");

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export function parseMenuItemsField(raw: FormDataEntryValue | null): MenuItemInput[] | null {
  if (typeof raw !== "string") return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = menuItemsInputSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}
