"use client";

import { useAppStore } from "@/store/app-store";
import CloudAccount from "./CloudAccount";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const saveError = useAppStore((s) => s.saveError);
  const pathname = usePathname();

  const itemClass = (href: string) =>
    `block rounded px-3 py-2 ${
      pathname.startsWith(href)
        ? "bg-gray-100 font-medium"
        : "hover:bg-gray-50"
    }`;

  return (
    <div data-app-shell className="min-h-screen bg-white text-gray-900">
      <div data-app-layout className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside data-app-navigation className="border-b md:border-r md:min-h-screen p-4 md:p-6">
          <div className="text-xl font-semibold mb-6">CV Builder</div>

          <nav className="flex flex-wrap gap-2 md:block md:space-y-2">
            <Link className={itemClass("/profile")} href="/profile">
              Profil
            </Link>

            <Link className={itemClass("/library")} href="/library">
              Bibliothèque
            </Link>

            <Link className={itemClass("/resume")} href="/resume">
              CV
            </Link>

            <Link className={itemClass("/export")} href="/export">
              Export
            </Link>
          </nav>
          <CloudAccount />
        </aside>

        <main data-app-content className="min-w-0 p-4 md:p-8">{saveError && <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">{saveError}</div>}{children}</main>
      </div>
    </div>
  );
}