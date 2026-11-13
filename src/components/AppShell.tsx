"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight, Cloud, Download, Layers3, LayoutTemplate, LoaderCircle, UserRound } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import CloudAccount from "./CloudAccount";
import Brand from "./Brand";
const navigation = [
  { href: "/profile", label: "Votre profil", short: "Profil", icon: UserRound },
  { href: "/library", label: "Bibliothèque", short: "Bibliothèque", icon: Layers3 },
  { href: "/resume", label: "Composer mon CV", short: "Mon CV", icon: LayoutTemplate },
  { href: "/export", label: "Exporter", short: "Export", icon: Download },
];
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { saveError, syncPhase, account } = useAppStore();
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const [mobileAccount, setMobileAccount] = useState(false);
  if (pathname === "/" || pathname === "/connexion" || pathname === "/inscription") return <>{children}</>;
  const index = Math.max(0, navigation.findIndex((item) => pathname.startsWith(item.href)));
  const phase = saveError || syncPhase === "error" || syncPhase === "conflict" ? "error" : syncPhase;
  const status = phase === "error" ? "Vérifier la sauvegarde" : phase === "saving" || phase === "pending" ? "Enregistrement…" : phase === "loading" ? "Chargement…" : account ? "Sauvegardé en ligne" : "Enregistré sur cet appareil";
  return <div data-app-shell className="studio-shell">
    <a className="studio-skip-link" href="#main-content">Aller au contenu</a>
    <div data-app-layout className="studio-layout">
      <aside data-app-navigation className="studio-sidebar">
        <div className="studio-sidebar-brand"><Brand inverse /><button type="button" className="studio-mobile-account" aria-label="Afficher les options du compte" aria-expanded={mobileAccount} aria-controls="studio-account-panel" onClick={() => setMobileAccount(!mobileAccount)}><UserRound size={19} /></button></div>
        <p className="studio-nav-label">VOTRE ESPACE DE CRÉATION</p>
        <nav className="studio-navigation" aria-label="Navigation principale">{navigation.map((item, i) => {
          const active = index === i;
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`studio-nav-item ${active ? "is-active" : ""}`}>
            <item.icon size={18} strokeWidth={1.7} aria-hidden="true" /><span className="studio-nav-full">{item.label}</span><span className="studio-nav-short">{item.short}</span><span className="studio-nav-number">{active ? <ChevronRight size={15} /> : `0${i+1}`}</span>
          </Link>;
        })}</nav>
        <div className="studio-sidebar-note"><span className="studio-note-line" /><p>Un parcours.<br />Des possibilités<br /><em>infinies.</em></p><span>Faites la différence,<br />à votre manière.</span></div>
        <div id="studio-account-panel" className="studio-account-footer" data-mobile-open={mobileAccount}><CloudAccount /></div>
        <span className="studio-sidebar-bottom">FAIT POUR LA SUITE.</span>
      </aside>
      <div data-app-workspace className="studio-workspace">
        <header data-app-topbar className="studio-topbar">
          <div className="studio-breadcrumb"><span>Mon espace</span><ChevronRight size={13} aria-hidden="true" /><strong>{navigation[index].label}</strong></div>
          <div className="studio-topbar-actions"><span className={`studio-save-status ${phase === "error" ? "has-error" : ""}`}>{phase === "saving" || phase === "loading" ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" /> : phase === "pending" ? <Cloud size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}{status}</span>{pathname !== "/export" && <Link href="/export" className="studio-topbar-export">Exporter mon CV<ArrowUpRight size={14} aria-hidden="true" /></Link>}</div>
        </header>
        <main id="main-content" data-app-content className="studio-content">{saveError && <div role="alert" className="studio-error-banner">{saveError}</div>}{children}</main>
      </div>
    </div>
  </div>;
}
