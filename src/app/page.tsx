import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">MBG Digital - Model Triangulasi</h1>
      <p className="max-w-md text-sm text-neutral-500">
        Sistem pengelolaan MBG digital dengan verifikasi silang SPPG - Sekolah -
        Orangtua. Purwarupa untuk pilot SMAN 1 Garut.
      </p>
      <div className="flex gap-4 text-sm">
        <Link className="underline" href="/login">Masuk</Link>
        <Link className="underline" href="/orangtua">Portal Orangtua</Link>
        <Link className="underline" href="/sekolah">Portal Sekolah</Link>
        <Link className="underline" href="/sppg">Portal SPPG</Link>
        <Link className="underline" href="/dinas">Dashboard Dinas</Link>
      </div>
    </main>
  );
}
