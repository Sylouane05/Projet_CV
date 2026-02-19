"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/profile", label: "Profil" },
  { href: "/library", label: "Bibliothèque" },
  { href: "/resume", label: "CV" },
  { href: "/export", label: "Export" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-white p-4 space-y-2">
        <div className="font-semibold text-lg mb-4">CV Builder</div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm ${
                  active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
