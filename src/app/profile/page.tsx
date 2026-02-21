"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import type { CertificationItem, EducationItem, LanguageItem } from "@/lib/schema";

function LinkChips({
  links,
  onChange,
}: {
  links: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const normalized = useMemo(
    () => links.map((x) => x.trim()).filter(Boolean),
    [links]
  );

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
      <label className="text-sm font-medium">Liens (LinkedIn, GitHub, Portfolio)</label>

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
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Colle un lien puis Entrée (ex: https://linkedin.com/in/...)"
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
  const { state, loading, updateProfile } = useAppStore();
  if (loading || !state) return <div>Chargement…</div>;

  const profile = state.profile;

  function addEducation() {
    const next: EducationItem[] = [
      ...(profile.education ?? []),
      {
        id: crypto.randomUUID(),
        school: "École / Université",
        degree: "Diplôme / Programme",
        city: "",
        startDate: "",
        endDate: "",
        details: "",
      },
    ];
    updateProfile({ education: next });
  }

  function updateEducation(id: string, partial: Partial<EducationItem>) {
    const next = (profile.education ?? []).map((e) => (e.id === id ? { ...e, ...partial } : e));
    updateProfile({ education: next });
  }

  function deleteEducation(id: string) {
    const next = (profile.education ?? []).filter((e) => e.id !== id);
    updateProfile({ education: next });
  }

  function addLanguage() {
    const next: LanguageItem[] = [
      ...(profile.languages ?? []),
      { id: crypto.randomUUID(), name: "Anglais", level: "B2" },
    ];
    updateProfile({ languages: next });
  }

  function updateLanguage(id: string, partial: Partial<LanguageItem>) {
    const next = (profile.languages ?? []).map((l) => (l.id === id ? { ...l, ...partial } : l));
    updateProfile({ languages: next });
  }

  function deleteLanguage(id: string) {
    const next = (profile.languages ?? []).filter((l) => l.id !== id);
    updateProfile({ languages: next });
  }

  function addCert() {
    const next: CertificationItem[] = [
      ...(profile.certifications ?? []),
      { id: crypto.randomUUID(), name: "Certification", issuer: "", year: "" },
    ];
    updateProfile({ certifications: next });
  }

  function updateCert(id: string, partial: Partial<CertificationItem>) {
    const next = (profile.certifications ?? []).map((c) => (c.id === id ? { ...c, ...partial } : c));
    updateProfile({ certifications: next });
  }

  function deleteCert(id: string) {
    const next = (profile.certifications ?? []).filter((c) => c.id !== id);
    updateProfile({ certifications: next });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profil</h1>

      {/* Infos de base */}
      <div className="border rounded bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom complet</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={profile.fullName}
              onChange={(e) => updateProfile({ fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Headline</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={profile.headline}
              onChange={(e) => updateProfile({ headline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={profile.email ?? ""}
              onChange={(e) => updateProfile({ email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Téléphone</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={profile.phone ?? ""}
              onChange={(e) => updateProfile({ phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={profile.city ?? ""}
              onChange={(e) => updateProfile({ city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mobilité</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={profile.mobility ?? ""}
              onChange={(e) => updateProfile({ mobility: e.target.value })}
              placeholder="Ex: France, télétravail, PACA…"
            />
          </div>
        </div>

        <LinkChips
          links={profile.links ?? []}
          onChange={(next) => updateProfile({ links: next })}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Résumé (2–4 lignes)</label>
          <textarea
            className="border rounded px-3 py-2 w-full min-h-[90px]"
            value={profile.summary ?? ""}
            onChange={(e) => updateProfile({ summary: e.target.value })}
            placeholder="Ex: Élève ingénieur ISEN (E-santé), orienté IA et capteurs…"
          />
        </div>
      </div>

      {/* Éducation */}
      <div className="border rounded bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Éducation</div>
          <button className="border rounded px-3 py-2 text-sm bg-white" onClick={addEducation}>
            + Ajouter
          </button>
        </div>

        {(profile.education ?? []).length === 0 ? (
          <div className="text-sm text-gray-600">Aucune entrée.</div>
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
                  <button className="text-red-600 text-sm" onClick={() => deleteEducation(edu.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Langues */}
      <div className="border rounded bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Langues</div>
          <button className="border rounded px-3 py-2 text-sm bg-white" onClick={addLanguage}>
            + Ajouter
          </button>
        </div>

        {(profile.languages ?? []).length === 0 ? (
          <div className="text-sm text-gray-600">Aucune entrée.</div>
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
                    <button className="text-red-600 text-sm" onClick={() => deleteLanguage(lang.id)}>
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
      <div className="border rounded bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Certifications</div>
          <button className="border rounded px-3 py-2 text-sm bg-white" onClick={addCert}>
            + Ajouter
          </button>
        </div>

        {(profile.certifications ?? []).length === 0 ? (
          <div className="text-sm text-gray-600">Aucune entrée.</div>
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
                  <button className="text-red-600 text-sm" onClick={() => deleteCert(c.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
