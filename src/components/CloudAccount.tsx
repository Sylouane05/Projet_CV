"use client";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { firebaseServices } from "@/lib/firebase";
import { exportBundle, importBundle, loadLocalRecord } from "@/lib/storage";
import { getStorageScope } from "@/lib/db";
import { cloudSync } from "@/lib/cloud-sync";
import { useAppStore } from "@/store/app-store";

function message(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "auth/unauthorized-domain") return "Ajoute ce domaine dans les domaines autorisés de Firebase Authentication.";
  if (code === "auth/operation-not-allowed") return "Active la connexion Google dans Firebase Authentication.";
  if (code === "permission-denied" || code === "storage/unauthorized") return "Accès refusé. Vérifie les règles Firebase du projet.";
  if (code === "auth/popup-closed-by-user") return "Connexion annulée.";
  return error instanceof Error ? error.message : "La connexion au service a échoué.";
}
export default function CloudAccount() {
  const { account, state, loading, syncPhase, syncMessage, saveError } = useAppStore();
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
  return <section className="mt-6 space-y-3 border-t border-gray-200 pt-4 text-sm" aria-label="Compte et sauvegarde en ligne">
    <p className="font-medium">Sauvegarde en ligne</p>
    {account ? <>
      <p className="break-all text-gray-600">{account.email}</p>
      <button disabled={working || (!state && syncPhase !== "error") || syncPhase === "conflict"} onClick={() => void action(() => cloudSync.saveNow())} className="w-full rounded border px-3 py-2 disabled:opacity-50">{syncPhase === "error" ? "Réessayer la connexion" : "Sauvegarder maintenant"}</button>
      <button disabled={working} onClick={() => {
        if (window.confirm("Récupérer le CV en ligne et remplacer les modifications locales de ce compte ? Exporte-les en JSON si tu souhaites les conserver.")) void action(() => cloudSync.reloadRemote());
      }} className="w-full rounded border px-3 py-2 disabled:opacity-50">Récupérer mon CV en ligne</button>
      {syncPhase === "conflict" && <button disabled={working} onClick={() => {
        if (window.confirm("Remplacer le CV en ligne par la version de cet appareil ?")) void action(() => cloudSync.useLocal());
      }} className="w-full rounded border px-3 py-2 disabled:opacity-50">Conserver le CV de cet appareil</button>}
      <button disabled={working || syncPhase === "conflict"} onClick={() => {
        if (!window.confirm("Importer l’ancien CV local de ce navigateur dans ton compte ? Le CV actuellement affiché sera remplacé puis sauvegardé en ligne. Garde ton fichier JSON si tu souhaites conserver les deux versions.")) return;
        void action(async () => {
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
      <button disabled={working} onClick={() => void action(() => signOut(firebaseServices().auth))} className="underline">Se déconnecter</button>
    </> : <button disabled={working} onClick={() => void action(async () => { await signInWithPopup(firebaseServices().auth, new GoogleAuthProvider()); })} className="w-full rounded border px-3 py-2 disabled:opacity-50">Se connecter avec Google</button>}
    <p className="text-xs text-gray-600">{account ? "Sauvegarde automatique après tes modifications. Le CV local est réservé à ce compte." : "Mode sans compte : le CV reste sur cet appareil. La connexion ouvre le CV de ton compte, sans transférer automatiquement le CV invité."}</p>
    <p role="status" aria-live="polite" className="text-gray-700">{notice || (saveError ? "Erreur de sauvegarde locale" : syncMessage || labels[syncPhase])}</p>
  </section>;
}
