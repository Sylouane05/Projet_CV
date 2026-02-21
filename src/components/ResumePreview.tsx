"use client";

import { useMemo } from "react";
import type { AppState } from "@/lib/schema";

function SectionTitle({ color, children }: { color: string; children: string }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
      {children}
    </div>
  );
}

function cleanBullet(b: string) {
  return b.replace(/\[à préciser:[^\]]*\]/gi, "").replace(/\s{2,}/g, " ").trim();
}

function isPlaceholderBullet(b: string) {
  const lower = b.toLowerCase();
  return lower.includes("[à préciser") || lower.includes("à préciser:");
}

function shortLinkDisplay(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export default function ResumePreview({ state, variantId }: { state: AppState; variantId: string }) {
  const variant = useMemo(
    () => state.resumeVariants.find((v) => v.id === variantId) ?? null,
    [state, variantId]
  );

  if (!variant) return <div>Variant introuvable</div>;

  const selectedExperiences = useMemo(() => {
    const ids = new Set(variant.selectedExperienceIds);
    return state.experiences.filter((e) => ids.has(e.id));
  }, [state, variant]);

  const selectedProjects = useMemo(() => {
    const ids = new Set(variant.selectedProjectIds);
    return state.projects.filter((p) => ids.has(p.id));
  }, [state, variant]);

  const selectedSkills = useMemo(() => {
    const ids = new Set(variant.selectedSkillIds ?? []);
    return (state.skills ?? []).filter((s) => ids.has(s.id));
  }, [state, variant]);

  const skillsByDomain = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of selectedSkills) {
      const dom = (s.domain || "Général").trim() || "Général";
      if (!map.has(dom)) map.set(dom, []);
      map.get(dom)!.push(s.name);
    }
    for (const [k, arr] of map.entries()) {
      map.set(
        k,
        arr
          .map((x) => x.trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      );
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [selectedSkills]);

  const p = state.profile;
  const accent = variant.settings?.accentColor ?? "#2563eb";

  const density = variant.settings?.density ?? "normal";
  const bulletsMax = density === "compact" ? 2 : density === "airy" ? 4 : 3;
  const paddingMm = density === "compact" ? 10 : density === "airy" ? 13 : 12;
  const gapMm = density === "compact" ? 4 : density === "airy" ? 6 : 5;

  const vis = variant.settings?.visibility ?? {
    showLinks: true,
    showSummary: true,
    showSkills: true,
    showAtsKeywords: true,
    showProjects: true,
    showEducation: true,
    showLanguages: true,
    showCertifications: true,
  };

  const education = (p.education ?? []).slice().reverse();
  const languages = p.languages ?? [];
  const certs = p.certifications ?? [];
  const links = p.links ?? [];

  return (
    <div
      id="resume-a4"
      className="bg-white text-black shadow"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: `${paddingMm}mm`,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-3">
        <div>
          <div className="text-2xl font-semibold leading-tight">{p.fullName}</div>
          <div className="text-sm mt-1" style={{ color: "#444" }}>
            {p.headline}
          </div>

          {vis.showLinks && links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              {links.slice(0, 4).map((l) => (
                <span key={l} style={{ color: accent }}>
                  {shortLinkDisplay(l)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right text-[11px]" style={{ color: "#555" }}>
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.city && <div>{p.city}</div>}
          {p.mobility && <div>{p.mobility}</div>}
        </div>
      </div>

      <div className="grid grid-cols-12" style={{ gap: `${gapMm}mm` }}>
        {/* Left */}
        <aside className="col-span-4 space-y-4">
          {vis.showSkills && (
            <div className="border rounded p-3">
              <SectionTitle color={accent}>Compétences</SectionTitle>

              {skillsByDomain.length === 0 ? (
                <div className="text-xs mt-2" style={{ color: "#666" }}>
                  Sélectionne des compétences dans “CV”.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {skillsByDomain.map(([domain, items]) => (
                    <div key={domain}>
                      <div className="text-[11px] font-semibold" style={{ color: "#333" }}>
                        {domain}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {items.slice(0, 10).map((name) => (
                          <span
                            key={`${domain}-${name}`}
                            className="text-[11px] px-2 py-1 rounded-full border"
                            style={{ borderColor: "#ddd", color: "#222" }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vis.showAtsKeywords && (
            <div className="border rounded p-3">
              <SectionTitle color={accent}>Mots-clés ATS</SectionTitle>
              {(variant.atsKeywords?.length ?? 0) === 0 ? (
                <div className="text-xs mt-2" style={{ color: "#666" }}>
                  Aucun mot-clé généré.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {variant.atsKeywords.map((k) => (
                    <span
                      key={k}
                      className="text-[11px] px-2 py-1 rounded-full border"
                      style={{ borderColor: "#ddd" }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {vis.showEducation && (
            <div className="border rounded p-3">
              <SectionTitle color={accent}>Éducation</SectionTitle>
              {education.length === 0 ? (
                <div className="text-xs mt-2" style={{ color: "#666" }}>
                  Aucune entrée.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {education.slice(0, 3).map((e) => (
                    <div key={e.id} className="text-[11px]" style={{ color: "#222" }}>
                      <div className="font-semibold">{e.school}</div>
                      <div style={{ color: "#555" }}>{e.degree}</div>
                      <div style={{ color: "#777" }}>
                        {(e.startDate || e.endDate) && (
                          <>
                            {e.startDate || "—"} → {e.endDate || "—"}
                          </>
                        )}
                        {e.city ? ` • ${e.city}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vis.showLanguages && (
            <div className="border rounded p-3">
              <SectionTitle color={accent}>Langues</SectionTitle>
              {languages.length === 0 ? (
                <div className="text-xs mt-2" style={{ color: "#666" }}>
                  Aucune entrée.
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  {languages.slice(0, 6).map((l) => (
                    <div key={l.id} className="text-[11px]" style={{ color: "#222" }}>
                      <span className="font-semibold">{l.name}</span>
                      {l.level ? <span style={{ color: "#666" }}> — {l.level}</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vis.showCertifications && (
            <div className="border rounded p-3">
              <SectionTitle color={accent}>Certifications</SectionTitle>
              {certs.length === 0 ? (
                <div className="text-xs mt-2" style={{ color: "#666" }}>
                  Aucune entrée.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {certs.slice(0, 4).map((c) => (
                    <div key={c.id} className="text-[11px]" style={{ color: "#222" }}>
                      <div className="font-semibold">{c.name}</div>
                      <div style={{ color: "#666" }}>
                        {c.issuer || "—"} {c.year ? `• ${c.year}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right */}
        <main className="col-span-8 space-y-4">
          {vis.showSummary && p.summary && (
            <section className="border rounded p-3">
              <SectionTitle color={accent}>Profil</SectionTitle>
              <div className="text-sm mt-2 whitespace-pre-line" style={{ color: "#222" }}>
                {p.summary}
              </div>
            </section>
          )}

          <section className="border rounded p-3">
            <SectionTitle color={accent}>Expériences</SectionTitle>
            <div className="mt-2 space-y-3">
              {selectedExperiences.length === 0 ? (
                <div className="text-sm" style={{ color: "#666" }}>
                  Aucune expérience sélectionnée.
                </div>
              ) : (
                selectedExperiences.map((e) => {
                  const cleanedBullets = e.bullets
                    .map((b) => cleanBullet(b))
                    .filter((b) => b.length > 0 && !isPlaceholderBullet(b))
                    .slice(0, bulletsMax);

                  return (
                    <div key={e.id}>
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="font-semibold" style={{ color: "#111" }}>
                          {e.title}
                          <span style={{ color: "#666" }}> — {e.company}</span>
                        </div>
                        <div className="text-[11px]" style={{ color: "#666" }}>
                          {(e.startDate || e.endDate) && (
                            <>
                              {e.startDate || "—"} → {e.endDate || "Aujourd’hui"}
                            </>
                          )}
                        </div>
                      </div>

                      {(e.tags?.length ?? 0) > 0 && (
                        <div className="text-[11px] mt-1" style={{ color: "#666" }}>
                          Tags : {e.tags.join(", ")}
                        </div>
                      )}

                      {cleanedBullets.length > 0 && (
                        <ul
                          className="list-disc pl-5 mt-1 text-sm space-y-1"
                          style={{ color: "#222" }}
                        >
                          {cleanedBullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {vis.showProjects && (
            <section className="border rounded p-3">
              <SectionTitle color={accent}>Projets</SectionTitle>

              <div className="mt-2 space-y-3">
                {selectedProjects.length === 0 ? (
                  <div className="text-sm" style={{ color: "#666" }}>
                    Aucun projet sélectionné.
                  </div>
                ) : (
                  selectedProjects.map((pr) => {
                    const cleanedBullets = (pr.bullets ?? [])
                      .map((b) => cleanBullet(b))
                      .filter((b) => b.length > 0 && !isPlaceholderBullet(b))
                      .slice(0, bulletsMax);

                    return (
                      <div key={pr.id}>
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="font-semibold" style={{ color: "#111" }}>
                            {pr.name}
                            {pr.role ? <span style={{ color: "#666" }}> — {pr.role}</span> : null}
                          </div>
                          <div className="text-[11px]" style={{ color: "#666" }}>
                            {(pr.startDate || pr.endDate) && (
                              <>
                                {pr.startDate || "—"} → {pr.endDate || "—"}
                              </>
                            )}
                          </div>
                        </div>

                        {pr.link ? (
                          <div className="text-[11px] mt-1" style={{ color: "#666" }}>
                            Lien : {shortLinkDisplay(pr.link)}
                          </div>
                        ) : null}

                        {(pr.tags?.length ?? 0) > 0 && (
                          <div className="text-[11px] mt-1" style={{ color: "#666" }}>
                            Tags : {pr.tags.join(", ")}
                          </div>
                        )}

                        {cleanedBullets.length > 0 && (
                          <ul
                            className="list-disc pl-5 mt-1 text-sm space-y-1"
                            style={{ color: "#222" }}
                          >
                            {cleanedBullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}