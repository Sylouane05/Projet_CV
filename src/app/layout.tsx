"use client";

import "./globals.css";
import AppShell from "@/components/AppShell";
import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const init = useAppStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <html lang="fr">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
