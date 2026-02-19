"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";

export default function LibraryPage() {
  const {
    state,
    loading,
    addExperience,
    updateExperience,
    deleteExperience,
    addExperienceBullet,
    updateExperienceBullet,
    deleteExperienceBullet,
    applyExperienceBullets,
  } = useAppStore();

  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (loading || !state) return <div>Chargement…</div>;

  async function runAi(expId: string, mode: "rewrite" | "shorten_1page") {
    const exp = state.experiences.find((e) => e.id === expId);
    if (!exp) return;

    setAiError(null);
    setAiBusyId(expId);

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          style: "concis_ats",
          language: "fr",
          context: {
            kind: "experience",
            title: exp.title,
            org: exp.company,
            tech: exp.tech ?? [],
          },
          bullets: exp.bullets.length
            ? exp.bullets
            : ["[à compléter: ajoute au moins 1 bullet]"],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data?.error ?? "Erreur IA");
        return;
      }

      const proposed =
        mode === "shorten_1page" && data.bullets_short?.length
          ? data.bullets_short
          : data.bullets_rewritten;

      const ok = window.confirm("Appliquer la proposition IA à cette expérience ?");
      if (ok) applyExperienceBullets(expId, proposed);
    } catch (e: any) {
      setAiError(e?.message ?? "Erreur IA");
    } finally {
      setAiBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bibliothèque</h1>

      <button
        className="border rounded px-3 py-2 bg-white"
        onClick={addExperience}
      >
        + Ajouter une expérience
      </button>

      {aiError && (
        <div className="border rounded p-3 bg-white text-red-700 text-sm">
          {aiError}
        </div>
      )}

      <div className="space-y-4">
        {state.experiences.map((exp) => (
          <div key={exp.id} className="border rounded p-4 bg-white space-y-4">
            {/* Titre + entreprise */}
            <div className="grid grid-cols-1 gap-2">
              <input
                className="border rounded px-3 py-2 w-full"
                value={exp.title}
                onChange={(e) =>
                  updateExperience(exp.id, { title: e.target.value })
                }
                placeholder="Titre (ex: Stagiaire IA)"
              />

              <input
                className="border rounded px-3 py-2 w-full"
                value={exp.company}
                onChange={(e) =>
                  updateExperience(exp.id, { company: e.target.value })
                }
                placeholder="Entreprise"
              />
            </div>

            {/* Tech */}
            <div className="space-y-2">
              <div className="font-medium text-sm">
                Technologies (séparées par virgule)
              </div>
              <input
                className="border rounded px-3 py-2 w-full"
                value={(exp.tech ?? []).join(", ")}
                onChange={(e) =>
                  updateExperience(exp.id, {
                    tech: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Ex: Python, TensorFlow, Pandas"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="font-medium text-sm">
                Tags (séparés par virgule)
              </div>
              <input
                className="border rounded px-3 py-2 w-full"
                value={(exp.tags ?? []).join(", ")}
                onChange={(e) =>
                  updateExperience(exp.id, {
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Ex: IA, Capteurs, Santé"
              />
            </div>

            {/* Bullets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">Missions (bullets)</div>
                <button
                  className="text-sm underline"
                  onClick={() => addExperienceBullet(exp.id)}
                >
                  + Ajouter un bullet
                </button>
              </div>

              {exp.bullets.length === 0 && (
                <div className="text-sm text-gray-500">
                  Aucun bullet. Ajoute-en au moins un pour utiliser l’IA.
                </div>
              )}

              <div className="space-y-2">
                {exp.bullets.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={b}
                      onChange={(e) =>
                        updateExperienceBullet(exp.id, i, e.target.value)
                      }
                      placeholder={`Bullet ${i + 1}`}
                    />
                    <button
                      className="text-red-600 text-sm"
                      onClick={() => deleteExperienceBullet(exp.id, i)}
                    >
                      Suppr
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="border rounded px-3 py-2 text-sm"
                disabled={aiBusyId === exp.id}
                onClick={() => runAi(exp.id, "rewrite")}
              >
                {aiBusyId === exp.id ? "IA..." : "Améliorer (ATS)"}
              </button>

              <button
                className="border rounded px-3 py-2 text-sm"
                disabled={aiBusyId === exp.id}
                onClick={() => runAi(exp.id, "shorten_1page")}
              >
                {aiBusyId === exp.id ? "IA..." : "Raccourcir (1 page)"}
              </button>

              <button
                className="text-red-600 text-sm ml-auto"
                onClick={() => deleteExperience(exp.id)}
              >
                Supprimer l’expérience
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
