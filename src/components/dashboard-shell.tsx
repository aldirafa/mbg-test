"use client";

import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{title}</div>
          {subtitle && <div className="text-xs text-neutral-500 truncate">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {session?.user?.name && (
            <span className="text-sm text-neutral-600 hidden sm:inline truncate max-w-[160px]">
              {session.user.name}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
          >
            Keluar
          </button>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
