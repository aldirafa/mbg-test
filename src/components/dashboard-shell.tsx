"use client";

import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { Disclosure, Button } from '@headlessui/react';

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <div className="min-h-full">
      <div className="relative bg-gray-800 pb-32 dark:bg-gray-800/50">
        <Disclosure as="nav" className="bg-gray-800 dark:bg-transparent">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="border-b border-white/10">
              <div className="flex h-16 items-center justify-end px-4 sm:px-0">
                <div className="flex items-center gap-4">
                  {session?.user?.name && (
                    <span className="text-sm text-neutral-300">{session.user.name}</span>
                  )}
                  <Button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-sm text-white rounded-md border border-white/20 px-3 py-1.5 hover:bg-white/10"
                  >
                    Keluar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Disclosure>
        <header className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <div className="text-neutral-500 truncate">{subtitle}</div>}
          </div>
        </header>
      </div>

      <main className="relative -mt-32">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white px-5 py-6 shadow-sm sm:px-6 dark:bg-gray-800 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
