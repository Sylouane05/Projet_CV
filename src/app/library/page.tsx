"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import ChipsInput from "@/components/ChipsInput";
import { useState } from "react";

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`border rounded px-3 py-2 text-sm ${
        active ? "bg-gray-100 font-medium" : "bg-white hover:bg-gray-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

type AiKind = "experience" | "project";
type AiMode = "rewrite" | "shorten_1page";

export default function LibraryPage() {
  const params = useSearchParams();
  const router = useRouter();

  const tab = (params.get("tab") ?? "experiences") as
    | "experiences"
    | "projects"
    | "skills"
    | "hobbies";

  const {
    state,
    loading,

    // experiences
    addExperience,
    updateExperience,
    deleteExperience,
    addExperienceBullet,
    updateExperienceBullet,
    deleteExperienceBullet,

    // projects
    addProject,
    updateProject,
    deleteProject,
    addProjectBullet,
    updateProjectBullet,
    deleteProjectBullet,

    // skills
    addSkill,
    updateSkill,
    deleteSkill,

    // ✅ hobbies (NOUVEAU)
    addHobby,
    updateHobby,
    deleteHobby,
  } = useAppStore();

  const setTab = (next: "experiences" | "projects" | "skills" | "hobbies") => {
    router.replace(`/library?tab=${next}`);
  };

  const [aiBusyById, setAiBusyById] = useState<Record<string, boolean>>({});
  const [aiMsgById, setAiMsgById] = useState<Record<string, string | null>>({});

  async function improveBullets(params: {
    kind: AiKind;
    id: string;
    title: string;
    org: string;
    tech: string[];
    bullets: string[];
    mode: AiMode;
    apply: (next: string[]) => void;
  }) {
    const clean = (params.bullets ?? []).map((b) => b.trim()).filter(Boolean);
    if (clean.length === 0) {
      setAiMsgById((m) => ({ ...m, [params.id]: "Ajoute au moins un bullet avant d'utiliser l’IA." }));
      return;
    }

    setAiBusyById((m) => ({ ...m, [params.id]: true }));
    setAiMsgById((m) => ({ ...m, [params.id]: null }));

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: params.mode,
          style: "concis_ats",
          language: "fr",
          context: {
            kind: params.kind,
            title: params.title,
            org: params.org,
            tech: params.tech ?? [],
          },
          bullets: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiMsgById((m) => ({ ...m, [params.id]: data?.error ?? "Erreur IA" }));
        return;
      }

      const next =
        params.mode === "shorten_1page" &&
        Array.isArray(data.bullets_short) &&
        data.bullets_short.length > 0
          ? data.bullets_short
          : data.bullets_rewritten;

      if (!Array.isArray(next) || next.length === 0) {
        setAiMsgById((m) => ({ ...m, [params.id]: "IA: réponse vide." }));
        return;
      }

      params.apply(next);
      setAiMsgById((m) => ({ ...m, [params.id]: "Missions améliorées ✅" }));
    } catch (e: any) {
      setAiMsgById((m) => ({ ...m, [params.id]: e?.message ?? "Erreur IA" }));
    } finally {
      setAiBusyById((m) => ({ ...m, [params.id]: false }));
    }
  }

  if (loading || !state) return <div>Chargement…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bibliothèque</h1>
        <div className="text-gray-600 mt-1">
          Ajoute tes contenus ici, puis sélectionne-les par variant dans l’onglet CV.
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 flex-wrap">
        <TabButton active={tab === "experiences"} onClick={() => setTab("experiences")}>
          Expériences
        </TabButton>
        <TabButton active={tab === "projects"} onClick={() => setTab("projects")}>
          Projets
        </TabButton>
        <TabButton active={tab === "skills"} onClick={() => setTab("skills")}>
          Compétences
        </TabButton>
        {/* ✅ NOUVEAU */}
        <TabButton active={tab === "hobbies"} onClick={() => setTab("hobbies")}>
          Loisirs
        </TabButton>
      </div>

      {/* EXPÉRIENCES */}
      {tab === "experiences" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Expériences</div>
            <button className="border rounded px-3 py-2 text-sm" onClick={addExperience} type="button">
              + Ajouter une expérience
            </button>
          </div>

          {state.experiences.length === 0 ? (
            <div className="border rounded bg-white p-4 text-gray-600">
              Aucune expérience. Clique sur “Ajouter une expérience”.
            </div>
          ) : (
            <div className="space-y-4">
              {state.experiences.map((exp) => (
                <div key={exp.id} className="border rounded bg-white p-4 space-y-4">
                  {/* Titre / Entreprise */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Titre</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={exp.title}
                        onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Entreprise</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Lieu + Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Lieu</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={exp.location ?? ""}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        placeholder="Ex: Toulon / Remote"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Début</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={exp.startDate ?? ""}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="Ex: 2023 ou 2023-09"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Fin</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={exp.endDate ?? ""}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="Ex: 2024 ou Aujourd’hui"
                      />
                    </div>
                  </div>

                  {/* Tech / Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChipsInput
                      label="Technologies"
                      placeholder="Tape une techno puis Entrée (ex: Python)"
                      values={exp.tech ?? []}
                      onChange={(next) => updateExperience(exp.id, { tech: next })}
                    />
                    <ChipsInput
                      label="Tags"
                      placeholder="Tape un tag puis Entrée (ex: IA)"
                      values={exp.tags ?? []}
                      onChange={(next) => updateExperience(exp.id, { tags: next })}
                    />
                  </div>

                  {/* Bullets + IA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">Missions (bullets)</div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="border rounded px-3 py-1 text-sm"
                          type="button"
                          disabled={!!aiBusyById[exp.id] || (exp.bullets ?? []).every((b) => !b.trim())}
                          onClick={() =>
                            improveBullets({
                              kind: "experience",
                              id: exp.id,
                              title: exp.title,
                              org: exp.company,
                              tech: exp.tech ?? [],
                              bullets: exp.bullets ?? [],
                              mode: "rewrite",
                              apply: (next) => updateExperience(exp.id, { bullets: next }),
                            })
                          }
                        >
                          {aiBusyById[exp.id] ? "IA..." : "✨ Améliorer"}
                        </button>

                        <button
                          className="border rounded px-3 py-1 text-sm"
                          type="button"
                          disabled={!!aiBusyById[exp.id] || (exp.bullets ?? []).every((b) => !b.trim())}
                          onClick={() =>
                            improveBullets({
                              kind: "experience",
                              id: exp.id,
                              title: exp.title,
                              org: exp.company,
                              tech: exp.tech ?? [],
                              bullets: exp.bullets ?? [],
                              mode: "shorten_1page",
                              apply: (next) => updateExperience(exp.id, { bullets: next }),
                            })
                          }
                        >
                          ✨ 1 page
                        </button>

                        <button
                          className="border rounded px-3 py-1 text-sm"
                          type="button"
                          onClick={() => addExperienceBullet(exp.id)}
                        >
                          + Ajouter un bullet
                        </button>
                      </div>
                    </div>

                    {aiMsgById[exp.id] && <div className="text-xs text-gray-600">{aiMsgById[exp.id]}</div>}

                    {(exp.bullets ?? []).length === 0 ? (
                      <div className="text-sm text-gray-600">Aucun bullet.</div>
                    ) : (
                      <div className="space-y-2">
                        {(exp.bullets ?? []).map((b, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              className="border rounded px-3 py-2 w-full"
                              value={b}
                              onChange={(e) => updateExperienceBullet(exp.id, idx, e.target.value)}
                            />
                            <button
                              className="border rounded px-3 py-2 text-sm"
                              type="button"
                              onClick={() => deleteExperienceBullet(exp.id, idx)}
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button className="text-red-600 text-sm" type="button" onClick={() => deleteExperience(exp.id)}>
                      Supprimer l’expérience
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROJETS */}
      {tab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Projets</div>
            <button className="border rounded px-3 py-2 text-sm" onClick={addProject} type="button">
              + Ajouter un projet
            </button>
          </div>

          {state.projects.length === 0 ? (
            <div className="border rounded bg-white p-4 text-gray-600">Aucun projet. Clique sur “Ajouter un projet”.</div>
          ) : (
            <div className="space-y-4">
              {state.projects.map((p) => (
                <div key={p.id} className="border rounded bg-white p-4 space-y-4">
                  {/* Nom / Rôle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Nom du projet</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={p.name}
                        onChange={(e) => updateProject(p.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Rôle</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={p.role ?? ""}
                        onChange={(e) => updateProject(p.id, { role: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Dates + Lien */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Début</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={p.startDate ?? ""}
                        onChange={(e) => updateProject(p.id, { startDate: e.target.value })}
                        placeholder="Ex: 2024 ou 2024-02"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Fin</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={p.endDate ?? ""}
                        onChange={(e) => updateProject(p.id, { endDate: e.target.value })}
                        placeholder="Ex: 2024 ou 2024-06"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Lien</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={p.link ?? ""}
                        onChange={(e) => updateProject(p.id, { link: e.target.value })}
                        placeholder="Ex: https://github.com/..."
                      />
                    </div>
                  </div>

                  {/* Tech / Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChipsInput
                      label="Technologies"
                      placeholder="Tape une techno puis Entrée (ex: Python)"
                      values={p.tech ?? []}
                      onChange={(next) => updateProject(p.id, { tech: next })}
                    />
                    <ChipsInput
                      label="Tags"
                      placeholder="Tape un tag puis Entrée (ex: IA)"
                      values={p.tags ?? []}
                      onChange={(next) => updateProject(p.id, { tags: next })}
                    />
                  </div>

                  {/* Bullets + IA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">Missions (bullets)</div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="border rounded px-3 py-1 text-sm"
                          type="button"
                          disabled={!!aiBusyById[p.id] || (p.bullets ?? []).every((b) => !b.trim())}
                          onClick={() =>
                            improveBullets({
                              kind: "project",
                              id: p.id,
                              title: p.name,
                              org: p.role ?? "",
                              tech: p.tech ?? [],
                              bullets: p.bullets ?? [],
                              mode: "rewrite",
                              apply: (next) => updateProject(p.id, { bullets: next }),
                            })
                          }
                        >
                          {aiBusyById[p.id] ? "IA..." : "✨ Améliorer"}
                        </button>

                        <button
                          className="border rounded px-3 py-1 text-sm"
                          type="button"
                          disabled={!!aiBusyById[p.id] || (p.bullets ?? []).every((b) => !b.trim())}
                          onClick={() =>
                            improveBullets({
                              kind: "project",
                              id: p.id,
                              title: p.name,
                              org: p.role ?? "",
                              tech: p.tech ?? [],
                              bullets: p.bullets ?? [],
                              mode: "shorten_1page",
                              apply: (next) => updateProject(p.id, { bullets: next }),
                            })
                          }
                        >
                          ✨ 1 page
                        </button>

                        <button
                          className="border rounded px-3 py-1 text-sm"
                          type="button"
                          onClick={() => addProjectBullet(p.id)}
                        >
                          + Ajouter un bullet
                        </button>
                      </div>
                    </div>

                    {aiMsgById[p.id] && <div className="text-xs text-gray-600">{aiMsgById[p.id]}</div>}

                    {(p.bullets ?? []).length === 0 ? (
                      <div className="text-sm text-gray-600">Aucun bullet.</div>
                    ) : (
                      <div className="space-y-2">
                        {(p.bullets ?? []).map((b, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              className="border rounded px-3 py-2 w-full"
                              value={b}
                              onChange={(e) => updateProjectBullet(p.id, idx, e.target.value)}
                            />
                            <button
                              className="border rounded px-3 py-2 text-sm"
                              type="button"
                              onClick={() => deleteProjectBullet(p.id, idx)}
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button className="text-red-600 text-sm" type="button" onClick={() => deleteProject(p.id)}>
                      Supprimer le projet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPÉTENCES */}
      {tab === "skills" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Compétences</div>
            <button className="border rounded px-3 py-2 text-sm" onClick={addSkill} type="button">
              + Ajouter une compétence
            </button>
          </div>

          {(state.skills ?? []).length === 0 ? (
            <div className="border rounded bg-white p-4 text-gray-600">
              Aucune compétence. Clique sur “Ajouter une compétence”.
            </div>
          ) : (
            <div className="space-y-3">
              {(state.skills ?? []).map((s) => (
                <div key={s.id} className="border rounded bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium">Compétence</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={s.name}
                        onChange={(e) => updateSkill(s.id, { name: e.target.value })}
                        placeholder="Ex: Python, SQL, Docker…"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Domaine</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={s.domain ?? "Général"}
                        onChange={(e) => updateSkill(s.id, { domain: e.target.value })}
                        placeholder="Ex: Programmation, Data, DevOps…"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <button className="text-red-600 text-sm" onClick={() => deleteSkill(s.id)} type="button">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ LOISIRS (NOUVEAU) */}
      {tab === "hobbies" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Loisirs</div>
            <button className="border rounded px-3 py-2 text-sm" onClick={addHobby} type="button">
              + Ajouter un loisir
            </button>
          </div>

          {(state.hobbies ?? []).length === 0 ? (
            <div className="border rounded bg-white p-4 text-gray-600">
              Aucun loisir. Clique sur “Ajouter un loisir”.
            </div>
          ) : (
            <div className="space-y-3">
              {(state.hobbies ?? []).map((h) => (
                <div key={h.id} className="border rounded bg-white p-4">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2">Loisir</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={h.name}
                        onChange={(e) => updateHobby(h.id, { name: e.target.value })}
                        placeholder="Ex: Musculation, Basket, Photo, Voyage…"
                      />
                    </div>

                    <button
                      className="text-red-600 text-sm"
                      type="button"
                      onClick={() => deleteHobby(h.id)}
                      title="Supprimer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}