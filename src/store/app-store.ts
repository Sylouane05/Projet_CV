"use client";

import { create } from "zustand";
import { getStorageScope } from "@/lib/db";
import { saveState } from "@/lib/storage";
import type { AppState, Profile, Project, Skill, Hobby, ResumeVariant } from "@/lib/schema";

import type { Account, SyncPhase } from "@/lib/sync-engine";

type Density = "compact" | "normal" | "airy";

type VisibilityPatch = Partial<{
  showLinks: boolean;
  showSummary: boolean;
  showSkills: boolean;
  showAtsKeywords: boolean;
  showProjects: boolean;
  showEducation: boolean;
  showLanguages: boolean;
  showCertifications: boolean;
  showHobbies: boolean;
}>;

type AppStore = {
  state: AppState | null;
  loading: boolean;
  saveError: string | null;
  account: Account | null;
  syncPhase: SyncPhase;
  syncMessage: string | null;
  replaceState: (state: AppState) => Promise<void>;

  init: () => Promise<void>;

  updateProfile: (profile: Partial<Profile>) => void;

  // experiences
  addExperience: () => void;
  updateExperience: (id: string, partial: any) => void;
  deleteExperience: (id: string) => void;

  addExperienceBullet: (id: string) => void;
  updateExperienceBullet: (id: string, index: number, value: string) => void;
  deleteExperienceBullet: (id: string, index: number) => void;
  applyExperienceBullets: (id: string, bullets: string[]) => void;

  // projects
  addProject: () => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addProjectBullet: (id: string) => void;
  updateProjectBullet: (id: string, index: number, value: string) => void;
  deleteProjectBullet: (id: string, index: number) => void;

  // skills
  addSkill: () => void;
  updateSkill: (id: string, partial: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;

  // ✅ hobbies
  addHobby: () => void;
  updateHobby: (id: string, partial: Partial<Hobby>) => void;
  deleteHobby: (id: string) => void;

  // variants
  activeVariantId: string | null;
  setActiveVariant: (id: string) => void;

  addVariant: () => void;
  renameVariant: (id: string, name: string) => void;
  deleteVariant: (id: string) => void;

  toggleExperienceInVariant: (variantId: string, expId: string) => void;
  toggleProjectInVariant: (variantId: string, projectId: string) => void;
  toggleSkillInVariant: (variantId: string, skillId: string) => void;

  setVariantSelectedExperienceIds: (variantId: string, ids: string[]) => void;
  setVariantSelectedProjectIds: (variantId: string, ids: string[]) => void;
  setVariantSelectedSkillIds: (variantId: string, ids: string[]) => void;

  setVariantAtsKeywords: (variantId: string, keywords: string[]) => void;

  setVariantDensity: (variantId: string, density: Density) => void;
  setVariantAccentColor: (variantId: string, color: string) => void;
  setVariantVisibility: (variantId: string, patch: VisibilityPatch) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  state: null,
  loading: true,
  saveError: null,
  account: null,
  syncPhase: "loading",
  syncMessage: null,
  replaceState: async (state) => {
    const scope = getStorageScope();
    await saveState(state);
    if (scope !== getStorageScope()) return;
    set({ state, saveError: null, activeVariantId: state.resumeVariants[0]?.id ?? null });
  },

  init: async () => {
    const { startCloudSync } = await import("@/lib/cloud-sync");
    startCloudSync();
  },

  updateProfile: (partial) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      profile: { ...current.profile, ...partial },
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  // ---------------- EXPERIENCES ----------------
  addExperience: () => {
    const current = get().state;
    if (!current) return;

    const newExp = {
      id: crypto.randomUUID(),
      title: "Nouvelle expérience",
      company: "Entreprise",
      location: "",
      startDate: "",
      endDate: "",
      bullets: [],
      tech: [],
      tags: [],
    };

    const updated: AppState = {
      ...current,
      experiences: [...current.experiences, newExp],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  updateExperience: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      experiences: current.experiences.map((exp) => (exp.id === id ? { ...exp, ...partial } : exp)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteExperience: (id) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      experiences: current.experiences.filter((e) => e.id !== id),
      resumeVariants: current.resumeVariants.map((v) => ({
        ...v,
        selectedExperienceIds: v.selectedExperienceIds.filter((x) => x !== id),
      })),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  addExperienceBullet: (id) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      experiences: current.experiences.map((exp) =>
        exp.id === id ? { ...exp, bullets: [...(exp.bullets ?? []), ""] } : exp
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  updateExperienceBullet: (id, index, value) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      experiences: current.experiences.map((exp) => {
        if (exp.id !== id) return exp;
        const bullets = (exp.bullets ?? []).slice();
        bullets[index] = value;
        return { ...exp, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteExperienceBullet: (id, index) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      experiences: current.experiences.map((exp) => {
        if (exp.id !== id) return exp;
        const bullets = (exp.bullets ?? []).filter((_, i) => i !== index);
        return { ...exp, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  applyExperienceBullets: (id, bullets) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      experiences: current.experiences.map((exp) => (exp.id === id ? { ...exp, bullets } : exp)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  // ---------------- PROJECTS ----------------
  addProject: () => {
    const current = get().state;
    if (!current) return;

    const pr = {
      id: crypto.randomUUID(),
      name: "Nouveau projet",
      role: "",
      startDate: "",
      endDate: "",
      link: "",
      bullets: [],
      tech: [],
      tags: [],
    };

    const updated: AppState = {
      ...current,
      projects: [...current.projects, pr],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  updateProject: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      projects: current.projects.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteProject: (id) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      projects: current.projects.filter((p) => p.id !== id),
      resumeVariants: current.resumeVariants.map((v) => ({
        ...v,
        selectedProjectIds: v.selectedProjectIds.filter((x) => x !== id),
      })),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  addProjectBullet: (id) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      projects: current.projects.map((p) => (p.id === id ? { ...p, bullets: [...(p.bullets ?? []), ""] } : p)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  updateProjectBullet: (id, index, value) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      projects: current.projects.map((p) => {
        if (p.id !== id) return p;
        const bullets = (p.bullets ?? []).slice();
        bullets[index] = value;
        return { ...p, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteProjectBullet: (id, index) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      projects: current.projects.map((p) => {
        if (p.id !== id) return p;
        const bullets = (p.bullets ?? []).filter((_, i) => i !== index);
        return { ...p, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  // ---------------- SKILLS ----------------
  addSkill: () => {
    const current = get().state;
    if (!current) return;

    const s: Skill = {
      id: crypto.randomUUID(),
      name: "Nouvelle compétence",
      domain: "Général",
      level: "",
    };

    const updated: AppState = {
      ...current,
      skills: [...(current.skills ?? []), s],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  updateSkill: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      skills: (current.skills ?? []).map((s) => (s.id === id ? { ...s, ...partial } : s)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteSkill: (id) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      skills: (current.skills ?? []).filter((s) => s.id !== id),
      resumeVariants: current.resumeVariants.map((v) => ({
        ...v,
        selectedSkillIds: (v.selectedSkillIds ?? []).filter((x) => x !== id),
      })),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  // ---------------- HOBBIES ----------------
  addHobby: () => {
    const current = get().state;
    if (!current) return;

    const h: Hobby = {
      id: crypto.randomUUID(),
      name: "Nouveau loisir",
    };

    const updated: AppState = {
      ...current,
      hobbies: [...(current.hobbies ?? []), h],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  updateHobby: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      hobbies: (current.hobbies ?? []).map((h) => (h.id === id ? { ...h, ...partial } : h)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteHobby: (id) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      hobbies: (current.hobbies ?? []).filter((h) => h.id !== id),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  // ---------------- VARIANTS ----------------
  activeVariantId: null,

  setActiveVariant: (id) => set({ activeVariantId: id }),

  addVariant: () => {
    const current = get().state;
    if (!current) return;

    const v: ResumeVariant = {
      id: crypto.randomUUID(),
      name: `CV ${current.resumeVariants.length + 1}`,
      selectedExperienceIds: [],
      selectedProjectIds: [],
      selectedSkillIds: [],
      atsKeywords: [],
      sectionOrder: ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "LANGUAGES", "CERTS", "HOBBIES"],
      settings: {
        accentColor: "#2563eb",
        font: "inter",
        density: "normal" as Density,
        skillLevels: false,
        visibility: {
          showLinks: true,
          showSummary: true,
          showSkills: true,
          showAtsKeywords: true,
          showProjects: true,
          showEducation: true,
          showLanguages: true,
          showCertifications: true,
          showHobbies: true,
        },
      },
    };

    const updated: AppState = {
      ...current,
      resumeVariants: [...current.resumeVariants, v],
      updatedAt: Date.now(),
    };

    set({ state: updated, activeVariantId: v.id });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  renameVariant: (id, name) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => (v.id === id ? { ...v, name } : v)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  deleteVariant: (id) => {
    const current = get().state;
    if (!current) return;

    const next = current.resumeVariants.filter((v) => v.id !== id);
    const updated: AppState = {
      ...current,
      resumeVariants: next.length ? next : current.resumeVariants,
      updatedAt: Date.now(),
    };

    set({
      state: updated,
      activeVariantId: updated.resumeVariants?.[0]?.id ?? null,
    });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  toggleExperienceInVariant: (variantId, expId) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const setIds = new Set(v.selectedExperienceIds ?? []);
        if (setIds.has(expId)) setIds.delete(expId);
        else setIds.add(expId);
        return { ...v, selectedExperienceIds: Array.from(setIds) };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  toggleProjectInVariant: (variantId, projectId) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const setIds = new Set(v.selectedProjectIds ?? []);
        if (setIds.has(projectId)) setIds.delete(projectId);
        else setIds.add(projectId);
        return { ...v, selectedProjectIds: Array.from(setIds) };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  toggleSkillInVariant: (variantId, skillId) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const setIds = new Set(v.selectedSkillIds ?? []);
        if (setIds.has(skillId)) setIds.delete(skillId);
        else setIds.add(skillId);
        return { ...v, selectedSkillIds: Array.from(setIds) };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantSelectedExperienceIds: (variantId, ids) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => (v.id === variantId ? { ...v, selectedExperienceIds: ids } : v)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantSelectedProjectIds: (variantId, ids) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => (v.id === variantId ? { ...v, selectedProjectIds: ids } : v)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantSelectedSkillIds: (variantId, ids) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => (v.id === variantId ? { ...v, selectedSkillIds: ids } : v)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantAtsKeywords: (variantId, keywords) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => (v.id === variantId ? { ...v, atsKeywords: keywords } : v)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantDensity: (variantId, density) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, settings: { ...v.settings, density } } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantAccentColor: (variantId, color) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, settings: { ...v.settings, accentColor: color } } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },

  setVariantVisibility: (variantId, patch) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const prev = v.settings?.visibility ?? {};
        return {
          ...v,
          settings: {
            ...v.settings,
            visibility: { ...prev, ...patch },
          },
        };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    void saveState(updated).then(
      () => { if (get().state === updated) set({ saveError: null }); },
      () => { if (get().state === updated) set({ saveError: "Sauvegarde impossible. Exporte tes données avant de quitter cette page." }); }
    );
  },
}));