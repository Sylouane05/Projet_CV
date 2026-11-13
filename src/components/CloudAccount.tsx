"use client";
import { useState } from "react";
import { ChevronDown, Cloud, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDialog, type DialogOptions } from "./DialogProvider";
import { signOut } from "firebase/auth";
import { firebaseServices } from "@/lib/firebase";
import { exportBundle, importBundle, loadLocalRecord } from "@/lib/storage";
import { getStorageScope } from "@/lib/db";
import { cloudSync } from "@/lib/cloud-sync";
import { syncErrorMessage } from "@/lib/sync-engine";
import { useAppStore } from "@/store/app-store";

function message(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "auth/unauthorized-domain") return "Ajoute ce domaine dans les domaines autorisés de Firebase Authentication.";
  if (code === "auth/operation-not-allowed") return "Active la connexion Google dans Firebase Authentication.";
  if (code === "auth/popup-closed-by-user") return "Connexion annulée.";
  return syncErrorMessage(error);
}
export default function CloudAccount() {
  const router = useRouter();
  const { account, state, loading, syncPhase, syncMessage, saveError } = useAppStore();
  const { confirm } = useDialog();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const working = busy || loading || syncPhase === "saving";
  const labels = {
    loading: "Chargement du CV…", local: account ? "Prêt à sauvegarder en ligne" : "Enregistré dans ce navigateur",
    pending: "Modifications à enregistrer…", saving: "Enregistrement…", saved: "Sauvegardé en ligne",
    error: "Sauvegarde en ligne indisponible", conflict: "Deux versions du CV à départager",
  };
  async function action(task: () => Promise<void>) {
    setBusy(true); setNotice("");
    try { await task(); } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  function confirmAction(options: DialogOptions, task: () => Promise<void>) {
    const scope = getStorageScope();
    void action(async () => {
      if (!await confirm(options)) return;
      if (scope !== getStorageScope()) throw new Error("Le compte a changé. Réessaie depuis ton compte actuel.");
      await task();
    });
  }
  return <section className="studio-cloud-account" aria-label="Compte et sauvegarde en ligne">
    <p className="studio-account-label"><Cloud size={13} aria-hidden="true" /> VOTRE ESPACE</p>
    {account ? <>
      <div className="studio-account-user"><span>{(account.email || "CV").slice(0,1).toUpperCase()}</span><div><strong>Votre compte personnel</strong><p>{account.email}</p></div></div>
      <details className="studio-account-options"><summary><Settings2 size={13} aria-hidden="true" /> Options du compte <ChevronDown size={12} aria-hidden="true" /></summary><div>
      <button disabled={working || (!state && syncPhase !== "error") || syncPhase === "conflict"} onClick={() => void action(() => cloudSync.saveNow())} className="w-full rounded border px-3 py-2 disabled:opacity-50">{syncPhase === "error" ? "Réessayer la connexion" : "Sauvegarder maintenant"}</button>
      <button disabled={working} onClick={() => {
        confirmAction({ title: "Récupérer le CV en ligne ?", description: "Les modifications locales de ce compte seront remplacées par la sauvegarde en ligne. Exporte-les d’abord si tu souhaites les conserver.", confirmLabel: "Récupérer mon CV", destructive: true }, () => cloudSync.reloadRemote());
      }} className="w-full rounded border px-3 py-2 disabled:opacity-50">Récupérer mon CV en ligne</button>
      {syncPhase === "conflict" && <button disabled={working} onClick={() => {
        confirmAction({ title: "Conserver cette version du CV ?", description: "Le CV en ligne sera remplacé par la version de cet appareil. Cette version sera ensuite retrouvée sur tes autres appareils.", confirmLabel: "Conserver cette version", destructive: true }, () => cloudSync.useLocal());
      }} className="w-full rounded border px-3 py-2 disabled:opacity-50">Conserver le CV de cet appareil</button>}
      <button disabled={working || syncPhase === "conflict"} onClick={() => {
        confirmAction({ title: "Importer ton ancien CV ?", description: "Le CV local précédent remplacera celui de ton compte, puis sera sauvegardé en ligne. Garde un export si tu souhaites conserver les deux versions.", confirmLabel: "Importer mon ancien CV", destructive: true }, async () => {
          const uid = account.uid;
          const legacy = await loadLocalRecord(null);
          if (!legacy.exists) throw new Error("Aucun ancien CV local dans ce navigateur. Tu peux importer ton fichier JSON depuis Export.");
          const bundle = await exportBundle(legacy.state, null);
          if (getStorageScope() !== uid) throw new Error("Le compte a changé. Réessaie.");
          const imported = await importBundle(bundle, uid);
          if (getStorageScope() !== uid) return;
          await useAppStore.getState().replaceState(imported);
        });
      }} className="w-full rounded border px-3 py-2 disabled:opacity-50">Importer mon ancien CV local</button>
      <button disabled={working} onClick={() => void action(async () => {
        await signOut(firebaseServices().auth);
        router.replace("/");
      })} className="underline">Se déconnecter</button>
      </div></details>
    </> : <div className="space-y-2">
      <Link href="/connexion" className="studio-account-signin">Se connecter</Link>
      <Link href="/inscription" className="studio-account-signup">Créer un compte</Link>
    </div>}
    <p className="studio-account-note">{saveError ? "La sauvegarde sur cet appareil a échoué. Exportez votre CV pour en conserver une copie." : account ? syncPhase === "error" || syncPhase === "conflict" ? "La synchronisation en ligne nécessite votre attention. Ouvrez les options du compte." : "La sauvegarde en ligne est automatique. Son état est indiqué ci-dessous." : "Connectez-vous pour retrouver vos CV sur tous vos appareils."}</p>
    <p role="status" aria-live="polite" className="studio-account-status">{notice || (saveError ? "Erreur de sauvegarde locale" : syncMessage || labels[syncPhase])}</p>
  </section>;
}
