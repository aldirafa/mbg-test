"use client";

import Link from "next/link";
import {
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  LargeTitle,
  Subtitle2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  BuildingGovernmentRegular,
  ChatBubblesQuestionRegular,
  DataPieRegular,
  FoodRegular,
  PeopleCommunityRegular,
  HatGraduationRegular,
  SignOutRegular,
} from "@fluentui/react-icons";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const PORTAL = [
  { href: "/sppg", title: "Portal SPPG", desc: "Input menu harian, gizi, dan distribusi.", icon: <FoodRegular /> },
  { href: "/sekolah", title: "Portal Sekolah", desc: "Konfirmasi penerimaan dan kebutuhan khusus.", icon: <HatGraduationRegular /> },
  { href: "/orangtua", title: "Portal Orang Tua", desc: "Konfirmasi anak makan, rating, pengaduan.", icon: <PeopleCommunityRegular /> },
  { href: "/dinas", title: "Dashboard Dinas", desc: "Pantau triangulasi, flag, dan statistik.", icon: <BuildingGovernmentRegular /> },
  { href: "/suara-anak", title: "Suara Anak", desc: "Masukan langsung dari siswa.", icon: <ChatBubblesQuestionRegular /> },
  { href: "/transparansi", title: "Transparansi Publik", desc: "Ringkasan data terbuka program MBG.", icon: <DataPieRegular /> },
];

const useStyles = makeStyles({
  hero: {
    backgroundImage: `radial-gradient(1200px 400px at 10% -10%, ${tokens.colorBrandBackground2} 0%, transparent 70%)`,
  },
  card: {
    height: "100%",
    transitionProperty: "transform, box-shadow",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveDecelerateMid,
    ":hover": { transform: "translateY(-2px)", boxShadow: tokens.shadow16 },
  },
  icon: {
    display: "inline-flex",
    width: "40px",
    height: "40px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontSize: "22px",
  },
});

export default function Home() {
  const s = useStyles();
  return (
    <main className={`${s.hero} flex min-h-screen flex-col`}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <Subtitle2>MBG Digital</Subtitle2>
        </div>
        <ThemeToggle />
      </div>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-10 pb-8 sm:px-6 mbg-rise">
        <LargeTitle as="h1" className="max-w-3xl">
          Model Triangulasi MBG
        </LargeTitle>
        <Body1 className="max-w-2xl text-fg2">
          Sistem pengelolaan Makan Bergizi Gratis dengan verifikasi silang SPPG, Sekolah, dan Orang Tua.
          Purwarupa untuk pilot SMAN 1 Garut.
        </Body1>
        <div>
          <Link href="/login">
            <Button appearance="primary" size="large" icon={<SignOutRegular className="rotate-180" />}>
              Masuk
            </Button>
          </Link>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {PORTAL.map((p, i) => (
          <Link key={p.href} href={p.href} className="mbg-rise" style={{ animationDelay: `${i * 40}ms` }}>
            <Card className={s.card}>
              <CardHeader
                image={<span className={s.icon}>{p.icon}</span>}
                header={<Subtitle2>{p.title}</Subtitle2>}
                description={<Caption1 className="text-fg3">{p.desc}</Caption1>}
              />
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
