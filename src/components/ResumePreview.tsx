"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppState } from "@/lib/schema";
import QRCode from "qrcode";
import { Mail, Phone, MapPin, Car, Linkedin } from "lucide-react";
import { loadPhoto } from "@/lib/storage";

/** ---------- Helpers texte ---------- */
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
  return text
    .split(/\r?\n/)
    .map((l) => tidyLine(stripBracketHints(l)))
    .filter((l) => l.length > 0)
    .join("\n");
}
function cleanBullet(b: string) {
  return tidyLine(stripBracketHints(b));
}
function cleanInline(s: string) {
  return tidyLine(stripBracketHints(s));
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

/** ---------- UI ---------- */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        border: "1px solid #111111",
        backgroundColor: "#ffffff",
      }}
    >
      {children}
    </div>
  );
}
function CardBody({ children }: { children: ReactNode }) {
  return <div className="p-3">{children}</div>;
}
function CardHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#111" }}>
          {title}
        </div>
        <div style={{ width: 26, height: 3, backgroundColor: accent }} />
      </div>
      <div style={{ height: 1, backgroundColor: "#111111", opacity: 0.12, marginTop: 6 }} />
    </div>
  );
}

function ContactRow({
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
          style={{ color: "#111", wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {value}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function DateText({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-[11px]"
      style={{
        color: "#666",
        whiteSpace: "nowrap",
        lineHeight: "14px",
        marginTop: 2,
      }}
    >
      {children}
    </div>
  );
}

export default function ResumePreview({ state, variantId }: { state: AppState; variantId: string }) {
  const variant = useMemo(
    () => state.resumeVariants.find((v) => v.id === variantId) ?? null,
    [state, variantId]
  );
  if (!variant) return <div>Variant introuvable</div>;

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
    showHobbies: true,
  };

  /** PHOTO */
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

  const PHOTO_MM = 38; // un peu plus grand

  /** LinkedIn QR */
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
        const dataUrl = await QRCode.toDataURL(linkedinUrl, { margin: 1, width: 96, errorCorrectionLevel: "M" });
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

  /** Selections */
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

  /** Skills grouped */
  const skillsByDomain = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of selectedSkills) {
      const dom = cleanInline(s.domain || "Général") || "Général";
      const name = cleanInline(s.name);
      if (!name) continue;

      if (!map.has(dom)) map.set(dom, []);
      map.get(dom)!.push(name);
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

  const education = (p.education ?? []).slice().reverse();
  const languages = p.languages ?? [];
  const certs = p.certifications ?? [];

  const summaryClean = useMemo(() => {
    const raw = (p.summary ?? "").trim();
    return raw ? sanitizeMultilineText(raw) : "";
  }, [p.summary]);

  const hobbies = useMemo(() => {
    return (state.hobbies ?? [])
      .map((h) => cleanInline(h?.name ?? ""))
      .filter(Boolean)
      .slice(0, 18);
  }, [state.hobbies]);

  /** Links (LinkedIn retiré) */
  const links = (p.links ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/linkedin\.com\/in\//i.test(l));

  /** Contact */
  const contactItems: Array<{ key: string; icon: ReactNode; value: string; right?: ReactNode }> = [];
  if (p.email?.trim()) contactItems.push({ key: "email", icon: <Mail size={14} />, value: p.email.trim() });
  if (p.phone?.trim())
    contactItems.push({ key: "phone", icon: <Phone size={14} />, value: normalizePhone(p.phone.trim()) });
  if (p.city?.trim()) contactItems.push({ key: "city", icon: <MapPin size={14} />, value: p.city.trim() });
  if (p.mobility?.trim()) contactItems.push({ key: "mobility", icon: <Car size={14} />, value: p.mobility.trim() });

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
          style={{
            width: "14mm",
            height: "14mm",
            border: "1px solid #111111",
            borderRadius: 4,
            backgroundColor: "#ffffff",
          }}
        />
      ) : null,
    });
  }

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
          <div className="col-span-8">
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: `${PHOTO_MM}mm`,
                  height: `${PHOTO_MM}mm`,
                  borderRadius: "9999px",
                  border: "1px solid #111111",
                  backgroundColor: "#f3f4f6",
                }}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                ) : null}
              </div>

              <div className="min-w-0">
                <div className="text-[26px] font-semibold leading-[1.08]" style={{ color: "#111" }}>
                  {p.fullName}
                </div>
                <div className="mt-1 text-[12px]" style={{ color: "#444" }}>
                  {p.headline}
                </div>

                {vis.showLinks && links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {links.slice(0, 3).map((l) => (
                      <span
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
                        {shortLinkDisplay(l)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4">
            {contactItems.length > 0 && (
              <Card>
                <CardBody>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666" }}>
                    Contact
                  </div>
                  <div className="space-y-2">
                    {contactItems.map((r) => (
                      <ContactRow key={r.key} icon={r.icon} value={r.value} right={r.right} />
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-12" style={{ gap: `${gapMm}mm` }}>
        <aside className="col-span-4 space-y-4">
          {/* ✅ Compétences SANS capsules */}
          {vis.showSkills && (
            <Card>
              <CardBody>
                <CardHeader title="Compétences" accent={accent} />
                {skillsByDomain.length === 0 ? (
                  <div className="text-xs mt-2" style={{ color: "#666" }}>
                    Sélectionne des compétences dans “CV”.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {skillsByDomain.map(([domain, items]) => (
                      <div key={domain}>
                        <div className="text-[11px] font-semibold" style={{ color: "#111" }}>
                          {domain}
                        </div>
                        <div className="text-[11px] mt-1" style={{ color: "#111", lineHeight: "15px" }}>
                          {items.slice(0, 16).join(" • ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {vis.showEducation && (
            <Card>
              <CardBody>
                <CardHeader title="Éducation" accent={accent} />
                {education.length === 0 ? (
                  <div className="text-xs mt-2" style={{ color: "#666" }}>
                    Aucune entrée.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {education.slice(0, 4).map((e) => (
                      <div key={e.id} className="text-[11px]" style={{ color: "#111" }}>
                        <div className="font-semibold">{cleanInline(e.school)}</div>
                        <div style={{ color: "#555" }}>{cleanInline(e.degree)}</div>
                        <div style={{ color: "#777" }}>
                          {(e.startDate || e.endDate) ? `${e.startDate || "—"} → ${e.endDate || "—"}` : ""}
                          {e.city ? ` • ${cleanInline(e.city)}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {vis.showLanguages && (
            <Card>
              <CardBody>
                <CardHeader title="Langues" accent={accent} />
                {languages.length === 0 ? (
                  <div className="text-xs mt-2" style={{ color: "#666" }}>
                    Aucune entrée.
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {languages.slice(0, 8).map((l) => (
                      <div key={l.id} className="text-[11px]" style={{ color: "#111" }}>
                        <span className="font-semibold">{cleanInline(l.name)}</span>
                        {l.level ? <span style={{ color: "#666" }}> — {cleanInline(l.level)}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {vis.showCertifications && (
            <Card>
              <CardBody>
                <CardHeader title="Certifications" accent={accent} />
                {certs.length === 0 ? (
                  <div className="text-xs mt-2" style={{ color: "#666" }}>
                    Aucune entrée.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {certs.slice(0, 5).map((c) => (
                      <div key={c.id} className="text-[11px]" style={{ color: "#111" }}>
                        <div className="font-semibold">{cleanInline(c.name)}</div>
                        <div style={{ color: "#666" }}>
                          {cleanInline(c.issuer || "—")} {c.year ? `• ${cleanInline(c.year)}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* ✅ Loisirs SANS capsules */}
          {vis.showHobbies && hobbies.length > 0 && (
            <Card>
              <CardBody>
                <CardHeader title="Loisirs" accent={accent} />
                <div className="text-[11px] mt-2" style={{ color: "#111", lineHeight: "15px" }}>
                  {hobbies.join(" • ")}
                </div>
              </CardBody>
            </Card>
          )}
        </aside>

        <main className="col-span-8 space-y-4">
          {vis.showSummary && summaryClean && (
            <Card>
              <CardBody>
                <CardHeader title="Profil" accent={accent} />
                <div className="text-sm mt-2 whitespace-pre-line" style={{ color: "#111" }}>
                  {summaryClean}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <CardHeader title="Expériences" accent={accent} />
              <div className="mt-2 space-y-3">
                {selectedExperiences.length === 0 ? (
                  <div className="text-sm" style={{ color: "#666" }}>
                    Aucune expérience sélectionnée.
                  </div>
                ) : (
                  selectedExperiences.map((e) => {
                    const cleanedBullets = (e.bullets ?? [])
                      .map(cleanBullet)
                      .filter((b) => b.length > 0)
                      .slice(0, bulletsMax);

                    const dateText =
                      e.startDate || e.endDate ? `${e.startDate || "—"} → ${e.endDate || "Aujourd’hui"}` : "";

                    return (
                      <div key={e.id}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold" style={{ color: "#111" }}>
                              {cleanInline(e.title)}
                              <span style={{ color: "#666" }}> — {cleanInline(e.company)}</span>
                              {e.location ? <span style={{ color: "#666" }}> • {cleanInline(e.location)}</span> : null}
                            </div>
                          </div>
                          {dateText ? <DateText>{dateText}</DateText> : null}
                        </div>

                        {cleanedBullets.length > 0 && (
                          <ul className="list-disc pl-5 mt-1 text-sm space-y-1" style={{ color: "#111" }}>
                            {cleanedBullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}

                        <div style={{ height: 1, backgroundColor: "#111111", opacity: 0.08, marginTop: 10 }} />
                      </div>
                    );
                  })
                )}
              </div>
            </CardBody>
          </Card>

          {vis.showProjects && (
            <Card>
              <CardBody>
                <CardHeader title="Projets" accent={accent} />
                <div className="mt-2 space-y-3">
                  {selectedProjects.length === 0 ? (
                    <div className="text-sm" style={{ color: "#666" }}>
                      Aucun projet sélectionné.
                    </div>
                  ) : (
                    selectedProjects.map((pr) => {
                      const cleanedBullets = (pr.bullets ?? [])
                        .map(cleanBullet)
                        .filter((b) => b.length > 0)
                        .slice(0, bulletsMax);

                      const dateText =
                        pr.startDate || pr.endDate ? `${pr.startDate || "—"} → ${pr.endDate || "—"}` : "";

                      return (
                        <div key={pr.id}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold" style={{ color: "#111" }}>
                                {cleanInline(pr.name)}
                                {pr.role ? <span style={{ color: "#666" }}> — {cleanInline(pr.role)}</span> : null}
                              </div>

                              {pr.link ? (
                                <div className="text-[11px] mt-1" style={{ color: "#666" }}>
                                  Lien : {shortLinkDisplay(pr.link)}
                                </div>
                              ) : null}
                            </div>
                            {dateText ? <DateText>{dateText}</DateText> : null}
                          </div>

                          {cleanedBullets.length > 0 && (
                            <ul className="list-disc pl-5 mt-1 text-sm space-y-1" style={{ color: "#111" }}>
                              {cleanedBullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}

                          <div style={{ height: 1, backgroundColor: "#111111", opacity: 0.08, marginTop: 10 }} />
                        </div>
                      );
                    })
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}