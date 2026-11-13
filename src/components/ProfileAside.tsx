"use client";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import ResponsiveResumePreview from "./ResponsiveResumePreview";

export default function ProfileAside() {
  const { state, activeVariantId } = useAppStore();
  if (!state) return null;
  const profile = state.profile;
  const steps = [
    { label: "Votre identité", done: !!profile.fullName.trim() && profile.fullName !== "Ton Nom", href: "/profile#personal-info" },
    { label: "Vos coordonnées", done: !!(profile.email.trim() || profile.phone.trim()), href: "/profile#personal-info" },
    { label: "Votre présentation", done: !!profile.summary.trim(), href: "/profile#profile-summary" },
    { label: "Votre formation", done: profile.education.some((entry) => entry.school.trim() || entry.degree.trim()), href: "/profile#profile-education" },
    { label: "Vos expériences", done: state.experiences.length > 0, href: "/library?tab=experiences" },
    { label: "Vos compétences", done: state.skills.length > 0, href: "/library?tab=skills" },
  ];
  const complete = steps.filter((step) => step.done).length;
  const variant = state.resumeVariants.find((v) => v.id === activeVariantId) ?? state.resumeVariants[0];
  return <aside className="profile-aside">
    <section className="profile-preview-card">
      <div className="studio-preview-heading"><span><i /> VOTRE CV, EN DIRECT</span><Link href="/resume" aria-label="Ouvrir l’éditeur de CV"><ArrowUpRight size={17} /></Link></div>
      <div className="profile-preview-stage">{complete === 0 ? <div className="studio-mini-document" aria-label="Votre aperçu apparaîtra ici"><div className="studio-mini-heading"><div /><span>Votre nom<small>Votre prochaine étape commence ici.</small></span></div><div className="studio-mini-columns"><div><b>PARCOURS</b><i /><i /><i className="short" /><b>COMPÉTENCES</b><i /><i className="short" /></div><div><b>EXPÉRIENCES</b><i /><i /><i /><i className="short" /><b>PROJETS</b><i /><i className="short" /></div></div></div> : variant && <ResponsiveResumePreview state={state} variantId={variant.id} showStatus={false} />}</div>
      <Link className="profile-preview-link" href="/resume">Personnaliser mon CV <ArrowUpRight size={14} aria-hidden="true" /></Link>
    </section>
    <section className="profile-progress-card">
      <div className="profile-progress-top"><span className="studio-icon-box"><Sparkles size={17} aria-hidden="true" /></span><span className="studio-small-caps">PETIT À PETIT</span><strong>{complete}<span>/6</span></strong></div>
      <h2>Votre parcours prend forme.</h2>
      <p>Quelques informations pour raconter ce qui vous rend unique.</p>
      <progress value={complete} max={6} aria-label="Rubriques du profil renseignées" />
      <ul>{steps.map((step) => <li key={step.label}><Link href={step.href}><span className={`profile-step-dot ${step.done ? "is-done" : ""}`}>{step.done && <Check size={10} aria-hidden="true" />}</span>{step.label}<ArrowUpRight size={12} aria-hidden="true" /></Link></li>)}</ul>
    </section>

  </aside>;
}
