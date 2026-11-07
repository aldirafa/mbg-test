// Format angka gaya Indonesia buat pesan WA/tampilan: bilangan bulat apa adanya,
// desimal pakai koma (bukan titik) -- mis. 16.3 -> "16,3", 20 -> "20".
export function formatAngkaID(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

// Tanggal pendek gaya Indonesia, mis. "7 Nov 2026".
export function formatTanggalPendek(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
