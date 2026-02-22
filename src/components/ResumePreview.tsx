"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppState } from "@/lib/schema";
import QRCode from "qrcode";
import { Mail, Phone, MapPin, Car, Linkedin } from "lucide-react";
import { loadPhoto } from "@/lib/storage";

function SectionTitle({ color, children }: { color: string; children: string }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
      {children}
    </div>
  );
}

/**
 * Supprime:
 * - [à préciser: ...]
 * - tout [...]
 * puis nettoie espaces/ponctuation
 */
function stripBracketHints(text: string) {
  let s = text;
  s = s.replace(/\[à préciser:[^\]]*\]/gi, "");
  s = s.replace(/\[[^\]]*\]/g, "");
  return s;
}

function tidyLine(line: string) {
  let s = line;
  s = s.replace(/^\s*[-•–—]\s*/g, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[\s.,;:()-]+|[\s.,;:()-]+$/g, "").trim();
  return s;
}

function sanitizeMultilineText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => tidyLine(stripBracketHints(l)))
    .filter((l) => l.length > 0);

  return lines.join("\n");
}

function cleanBullet(b: string) {
  return tidyLine(stripBracketHints(b));
}

function shortLinkDisplay(url: string) {
  try {
    const u = new URL(url);
    const s = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
    return s.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/\s{2,}/g, " ").trim();
}

/**
 * Normalise le "username" LinkedIn en slug utilisable pour l'URL.
 */
function normalizeLinkedinUsername(input: string) {
  return input
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/[?#/].*$/, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function ContactItem({
  icon,
  value,
  right,
}: {
  icon: ReactNode;
  value: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <div className="mt-0.5 shrink-0 opacity-80">{icon}</div>
        <div
          className="text-[11px] leading-snug min-w-0"
          style={{
            color: "#222",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
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

  // -------------------------
  // PHOTO (plus grande + stable PDF)
  // -------------------------
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!p.photoAssetId) {
        if (mounted) setPhotoUrl(null);
        return;
      }
      try {
        const url = await loadPhoto(p.photoAssetId);
        if (mounted) setPhotoUrl(url);
      } catch {
        if (mounted) setPhotoUrl(null);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [p.photoAssetId]);

  // Taille en mm (meilleur pour PDF)
  const PHOTO_MM = 28; // ⬅️ augmente/réduit ici si tu veux (ex: 30, 32...)

  // -------------------------
  // LinkedIn
  // -------------------------
  const linkedinInput = (p.linkedinUsername ?? "").trim();
  const linkedinSlug = useMemo(() => normalizeLinkedinUsername(linkedinInput), [linkedinInput]);

  const linkedinDisplay = useMemo(() => {
    if (!linkedinInput) return "";
    if (linkedinInput.startsWith("@")) return linkedinInput;
    if (/^https?:\/\//i.test(linkedinInput)) return linkedinSlug ? `@${linkedinSlug}` : "";
    return linkedinInput;
  }, [linkedinInput, linkedinSlug]);

  const linkedinUrl = useMemo(() => {
    if (!linkedinSlug) return "";
    return `https://www.linkedin.com/in/${linkedinSlug}`;
  }, [linkedinSlug]);

  const [linkedinQr, setLinkedinQr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function gen() {
      if (!linkedinUrl) {
        setLinkedinQr(null);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(linkedinUrl, {
          margin: 1,
          width: 96,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setLinkedinQr(dataUrl);
      } catch {
        if (!cancelled) setLinkedinQr(null);
      }
    }

    gen();
    return () => {
      cancelled = true;
    };
  }, [linkedinUrl]);

  // -------------------------
  // Settings / visibility
  // -------------------------
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
    showHobbies: true,
  };

  const education = (p.education ?? []).slice().reverse();
  const languages = p.languages ?? [];
  const certs = p.certifications ?? [];

  const links = (p.links ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/linkedin\.com\/in\//i.test(l));

  const contactItems: Array<{ key: string; icon: ReactNode; value: string; right?: ReactNode }> = [];

  if (p.email?.trim()) {
    contactItems.push({ key: "email", icon: <Mail size={14} />, value: p.email.trim() });
  }
  if (p.phone?.trim()) {
    contactItems.push({ key: "phone", icon: <Phone size={14} />, value: normalizePhone(p.phone.trim()) });
  }
  if (p.city?.trim()) {
    contactItems.push({ key: "city", icon: <MapPin size={14} />, value: p.city.trim() });
  }
  if (p.mobility?.trim()) {
    contactItems.push({ key: "mobility", icon: <Car size={14} />, value: p.mobility.trim() });
  }
  if (linkedinSlug && linkedinDisplay) {
    contactItems.push({
      key: "linkedin",
      icon: <Linkedin size={14} />,
      value: linkedinDisplay,
      right: linkedinQr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={linkedinQr}
          alt="QR LinkedIn"
          className="h-14 w-14 rounded border"
          style={{ borderColor: "#ddd" }}
        />
      ) : null,
    });
  }

  const summaryClean = useMemo(() => {
    const raw = (p.summary ?? "").trim();
    if (!raw) return "";
    return sanitizeMultilineText(raw);
  }, [p.summary]);

  const hobbies = useMemo(() => {
    return (state.hobbies ?? [])
      .map((h) => (h?.name ?? "").trim())
      .filter(Boolean)
      .slice(0, 10);
  }, [state.hobbies]);

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
      {/* HEADER */}
      <div className="mb-4">
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Gauche */}
          <div className="col-span-8">
            <div className="flex items-start gap-4">
              {photoUrl ? (
                <div
                  className="shrink-0 rounded-full overflow-hidden border"
                  style={{
                    width: `${PHOTO_MM}mm`,
                    height: `${PHOTO_MM}mm`,
                    borderColor: "#ddd",
                    // force le carré même si l'export PDF interprète bizarrement les px
                    aspectRatio: "1 / 1",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Photo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : null}

              <div className="min-w-0">
                <div className="text-2xl font-semibold leading-tight">{p.fullName}</div>

                <div className="text-sm mt-1" style={{ color: "#444" }}>
                  {p.headline}
                </div>

                {vis.showLinks && links.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {links.slice(0, 3).map((l) => (
                      <div
                        key={l}
                        className="text-[11px]"
                        style={{
                          color: accent,
                          textDecoration: "underline",
                          textUnderlineOffset: "2px",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Droite */}
          <div className="col-span-4">
            {contactItems.length > 0 && (
              <div className="border rounded p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>
                  Contact
                </div>

                <div className="space-y-1.5">
                  {contactItems.map((r) => (
                    <ContactItem key={r.key} icon={r.icon} value={r.value} right={r.right} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corps */}
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

          {/* Loisirs en dernier */}
          {vis.showHobbies && hobbies.length > 0 && (
            <div className="border rounded p-3">
              <SectionTitle color={accent}>Loisirs</SectionTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {hobbies.map((h) => (
                  <span
                    key={h}
                    className="text-[11px] px-2 py-1 rounded-full border"
                    style={{ borderColor: "#ddd", color: "#222" }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right */}
        <main className="col-span-8 space-y-4">
          {vis.showSummary && summaryClean && (
            <section className="border rounded p-3">
              <SectionTitle color={accent}>Profil</SectionTitle>
              <div className="text-sm mt-2 whitespace-pre-line" style={{ color: "#222" }}>
                {summaryClean}
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
                  const cleanedBullets = (e.bullets ?? [])
                    .map((b) => cleanBullet(b))
                    .filter((b) => b.length > 0)
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

                      {cleanedBullets.length > 0 && (
                        <ul className="list-disc pl-5 mt-1 text-sm space-y-1" style={{ color: "#222" }}>
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
                      .filter((b) => b.length > 0)
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

                        {cleanedBullets.length > 0 && (
                          <ul className="list-disc pl-5 mt-1 text-sm space-y-1" style={{ color: "#222" }}>
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