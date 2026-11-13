"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import DialogProvider from "./DialogProvider";
import AppShell from "./AppShell";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const init = useAppStore((state) => state.init);
  useEffect(() => { init(); }, [init]);
  return <DialogProvider><AppShell>{children}</AppShell></DialogProvider>;
}
