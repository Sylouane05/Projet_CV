"use client";

import Brand from "./Brand";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, Cloud, FileText, LoaderCircle } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseServices } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/auth-errors";
import { useAppStore } from "@/store/app-store";

function GoogleMark() {
  return <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-1.9 4.6-4.1 6v5h6.6c3.9-3.6 6.1-8.7 6.1-14.7Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.9-3.6-11.5-8.4H5.7v5.2A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.5 27.7a12 12 0 0 1 0-7.4v-5.2H5.7a20 20 0 0 0 0 17.8l6.8-5.2Z"/><path fill="#EA4335" d="M24 11.9c3 0 5.6 1 7.7 3l5.8-5.7A19.4 19.4 0 0 0 24 4 20.4 20.4 0 0 0 5.7 15.1l6.8 5.2c1.6-4.8 6.2-8.4 11.5-8.4Z"/></svg>;
}
export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const account = useAppStore((s) => s.account);
  const loading = useAppStore((s) => s.loading);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function connect() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseServices().auth, provider);
      router.replace("/profile");
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <main className="auth-page">
    <section className="auth-story" aria-label="CV Builder">
      <Brand inverse className="auth-studio-brand" />
      <div className="auth-story-content">
        <p className="auth-eyebrow"><span /> UN PARCOURS À METTRE EN VALEUR</p>
        <h2>{signup ? <>De belles ambitions.<br /><em>Un CV à leur hauteur.</em></> : <>Votre prochaine étape<br /><em>commence ici.</em></>}</h2>
        <p className="auth-story-description">Votre parcours, vos compétences, vos projets.<br className="hidden sm:block" /> Rassemblez-les dans un CV qui vous ressemble.</p>
        <div className="auth-document" aria-hidden="true">
          <div className="auth-document-header"><div className="auth-document-avatar">C</div><div><div className="auth-document-name" /><div className="auth-document-line" /></div><span className="auth-document-badge">VOTRE CV</span></div>
          <div className="auth-document-body"><div><span>PROFIL</span><i /><i /><i className="short" /><span>COMPÉTENCES</span><div className="auth-document-tags"><b>Créativité</b><b>Expertise</b></div></div><div><span>EXPÉRIENCES</span><i /><i /><i className="short" /><span>PROJETS</span><i /><i className="short" /></div></div>
          <div className="auth-document-footer"><span><Check size={12} /> Prêt pour la prochaine opportunité</span></div>
        </div>
      </div>
      <p className="auth-story-footer"><Cloud size={16} aria-hidden="true" /> Votre espace, accessible sur tous vos appareils.</p>
    </section>
    <section className="auth-form-panel">
      <Link href="/profile" className="auth-back"><ChevronLeft size={16} aria-hidden="true" /> Retour à mon CV</Link>
      <div className="auth-form-card">
        <p className="auth-step">{signup ? "VOTRE NOUVEL ESPACE" : "HEUREUX DE VOUS RETROUVER"}</p>
        <h1>{signup ? "Créez votre compte." : "Bienvenue chez vous."}</h1>
        <p className="auth-form-description">{signup ? "Un seul compte pour créer vos CV et retrouver votre travail, où que vous soyez." : "Connectez-vous pour retrouver vos CV et continuer là où vous en étiez."}</p>
        {account ? <div className="auth-connected"><span className="auth-connected-icon"><Check size={20} /></span><div><strong>Vous êtes déjà connecté</strong><p>{account.email}</p></div></div> : null}
        {error && <div role="alert" className="auth-error">{error}</div>}
        {account ? <Link href="/profile" className="auth-submit">Accéder à mon CV <ArrowRight size={18} aria-hidden="true" /></Link> : <button type="button" disabled={busy || loading} onClick={() => void connect()} className="auth-google">{busy || loading ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <GoogleMark />}<span>{busy ? "Connexion en cours…" : signup ? "Créer mon compte avec Google" : "Continuer avec Google"}</span>{!busy && <ArrowRight size={17} aria-hidden="true" />}</button>}
        <p className="auth-provider-note">{signup ? "Lors de votre première connexion, votre compte est créé avec Google. Aucun nouveau mot de passe à retenir." : "Utilisez le compte Google avec lequel vous avez enregistré vos CV."}</p>
        <div className="auth-switch"><span>{signup ? "Vous avez déjà un compte ?" : "Vous découvrez CV Builder ?"}</span><Link href={signup ? "/connexion" : "/inscription"}>{signup ? "Se connecter" : "Créer un compte"} <ArrowRight size={14} aria-hidden="true" /></Link></div>
        <div className="auth-local-note"><span className="auth-local-icon"><FileText size={18} aria-hidden="true" /></span><p>Vous préférez commencer simplement ?<br /><Link href="/profile">Continuer sans compte</Link><span> — votre CV restera sur cet appareil.</span></p></div>
      </div>
      <p className="auth-form-footer">Votre CV local n’est pas transféré automatiquement à la connexion.</p>
    </section>
  </main>;
}
