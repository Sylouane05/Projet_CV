"use client";

import { useEffect, useMemo, useState } from "react";
import { useDialog } from "@/components/DialogProvider";
import { getStorageScope } from "@/lib/db";
import StudioPageHeader from "@/components/StudioPageHeader";
import { AI_AVAILABLE } from "@/lib/features";
import { ChevronDown, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import ResponsiveResumePreview from "@/components/ResponsiveResumePreview";

export default function ResumePage() {
  const { confirm } = useDialog();
  const {
    state,
    loading,
    activeVariantId,
    setActiveVariant,
    addVariant,
    renameVariant,
    deleteVariant,
    toggleExperienceInVariant,
    toggleProjectInVariant,
    toggleSkillInVariant,
    setVariantSelectedExperienceIds,
    setVariantAtsKeywords,
    setVariantDensity,
    setVariantAccentColor,
    setVariantVisibility,
  } = useAppStore();

  const [jobOffer, setJobOffer] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!state || loading) return;
    if (!activeVariantId && state.resumeVariants.length > 0) {
      setActiveVariant(state.resumeVariants[0].id);
    }
  }, [state, loading, activeVariantId, setActiveVariant]);

  const activeVariant = useMemo(() => {
    if (!state || !activeVariantId) return null;
    return state.resumeVariants.find((v) => v.id === activeVariantId) ?? null;
  }, [state, activeVariantId]);

  if (loading || !state) return <div>Chargement…</div>;
  if (!activeVariant) return <div>Aucun variant actif.</div>;

  const vis = activeVariant.settings?.visibility ?? {
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

  async function optimizeFromOffer() {
    if (!jobOffer.trim() || !state || !activeVariant) return;

    setAiBusy(true);
    setAiMsg(null);

    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobOffer,
          experiences: state.experiences.map((e) => ({
            id: e.id,
            title: e.title,
            company: e.company,
            bullets: e.bullets,
            tech: e.tech,
            tags: e.tags,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiMsg(data?.error ?? "Erreur IA");
        return;
      }

      if (Array.isArray(data.recommendedExperienceIds)) {
        setVariantSelectedExperienceIds(activeVariant.id, data.recommendedExperienceIds);
      }

      if (Array.isArray(data.keywordsATS)) {
        setVariantAtsKeywords(activeVariant.id, data.keywordsATS);
      }

      setAiMsg("Optimisation terminée ✅ (sélection + mots-clés ATS)");
    } catch (e: any) {
      setAiMsg(e?.message ?? "Erreur IA");
    } finally {
      setAiBusy(false);
    }
  }

  function Toggle({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
    );
  }

  return (
    <div className="studio-page composer-page">
      <StudioPageHeader eyebrow="03 / VOTRE COMPOSITION" title="Votre parcours. Votre signature." description="Choisissez l’essentiel, ajustez les détails et regardez votre CV prendre forme." action={{label:"Exporter mon CV",href:"/export"}} />

      <div className="composer-layout"><div className="composer-controls space-y-5">
      {/* Adapter à une offre */}
      {AI_AVAILABLE && <details className="studio-disclosure studio-card border rounded bg-white p-4 space-y-3">
        <summary><Sparkles size={16} aria-hidden="true" /><span>Adapter à une offre<small>Un coup de pouce, si vous en avez besoin.</small></span><ChevronDown size={16} aria-hidden="true" /></summary>

        <textarea
          className="border rounded px-3 py-2 w-full min-h-[140px]"
          value={jobOffer}
          onChange={(e) => setJobOffer(e.target.value)}
          placeholder="Colle ici l’offre de stage (mission + stack + compétences recherchées)..."
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="border rounded px-3 py-2 text-sm bg-white"
            disabled={aiBusy || !jobOffer.trim()}
            onClick={optimizeFromOffer}
          >
            {aiBusy ? "Analyse..." : "Adapter cette version"}
          </button>

          {aiMsg && <div className="text-sm text-gray-700">{aiMsg}</div>}
        </div>

        <div className="text-xs text-gray-500">
          L’IA ne coche que des expériences existantes et propose des mots-clés ATS (sans inventer de faits).
        </div>
      </details>}

      {/* Variants */}
      <div className="studio-card border rounded bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-medium">Vos versions</div>
          <button className="border rounded px-3 py-2 text-sm" onClick={addVariant}>
            + Nouveau
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.resumeVariants.map((v) => {
            const active = v.id === activeVariantId;
            return (
              <button
                key={v.id}
                aria-pressed={active}
                className={`border rounded px-3 py-2 text-sm ${
                  active ? "bg-gray-100 font-medium" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => setActiveVariant(v.id)}
              >
                {v.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="variant-name" className="text-sm font-medium">Nom de cette version</label>
            <input
              className="border rounded px-3 py-2 w-full"
              id="variant-name"
              value={activeVariant.name}
              onChange={(e) => renameVariant(activeVariant.id, e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Couleur de signature</div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                aria-label="Couleur de signature"
                type="color"
                value={activeVariant.settings?.accentColor ?? "#2563eb"}
                onChange={(e) => setVariantAccentColor(activeVariant.id, e.target.value)}
                className="h-10 w-14 border rounded"
                title="Choisir la couleur"
              />
              <input
                aria-label="Valeur de la couleur de signature"
                className="border rounded px-3 py-2 w-full"
                value={activeVariant.settings?.accentColor ?? "#2563eb"}
                onChange={(e) => setVariantAccentColor(activeVariant.id, e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <label htmlFor="variant-density" className="text-sm font-medium">Densité</label>
            <select
              className="border rounded px-3 py-2"
              id="variant-density"
              value={activeVariant.settings?.density ?? "normal"}
              onChange={(e) => setVariantDensity(activeVariant.id, e.target.value as "compact" | "normal" | "airy")}
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="airy">Aéré</option>
            </select>
          </div>

          <button className="text-red-600 text-sm" disabled={state.resumeVariants.length < 2} title={state.resumeVariants.length < 2 ? "Conservez au moins une version de CV" : undefined} onClick={async () => {
            const scope = getStorageScope();
            if (await confirm({ title: "Supprimer cette version ?", description: `La version « ${activeVariant.name} » sera supprimée. Exportez vos données si vous souhaitez en conserver une copie.`, confirmLabel: "Supprimer cette version", destructive: true }) && scope === getStorageScope()) deleteVariant(activeVariant.id);
          }}>
            Supprimer cette version
          </button>
        </div>
      </div>

      {/* Visibilité */}
      <div className="studio-card border rounded bg-white p-4 space-y-3">
        <div className="font-medium">Rubriques affichées</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Toggle label="Liens" checked={vis.showLinks} onChange={(v) => setVariantVisibility(activeVariant.id, { showLinks: v })} />
          <Toggle label="Profil" checked={vis.showSummary} onChange={(v) => setVariantVisibility(activeVariant.id, { showSummary: v })} />
          <Toggle label="Compétences" checked={vis.showSkills} onChange={(v) => setVariantVisibility(activeVariant.id, { showSkills: v })} />
          <Toggle label="Mots-clés ATS" checked={vis.showAtsKeywords} onChange={(v) => setVariantVisibility(activeVariant.id, { showAtsKeywords: v })} />
          <Toggle label="Projets" checked={vis.showProjects} onChange={(v) => setVariantVisibility(activeVariant.id, { showProjects: v })} />
          <Toggle label="Éducation" checked={vis.showEducation} onChange={(v) => setVariantVisibility(activeVariant.id, { showEducation: v })} />
          <Toggle label="Langues" checked={vis.showLanguages} onChange={(v) => setVariantVisibility(activeVariant.id, { showLanguages: v })} />
          <Toggle label="Certifications" checked={vis.showCertifications} onChange={(v) => setVariantVisibility(activeVariant.id, { showCertifications: v })} />

          {/* ✅ NEW */}
          <Toggle label="Loisirs" checked={vis.showHobbies} onChange={(v) => setVariantVisibility(activeVariant.id, { showHobbies: v })} />
        </div>
      </div>

      {/* Sélections */}

        <div className="space-y-6">
          {/* Expériences */}
          <div className="studio-card border rounded bg-white p-4 space-y-3">
            <div className="font-medium">Sélection des expériences</div>
            {state.experiences.length === 0 ? (
              <div className="text-sm text-gray-600">Ajoute des expériences dans Bibliothèque.</div>
            ) : (
              <div className="space-y-2">
                {state.experiences.map((e) => {
                  const checked = activeVariant.selectedExperienceIds.includes(e.id);
                  return (
                    <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExperienceInVariant(activeVariant.id, e.id)}
                      />
                      <span>
                        {e.title} — <span className="text-gray-600">{e.company}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Projets */}
          <div className="studio-card border rounded bg-white p-4 space-y-3">
            <div className="font-medium">Sélection des projets</div>
            {state.projects.length === 0 ? (
              <div className="text-sm text-gray-600">Ajoute des projets dans Bibliothèque.</div>
            ) : (
              <div className="space-y-2">
                {state.projects.map((p) => {
                  const checked = activeVariant.selectedProjectIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProjectInVariant(activeVariant.id, p.id)}
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compétences */}
          <div className="studio-card border rounded bg-white p-4 space-y-3">
            <div className="font-medium">Sélection des compétences</div>
            {(state.skills ?? []).length === 0 ? (
              <div className="text-sm text-gray-600">Ajoute des compétences dans Bibliothèque.</div>
            ) : (
              <div className="space-y-2">
                {(state.skills ?? []).map((s) => {
                  const checked = (activeVariant.selectedSkillIds ?? []).includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSkillInVariant(activeVariant.id, s.id)}
                      />
                      <span>
                        {s.name} <span className="text-gray-500">({s.domain})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
        {/* Preview */}
        <div className="composer-preview">
          <div className="studio-preview-heading"><span><i /> VOTRE CV, EN DIRECT</span><span>A4</span></div>
          <ResponsiveResumePreview state={state} variantId={activeVariant.id} />
        </div>
      </div>
    </div>
  );
}