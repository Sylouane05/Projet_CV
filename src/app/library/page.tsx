"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import ChipsInput from "@/components/ChipsInput";

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

export default function LibraryPage() {
  const params = useSearchParams();
  const router = useRouter();

  const tab = (params.get("tab") ?? "experiences") as
    | "experiences"
    | "projects"
    | "skills";

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
  } = useAppStore();

  const setTab = (next: "experiences" | "projects" | "skills") => {
    router.replace(`/library?tab=${next}`);
  };

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
      <div className="flex gap-2">
        <TabButton active={tab === "experiences"} onClick={() => setTab("experiences")}>
          Expériences
        </TabButton>
        <TabButton active={tab === "projects"} onClick={() => setTab("projects")}>
          Projets
        </TabButton>
        <TabButton active={tab === "skills"} onClick={() => setTab("skills")}>
          Compétences
        </TabButton>
      </div>

      {/* EXPÉRIENCES */}
      {tab === "experiences" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Expériences</div>
            <button className="border rounded px-3 py-2 text-sm" onClick={addExperience}>
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Missions (bullets)</div>
                      <button
                        className="border rounded px-3 py-1 text-sm"
                        onClick={() => addExperienceBullet(exp.id)}
                      >
                        + Ajouter un bullet
                      </button>
                    </div>

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
                    <button className="text-red-600 text-sm" onClick={() => deleteExperience(exp.id)}>
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
            <button className="border rounded px-3 py-2 text-sm" onClick={addProject}>
              + Ajouter un projet
            </button>
          </div>

          {state.projects.length === 0 ? (
            <div className="border rounded bg-white p-4 text-gray-600">
              Aucun projet. Clique sur “Ajouter un projet”.
            </div>
          ) : (
            <div className="space-y-4">
              {state.projects.map((p) => (
                <div key={p.id} className="border rounded bg-white p-4 space-y-4">
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Missions (bullets)</div>
                      <button
                        className="border rounded px-3 py-1 text-sm"
                        onClick={() => addProjectBullet(p.id)}
                      >
                        + Ajouter un bullet
                      </button>
                    </div>

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
                    <button className="text-red-600 text-sm" onClick={() => deleteProject(p.id)}>
                      Supprimer le projet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ COMPÉTENCES */}
      {tab === "skills" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Compétences</div>
            <button className="border rounded px-3 py-2 text-sm" onClick={addSkill}>
              + Ajouter une compétence
            </button>
          </div>

          {state.skills.length === 0 ? (
            <div className="border rounded bg-white p-4 text-gray-600">
              Aucune compétence. Clique sur “Ajouter une compétence”.
            </div>
          ) : (
            <div className="space-y-3">
              {state.skills.map((s) => (
                <div key={s.id} className="border rounded bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium">Compétence</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={s.name}
                        onChange={(e) => updateSkill(s.id, { name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Domaine</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={s.domain}
                        onChange={(e) => updateSkill(s.id, { domain: e.target.value })}
                        placeholder="Programmation / IA / BDD..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <button className="text-red-600 text-sm" onClick={() => deleteSkill(s.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Ensuite va dans l’onglet <b>CV</b> pour choisir quelles compétences afficher par variant.
          </div>
        </div>
      )}
    </div>
  );
}