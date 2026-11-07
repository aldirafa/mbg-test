"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  Body1,
  Button,
  Caption1,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  EyeOffRegular,
  EyeRegular,
  LockClosedRegular,
  MailRegular,
} from "@fluentui/react-icons";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const ROLE_HOME: Record<string, string> = {
  sppg: "/sppg",
  sekolah: "/sekolah",
  orangtua: "/orangtua",
  dinas: "/dinas",
  admin: "/dinas",
};

const useStyles = makeStyles({
  aside: {
    backgroundImage: `linear-gradient(160deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackgroundPressed} 100%)`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  card: { padding: tokens.spacingHorizontalXXL, gap: tokens.spacingVerticalL, width: "100%", maxWidth: "420px" },
});

export default function LoginPage() {
  const router = useRouter();
  const s = useStyles();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    router.push((role && ROLE_HOME[role]) || "/");
    router.refresh();
  }

  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-[1fr_1.1fr]">
      <aside className={`${s.aside} hidden flex-col justify-between p-10 lg:flex`}>
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <Body1 className="font-semibold">MBG Digital</Body1>
        </div>
        <div className="flex max-w-md flex-col gap-3 mbg-rise">
          <Title2 as="p">Satu sumber data untuk Makan Bergizi Gratis.</Title2>
          <Body1 className="opacity-90">
            SPPG, Sekolah, Orang Tua, dan Dinas memverifikasi setiap distribusi secara silang, jadi masalah
            terdeteksi lebih cepat.
          </Body1>
        </div>
        <Caption1 className="opacity-80">Pilot SMAN 1 Garut</Caption1>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/">
            <Button appearance="subtle" icon={<ArrowLeftRegular />}>
              Beranda
            </Button>
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-12 sm:items-center sm:px-6 sm:pt-0">
          <Card className={`${s.card} mbg-rise`}>
            <div className="flex flex-col gap-1">
              <div className="mb-2 lg:hidden">
                <BrandMark size={40} />
              </div>
              <Title2 as="h1">Masuk</Title2>
              <Body1 className="text-fg3">Masuk sesuai peran Anda: SPPG, Sekolah, Orang Tua, atau Dinas.</Body1>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate={false}>
              <Field label="Email" required>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  autoComplete="email"
                  onChange={(_, d) => setEmail(d.value)}
                  placeholder="nama@mbgdigital.test"
                  contentBefore={<MailRegular />}
                  size="large"
                  required
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(_, d) => setPassword(d.value)}
                  placeholder="Masukkan password"
                  contentBefore={<LockClosedRegular />}
                  contentAfter={
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={showPw ? <EyeOffRegular /> : <EyeRegular />}
                      aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                      onClick={() => setShowPw((v) => !v)}
                    />
                  }
                  size="large"
                  required
                />
              </Field>
              {error && (
                <MessageBar layout="multiline" intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <Button
                type="submit"
                appearance="primary"
                size="large"
                disabled={loading}
                icon={loading ? <Spinner size="tiny" /> : undefined}
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
