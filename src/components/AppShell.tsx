"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const itemClass = (href: string) =>
    `block rounded px-3 py-2 ${
      pathname.startsWith(href)
        ? "bg-gray-100 font-medium"
        : "hover:bg-gray-50"
    }`;

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-[280px_1fr]">
        <aside className="border-r min-h-screen p-6">
          <div className="text-xl font-semibold mb-6">CV Builder</div>

          <nav className="space-y-2">
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
        </aside>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}