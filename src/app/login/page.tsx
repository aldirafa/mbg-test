// Halaman login untuk semua peran (SPPG, Sekolah, Orangtua, Dinas/Admin).
// TODO: hubungkan form ke `signIn("credentials", ...)` dari @/auth setelah
// DATABASE_URL & seed user tersedia (lihat README).
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Masuk - MBG Digital</h1>
        <p className="text-sm text-neutral-500">
          Form login (email &amp; password) menyusul setelah database & auth
          terhubung.
        </p>
      </div>
    </main>
  );
}
