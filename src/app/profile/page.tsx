"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import StudioPageHeader from "@/components/StudioPageHeader";
import { AI_AVAILABLE } from "@/lib/features";
import ProfileAside from "@/components/ProfileAside";
import { Award, GraduationCap, Languages, Sparkles, Upload, UserRound } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { getStorageScope } from "@/lib/db";
import { useAppStore } from "@/store/app-store";
import type { CertificationItem, EducationItem, LanguageItem } from "@/lib/schema";
import { savePhoto, loadPhoto, deleteAsset } from "@/lib/storage";

function LinkChips({
  links,
  onChange,
}: {
  links: string[];
  onChange: (next: string[]) => void;
}) {
  const linksId = useId();
  const [draft, setDraft] = useState("");

  const normalized = useMemo(() => links.map((x) => x.trim()).filter(Boolean), [links]);

  function addFromDraft() {
    const raw = draft.trim();
    if (!raw) return;

    const tokens = raw
      .split(/[\n;|,]+/g)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    let next = [...normalized];
    for (const t of tokens) {
      const exists = next.some((x) => x.toLowerCase() === t.toLowerCase());
      if (!exists) next.push(t);
    }
    onChange(next);
    setDraft("");
  }

  function removeAt(idx: number) {
    onChange(normalized.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <label htmlFor={linksId} className="text-sm font-medium">Vos liens (GitHub, portfolio, site)</label>

      <div className="flex flex-wrap gap-2">
        {normalized.map((l, i) => (
          <button
            key={`${l}-${i}`}
            type="button"
            className="border rounded-full px-3 py-1 text-sm bg-gray-50 hover:bg-gray-100"
            title="Cliquer pour supprimer"
            onClick={() => removeAt(i)}
          >
            {l} <span className="opacity-60">×</span>
          </button>
        ))}
      </div>

      <input
        className="border rounded px-3 py-2 w-full"
        id={linksId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Colle un lien puis Entrée (ex: https://github.com/..., https://ton-site.fr)"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addFromDraft();
          }
        }}
        onBlur={addFromDraft}
      />

      <div className="text-xs text-gray-500">
        Astuce : tu peux coller plusieurs liens séparés par retour ligne, ; | ,
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { notify } = useDialog();
  const photoInput = useRef<HTMLInputElement>(null);
  // ✅ Hook store (toujours appelé)
  const { state, loading, updateProfile } = useAppStore();

  // ✅ Hooks locaux (toujours appelés, même si loading)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState<string | null>(null);

  // profile peut être undefined au 1er render
  const profile = state?.profile ?? null;

  // ---------------------------
  // PHOTO: preview
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!profile?.photoAssetId) {
        if (mounted) setPhotoUrl(null);
        return;
      }

      try {
        const url = await loadPhoto(profile.photoAssetId);
        if (mounted) setPhotoUrl(url);
      } catch {
        if (mounted) setPhotoUrl(null);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [profile?.photoAssetId]);

  async function onPickPhoto(file: File) {
    if (!profile) return;

    const scope = getStorageScope();
    try {
      const assetId = await savePhoto(file);
      if (scope === getStorageScope()) updateProfile({ photoAssetId: assetId });
    } catch (error) {
      await notify({ title: "La photo n’a pas pu être ajoutée", description: error instanceof Error ? error.message : "Impossible d’enregistrer la photo. Réessaie avec une autre image.", confirmLabel: "J’ai compris" });
    }
  }

  async function removePhoto() {
    if (!profile?.photoAssetId) return;

    try {
      await deleteAsset(profile.photoAssetId);
    } catch {}
    updateProfile({ photoAssetId: null });
  }

  // ---------------------------
  // IA résumé
  // ---------------------------
  async function improveSummary() {
    if (!profile) return;
    const txt = (profile.summary ?? "").trim();
    if (!txt) return;

    setSummaryBusy(true);
    setSummaryMsg(null);

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: "concis_ats",
          language: "fr",
          profile: {
            fullName: profile.fullName,
            headline: profile.headline,
          },
          summary: txt,
          maxLines: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSummaryMsg(data?.error ?? "Erreur IA");
        return;
      }

      updateProfile({ summary: data.summary_rewritten });
      setSummaryMsg("Résumé amélioré ✅");
    } catch (e: any) {
      setSummaryMsg(e?.message ?? "Erreur IA");
    } finally {
      setSummaryBusy(false);
    }
  }

  // ---------------------------
  // Helpers sections (utilisent profile => guards)
  // ---------------------------
  function addEducation() {
    if (!profile) return;

    const next: EducationItem[] = [
      ...(profile.education ?? []),
      {
        id: crypto.randomUUID(),
        school: "",
        degree: "",
        city: "",
        startDate: "",
        endDate: "",
        details: "",
      },
    ];
    updateProfile({ education: next });
  }

  function updateEducation(id: string, partial: Partial<EducationItem>) {
    if (!profile) return;
    const next = (profile.education ?? []).map((e) => (e.id === id ? { ...e, ...partial } : e));
    updateProfile({ education: next });
  }

  function deleteEducation(id: string) {
    if (!profile) return;
    const next = (profile.education ?? []).filter((e) => e.id !== id);
    updateProfile({ education: next });
  }

  function addLanguage() {
    if (!profile) return;
    const next: LanguageItem[] = [
      ...(profile.languages ?? []),
      { id: crypto.randomUUID(), name: "", level: "" },
    ];
    updateProfile({ languages: next });
  }

  function updateLanguage(id: string, partial: Partial<LanguageItem>) {
    if (!profile) return;
    const next = (profile.languages ?? []).map((l) => (l.id === id ? { ...l, ...partial } : l));
    updateProfile({ languages: next });
  }

  function deleteLanguage(id: string) {
    if (!profile) return;
    const next = (profile.languages ?? []).filter((l) => l.id !== id);
    updateProfile({ languages: next });
  }

  function addCert() {
    if (!profile) return;
    const next: CertificationItem[] = [
      ...(profile.certifications ?? []),
      { id: crypto.randomUUID(), name: "", issuer: "", year: "" },
    ];
    updateProfile({ certifications: next });
  }

  function updateCert(id: string, partial: Partial<CertificationItem>) {
    if (!profile) return;
    const next = (profile.certifications ?? []).map((c) => (c.id === id ? { ...c, ...partial } : c));
    updateProfile({ certifications: next });
  }

  function deleteCert(id: string) {
    if (!profile) return;
    const next = (profile.certifications ?? []).filter((c) => c.id !== id);
    updateProfile({ certifications: next });
  }

  // ✅ Maintenant seulement on affiche l’état de chargement
  if (loading || !profile) return <div>Chargement…</div>;

  return (
    <div className="studio-page">
      <StudioPageHeader eyebrow="01 / VOTRE PROFIL" title="Tout commence par vous." description="Les bonnes informations, pour un CV qui vous ressemble." action={{label:"Composer mon CV",href:"/resume"}} />
      <div className="profile-layout"><div className="profile-form-sections space-y-5">

      {/* Infos de base */}
      <section id="personal-info" className="studio-card border rounded bg-white p-4 space-y-5">
        <div className="studio-section-title"><span className="studio-icon-box"><UserRound size={19} aria-hidden="true" /></span><div><h2>Faisons les présentations</h2><p>Les informations qui vous rendent reconnaissable.</p></div><span className="studio-section-number">01</span></div>
        {/* PHOTO */}
        <div className="profile-photo-row flex flex-wrap items-center gap-4">
          <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border bg-gray-50 flex items-center justify-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <UserRound size={30} strokeWidth={1.2} className="text-[#829989]" aria-label="Photo de profil" />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Photo</label>
            <div className="flex gap-2">
              <button type="button" className="border rounded px-3 py-2 text-sm bg-white" onClick={() => photoInput.current?.click()}><Upload size={14} aria-hidden="true" />{photoUrl ? "Changer la photo" : "Ajouter une photo"}</button>
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Choisir une photo de profil" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onPickPhoto(file);
                event.currentTarget.value = "";
              }} />

              <button
                type="button"
                className="border rounded px-3 py-2 text-sm bg-white"
                onClick={removePhoto}
                disabled={!profile.photoAssetId}
              >
                Supprimer
              </button>
            </div>
            <div className="text-xs text-gray-500">JPG, PNG ou WebP · 5 Mo maximum.</div>
          </div>
        </div>

        {/* Champs base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="profile-fullname" className="text-sm font-medium">Nom complet</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-fullname"
              value={profile.fullName}
              onChange={(e) => updateProfile({ fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-headline" className="text-sm font-medium">Intitulé professionnel</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-headline"
              value={profile.headline}
              onChange={(e) => updateProfile({ headline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-email" className="text-sm font-medium">Email</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-email"
              value={profile.email ?? ""}
              onChange={(e) => updateProfile({ email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-phone" className="text-sm font-medium">Téléphone</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-phone"
              value={profile.phone ?? ""}
              onChange={(e) => updateProfile({ phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-city" className="text-sm font-medium">Ville</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-city"
              value={profile.city ?? ""}
              onChange={(e) => updateProfile({ city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-mobility" className="text-sm font-medium">Mobilité</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-mobility"
              value={profile.mobility ?? ""}
              onChange={(e) => updateProfile({ mobility: e.target.value })}
              placeholder="Ex: France, télétravail, PACA…"
            />
          </div>

          {/* LinkedIn username */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="profile-linkedin" className="text-sm font-medium">Identifiant LinkedIn</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="profile-linkedin"
              value={profile.linkedinUsername ?? ""}
              onChange={(e) => updateProfile({ linkedinUsername: e.target.value })}
              placeholder="Ex. alexandre-dupont"
            />
            <div className="text-xs text-gray-500">
              La partie après <span className="font-medium">/in/</span> dans votre lien LinkedIn. Un lien et un QR code seront ajoutés au CV.
            </div>
          </div>
        </div>

        <LinkChips links={profile.links ?? []} onChange={(next) => updateProfile({ links: next })} />

        {/* Résumé + IA */}
        <div id="profile-summary" className="profile-summary-section space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="profile-summary-input" className="text-sm font-medium">Votre présentation</label>
            {AI_AVAILABLE && <button
              type="button"
              className="border rounded px-3 py-1 text-sm bg-white"
              disabled={summaryBusy || !(profile.summary ?? "").trim()}
              onClick={improveSummary}
            >
              <Sparkles size={13} aria-hidden="true" />{summaryBusy ? "Amélioration…" : "Améliorer le texte"}
            </button>}
          </div>

          {summaryMsg && <div className="text-xs text-gray-600">{summaryMsg}</div>}

          <textarea
            className="border rounded px-3 py-2 w-full min-h-[90px]"
            id="profile-summary-input"
            value={profile.summary ?? ""}
            onChange={(e) => updateProfile({ summary: e.target.value })}
            placeholder="Votre spécialité, votre objectif et ce que vous apportez, en quelques phrases."
          />
        </div>
      </section>

      {/* Éducation */}
      <div id="profile-education" className="studio-card border rounded bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="studio-section-title"><span className="studio-icon-box"><GraduationCap size={18} aria-hidden="true" /></span><div><h2>Formation</h2><p>Votre parcours académique, vos diplômes et vos spécialisations.</p></div></div>
          <button type="button" className="border rounded px-3 py-2 text-sm bg-white" onClick={addEducation}>
            + Ajouter
          </button>
        </div>

        {(profile.education ?? []).length === 0 ? (
          <div className="studio-empty-line">Ajoutez votre première entrée pour enrichir votre profil.</div>
        ) : (
          <div className="space-y-3">
            {(profile.education ?? []).map((edu) => (
              <div key={edu.id} className="border rounded p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                    placeholder="École / Université"
                  />
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    placeholder="Diplôme / Programme"
                  />
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={edu.city ?? ""}
                    onChange={(e) => updateEducation(edu.id, { city: e.target.value })}
                    placeholder="Ville (optionnel)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={edu.startDate ?? ""}
                      onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                      placeholder="Début (ex: 2022)"
                    />
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={edu.endDate ?? ""}
                      onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                      placeholder="Fin (ex: 2026)"
                    />
                  </div>
                </div>

                <textarea
                  className="border rounded px-3 py-2 w-full min-h-[70px]"
                  value={edu.details ?? ""}
                  onChange={(e) => updateEducation(edu.id, { details: e.target.value })}
                  placeholder="Détails (optionnel) : spécialisation, cours pertinents, mention…"
                />

                <div className="flex justify-end">
                  <button className="text-red-600 text-sm" type="button" onClick={() => deleteEducation(edu.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Langues */}
      <div id="profile-languages" className="studio-card border rounded bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="studio-section-title"><span className="studio-icon-box"><Languages size={18} aria-hidden="true" /></span><div><h2>Langues</h2><p>Ouvrez votre profil à de nouvelles possibilités.</p></div></div>
          <button type="button" className="border rounded px-3 py-2 text-sm bg-white" onClick={addLanguage}>
            + Ajouter
          </button>
        </div>

        {(profile.languages ?? []).length === 0 ? (
          <div className="studio-empty-line">Ajoutez votre première entrée pour enrichir votre profil.</div>
        ) : (
          <div className="space-y-2">
            {(profile.languages ?? []).map((lang) => (
              <div key={lang.id} className="border rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={lang.name}
                    onChange={(e) => updateLanguage(lang.id, { name: e.target.value })}
                    placeholder="Langue"
                  />
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={lang.level ?? ""}
                    onChange={(e) => updateLanguage(lang.id, { level: e.target.value })}
                    placeholder="Niveau (ex: B2, C1, natif)"
                  />
                  <div className="flex justify-end">
                    <button className="text-red-600 text-sm" type="button" onClick={() => deleteLanguage(lang.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div id="profile-certifications" className="studio-card border rounded bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="studio-section-title"><span className="studio-icon-box"><Award size={18} aria-hidden="true" /></span><div><h2>Certifications</h2><p>Les acquis qui font la différence.</p></div></div>
          <button type="button" className="border rounded px-3 py-2 text-sm bg-white" onClick={addCert}>
            + Ajouter
          </button>
        </div>

        {(profile.certifications ?? []).length === 0 ? (
          <div className="studio-empty-line">Ajoutez votre première entrée pour enrichir votre profil.</div>
        ) : (
          <div className="space-y-2">
            {(profile.certifications ?? []).map((c) => (
              <div key={c.id} className="border rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <input
                    className="border rounded px-3 py-2 w-full md:col-span-2"
                    value={c.name}
                    onChange={(e) => updateCert(c.id, { name: e.target.value })}
                    placeholder="Nom de la certification"
                  />
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={c.issuer ?? ""}
                    onChange={(e) => updateCert(c.id, { issuer: e.target.value })}
                    placeholder="Organisme"
                  />
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={c.year ?? ""}
                    onChange={(e) => updateCert(c.id, { year: e.target.value })}
                    placeholder="Année"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button className="text-red-600 text-sm" type="button" onClick={() => deleteCert(c.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div><ProfileAside /></div>
    </div>
  );
}