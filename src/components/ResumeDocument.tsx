/* eslint-disable @next/next/no-img-element -- Photos locales et QR embarqués, sans service distant. */
import type { CSSProperties, ReactNode } from "react";
import type { AppState, ResumeVariant } from "@/lib/schema";

export function webLink(input: string): string | undefined {
  const value = input.trim();
  if (!value) return undefined;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
function linkLabel(value: string) { return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, ""); }
export function dateLabel(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value.trim());
  if (!match) return value.trim();
  const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${months[Number(match[2]) - 1]} ${match[1]}`;
}
function period(start?: string, end?: string) { return [start && dateLabel(start), end && dateLabel(end)].filter(Boolean).join(" — "); }
function selected<T extends { id: string }>(items: T[], ids: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return Array.from(new Set(ids)).flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
}
function Section({ title, children, side = false }: { title: string; children: ReactNode; side?: boolean }) {
  return <section className={`resume-section${side ? " resume-section-side" : ""}`}>
    <h2 className="resume-section-heading">{title}</h2>{children}
  </section>;
}
function Bullets({ items }: { items: string[] }) {
  const lines = items.map((line) => line.trim().replace(/^[-•]\s+/, "")).filter(Boolean);
  return lines.length ? <ul className="resume-bullets">{lines.map((line, index) => <li key={index}>{line}</li>)}</ul> : null;
}
function EntryHeading({ title, subtitle, dates }: { title: string; subtitle?: string; dates?: string }) {
  return <div className="resume-entry-heading"><div><h3>{title}</h3>{subtitle && <p className="resume-entry-subtitle">{subtitle}</p>}</div>{dates && <p className="resume-date">{dates}</p>}</div>;
}
const defaultOrder: ResumeVariant["sectionOrder"] = ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "LANGUAGES", "CERTS", "HOBBIES"];

export default function ResumeDocument({ state, variantId, photoUrl, linkedinQr, linkedinUrl, assetsReady = true, assetsError = null }: {
  state: AppState; variantId: string; photoUrl?: string | null; linkedinQr?: string | null; linkedinUrl?: string;
  assetsReady?: boolean; assetsError?: string | null;
}) {
  const variant = state.resumeVariants.find((item) => item.id === variantId);
  if (!variant) return <p>Cette version du CV est introuvable.</p>;
  const p = state.profile;
  const visibility = variant.settings.visibility;
  const accent = /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(variant.settings.accentColor) ? variant.settings.accentColor : "#183a3c";
  const experiences = selected(state.experiences, variant.selectedExperienceIds);
  const projects = selected(state.projects, variant.selectedProjectIds);
  const skills = selected(state.skills, variant.selectedSkillIds);
  const domains = new Map<string, string[]>();
  for (const skill of skills) {
    if (!skill.name.trim()) continue;
    const domain = skill.domain.trim() || "Compétences";
    const names = domains.get(domain) ?? [];
    names.push(skill.name.trim() + (variant.settings.skillLevels && skill.level.trim() ? ` — ${skill.level.trim()}` : ""));
    domains.set(domain, names);
  }
  const blocks = new Map<string, ReactNode>();
  if (visibility.showSummary && p.summary.trim()) blocks.set("SUMMARY", <Section title="Profil"><p className="resume-summary">{p.summary.trim()}</p></Section>);
  if (visibility.showSkills && domains.size) blocks.set("SKILLS", <Section title="Compétences" side><dl className="resume-skill-groups">{Array.from(domains).map(([domain, names]) => <div key={domain}><dt>{domain}</dt><dd>{names.join(" · ")}</dd></div>)}</dl></Section>);
  if (experiences.length) blocks.set("EXPERIENCE", <Section title="Expériences"><div className="resume-entry-list">{experiences.map((entry) => <article key={entry.id} className="resume-entry">
    <EntryHeading title={entry.title} subtitle={[entry.company, entry.location].filter(Boolean).join(" · ")} dates={period(entry.startDate, entry.endDate)} />
    <Bullets items={entry.bullets} />
    {entry.tech.filter(Boolean).length > 0 && <p className="resume-tools">{entry.tech.filter(Boolean).join(" · ")}</p>}
  </article>)}</div></Section>);
  if (visibility.showProjects && projects.length) blocks.set("PROJECTS", <Section title="Projets"><div className="resume-entry-list">{projects.map((entry) => <article key={entry.id} className="resume-entry">
    <EntryHeading title={entry.name} subtitle={entry.role} dates={period(entry.startDate, entry.endDate)} />
    {entry.link.trim() && <p className="resume-entry-link"><a href={webLink(entry.link)} target="_blank" rel="noopener noreferrer">{linkLabel(entry.link)}</a></p>}
    <Bullets items={entry.bullets} />
    {entry.tech.filter(Boolean).length > 0 && <p className="resume-tools">{entry.tech.filter(Boolean).join(" · ")}</p>}
  </article>)}</div></Section>);
  const education = p.education.filter((entry) => entry.school.trim() || entry.degree.trim());
  if (visibility.showEducation && education.length) blocks.set("EDUCATION", <Section title="Formation" side><div className="resume-side-list">{education.slice().reverse().map((entry) => <article key={entry.id} className="resume-entry">
    <h3>{entry.school}</h3><p>{entry.degree}</p><p className="resume-muted">{[period(entry.startDate, entry.endDate), entry.city].filter(Boolean).join(" · ")}</p>
    {entry.details.trim() && <p className="resume-education-details">{entry.details}</p>}
  </article>)}</div></Section>);
  const languages = p.languages.filter((entry) => entry.name.trim());
  if (visibility.showLanguages && languages.length) blocks.set("LANGUAGES", <Section title="Langues" side><ul className="resume-plain-list">{languages.map((entry) => <li key={entry.id}><strong>{entry.name}</strong>{entry.level.trim() && <> · {entry.level}</>}</li>)}</ul></Section>);
  const certifications = p.certifications.filter((entry) => entry.name.trim());
  if (visibility.showCertifications && certifications.length) blocks.set("CERTS", <Section title="Certifications" side><div className="resume-side-list">{certifications.map((entry) => <article key={entry.id} className="resume-entry"><h3>{entry.name}</h3><p className="resume-muted">{[entry.issuer, entry.year].filter(Boolean).join(" · ")}</p></article>)}</div></Section>);
  const hobbies = state.hobbies.map((item) => item.name.trim()).filter(Boolean);
  if (visibility.showHobbies && hobbies.length) blocks.set("HOBBIES", <Section title="Centres d’intérêt" side><p>{hobbies.join(" · ")}</p></Section>);
  const order = Array.from(new Set([...variant.sectionOrder, ...defaultOrder]));
  const sideKeys = new Set(["SKILLS", "EDUCATION", "LANGUAGES", "CERTS", "HOBBIES"]);
  const side = order.filter((key) => sideKeys.has(key) && blocks.has(key));
  const main = order.filter((key) => !sideKeys.has(key) && blocks.has(key));
  const keywords = variant.atsKeywords.map((value) => value.trim()).filter(Boolean);
  const hasSidebar = side.length > 0 || (visibility.showAtsKeywords && keywords.length > 0);
  const contacts = [
    p.email.trim() && { label: p.email.trim(), href: `mailto:${p.email.trim()}` },
    p.phone.trim() && { label: p.phone.trim(), href: `tel:${p.phone.replace(/[^+\d]/g, "")}` },
    p.city.trim() && { label: p.city.trim(), href: undefined },
    p.mobility.trim() && { label: p.mobility.trim(), href: undefined },
    linkedinUrl && { label: "Profil LinkedIn", href: linkedinUrl },
    ...(visibility.showLinks ? p.links.map((link) => ({ label: linkLabel(link.trim()), href: webLink(link) })).filter((link) => link.label) : []),
  ].filter((item): item is { label: string; href: string | undefined } => Boolean(item));
  return <div id="resume-a4" className={`resume-document resume-density-${variant.settings.density}`} data-assets-ready={assetsReady} data-assets-error={assetsError ?? undefined} data-variant-id={variantId} data-resume-version={state.updatedAt}
    style={{ "--resume-accent": accent, "--resume-padding": "10mm" } as CSSProperties}>
    <header className="resume-header">
      <div className="resume-identity">
        {photoUrl && <img src={photoUrl} alt="Photo de profil" className="resume-photo" />}
        <div className="resume-name-block"><h1>{p.fullName.trim() || "Votre nom"}</h1>{p.headline.trim() && <p className="resume-headline">{p.headline.trim()}</p>}</div>
        {linkedinUrl && linkedinQr && <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="resume-qr"><img src={linkedinQr} alt="QR code du profil LinkedIn" /><span>LinkedIn</span></a>}
      </div>
      {contacts.length > 0 && <ul className="resume-contacts">{contacts.map((contact, index) => <li key={`${index}-${contact.label}`}>{contact.href ? <a href={contact.href} target="_blank" rel="noopener noreferrer">{contact.label}</a> : contact.label}</li>)}</ul>}
    </header>
    <div className={`resume-columns${hasSidebar ? "" : " resume-single-column"}`}>
      {hasSidebar && <aside className="resume-sidebar">{side.map((key) => <div key={key}>{blocks.get(key)}</div>)}{visibility.showAtsKeywords && keywords.length > 0 && <Section title="Mots-clés" side><p>{keywords.join(" · ")}</p></Section>}</aside>}
      <div className="resume-main">{main.map((key) => <div key={key}>{blocks.get(key)}</div>)}</div>
    </div>
  </div>;
}
