import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, Download, FolderHeart, LayoutTemplate, ShieldCheck } from "lucide-react";
import Brand from "@/components/Brand";

export default function Home() {
  return <div className="home-page">
    <a href="#home-content" className="home-skip-link">Aller au contenu</a>
    <header className="home-header">
      <Brand />
      <nav aria-label="Navigation de l’accueil"><a className="home-how-link" href="#comment-ca-marche">Comment ça marche</a><Link href="/connexion">Se connecter <ArrowUpRight size={15} aria-hidden="true" /></Link></nav>
    </header>
    <main id="home-content">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow"><span /> VOTRE PROCHAINE ÉTAPE COMMENCE ICI</p>
          <h1 id="home-title">Un parcours unique.<br />Un CV <em>à votre image.</em></h1>
          <p className="home-intro">Vos expériences méritent mieux qu’une page ordinaire. Rassemblez votre parcours et donnez-lui la place qu’il mérite.</p>
          <div className="home-actions"><Link href="/inscription" className="home-primary">Créer mon CV <ArrowUpRight size={19} aria-hidden="true" /></Link><Link href="/profile" className="home-secondary">Essayer sans compte <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          <div className="home-assurances"><span><Check size={14} aria-hidden="true" /> À votre rythme</span><span><Check size={14} aria-hidden="true" /> Export PDF</span><span><Check size={14} aria-hidden="true" /> Vos données, votre espace</span></div>
        </div>
        <div className="home-visual" aria-label="Illustration d’un CV personnalisable">
          <span className="home-visual-orbit home-orbit-one" /><span className="home-visual-orbit home-orbit-two" />
          <div className="home-paper" aria-hidden="true">
            <div className="home-paper-head"><div className="home-paper-avatar">V.</div><div><strong>Votre nom</strong><p>Le prochain chapitre de votre parcours</p><div className="home-paper-contact"><i /><i /><i /></div></div></div>
            <div className="home-paper-body"><aside><span>COMPÉTENCES</span><b>Créativité</b><b>Expertise</b><b>Esprit d’équipe</b><span>FORMATION</span><i /><i className="short" /><i /><span>LANGUES</span><i /><i className="short" /></aside><div className="home-paper-main">{["PROFIL", "EXPÉRIENCES", "PROJETS"].map((title) => <div key={title}><span>{title}</span><i /><i /><i className="short" />{title === "EXPÉRIENCES" && <><i /><i className="short" /></>}</div>)}</div></div>
            <div className="home-paper-foot">VOTRE PARCOURS, EN MIEUX.</div>
          </div>
          <div className="home-floating-note"><span><Check size={19} aria-hidden="true" /></span><div><strong>Prêt pour la suite.</strong><p>Un CV clair. Une nouvelle perspective.</p></div></div>
          <span className="home-visual-caption">PENSÉ POUR VOTRE PROCHAINE OPPORTUNITÉ</span>
        </div>
      </section>
      <div className="home-section-divider"><span>UN PEU D’ORDRE. BEAUCOUP DE POSSIBILITÉS.</span><a href="#comment-ca-marche" aria-label="Découvrir les étapes"><ArrowDown size={18} aria-hidden="true" /></a></div>
      <section className="home-steps" id="comment-ca-marche" aria-labelledby="home-steps-title">
        <div className="home-section-heading"><p className="home-eyebrow">LE PARCOURS EST SIMPLE</p><h2 id="home-steps-title">De vos idées<br />à votre prochain départ.</h2><p>Un espace pour construire, une bibliothèque pour tout retrouver, un document pour vous présenter.</p></div>
        <div className="home-step-grid">{[
          { icon: FolderHeart, number: "01", title: "Rassemblez votre parcours", description: "Expériences, projets, compétences : gardez vos meilleurs atouts à portée de main." },
          { icon: LayoutTemplate, number: "02", title: "Composez votre CV", description: "Choisissez les éléments qui comptent et personnalisez votre présentation avec un aperçu en direct." },
          { icon: Download, number: "03", title: "Faites le prochain pas", description: "Exportez votre CV en PDF et préparez votre prochaine candidature." },
        ].map((step) => <article key={step.number} className="home-step"><div><step.icon size={24} strokeWidth={1.5} aria-hidden="true" /><span>{step.number}</span></div><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      </section>
      <section className="home-bottom-cta"><div><ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" /><p>Votre histoire vous appartient.<br /><strong>Donnez-lui une belle présentation.</strong></p></div><Link href="/inscription" className="home-primary">Je crée mon CV <ArrowUpRight size={19} aria-hidden="true" /></Link></section>
    </main>
    <footer className="home-footer"><span>CV Builder. Fait pour la suite.</span><Link href="/profile">Accéder à mon espace <ArrowUpRight size={14} aria-hidden="true" /></Link></footer>
  </div>;
}
