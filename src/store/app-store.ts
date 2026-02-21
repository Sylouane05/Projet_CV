"use client";

import { create } from "zustand";
import { loadState, saveState } from "@/lib/storage";
import type { AppState, Profile, Project, Skill } from "@/lib/schema";

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
}>;

type AppStore = {
  state: AppState | null;
  loading: boolean;

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

  // ✅ skills
  addSkill: () => void;
  updateSkill: (id: string, partial: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;

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

  init: async () => {
    const data = await loadState();
    set({
      state: data,
      loading: false,
      activeVariantId: data.resumeVariants?.[0]?.id ?? null,
    });
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
    saveState(updated);
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

    const updated = {
      ...current,
      experiences: [...current.experiences, newExp],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  updateExperience: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      experiences: current.experiences.map((exp) =>
        exp.id === id ? { ...exp, ...partial } : exp
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  deleteExperience: (id) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      experiences: current.experiences.filter((e) => e.id !== id),
      resumeVariants: current.resumeVariants.map((v) => ({
        ...v,
        selectedExperienceIds: v.selectedExperienceIds.filter((x) => x !== id),
      })),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  addExperienceBullet: (id) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      experiences: current.experiences.map((exp) =>
        exp.id === id ? { ...exp, bullets: [...exp.bullets, ""] } : exp
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  updateExperienceBullet: (id, index, value) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      experiences: current.experiences.map((exp) => {
        if (exp.id !== id) return exp;
        const bullets = exp.bullets.slice();
        bullets[index] = value;
        return { ...exp, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  deleteExperienceBullet: (id, index) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      experiences: current.experiences.map((exp) => {
        if (exp.id !== id) return exp;
        const bullets = exp.bullets.filter((_, i) => i !== index);
        return { ...exp, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  applyExperienceBullets: (id, bullets) => {
    const current = get().state;
    if (!current) return;

    const cleaned = bullets.map((b) => b.trim()).filter(Boolean);

    const updated = {
      ...current,
      experiences: current.experiences.map((exp) =>
        exp.id === id ? { ...exp, bullets: cleaned } : exp
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  // ---------------- PROJECTS ----------------
  addProject: () => {
    const current = get().state;
    if (!current) return;

    const p: Project = {
      id: crypto.randomUUID(),
      name: "Nouveau projet",
      role: "",
      startDate: "",
      endDate: "",
      bullets: [],
      tech: [],
      link: "",
      tags: [],
    };

    const updated = {
      ...current,
      projects: [...current.projects, p],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  updateProject: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      projects: current.projects.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  deleteProject: (id) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      projects: current.projects.filter((p) => p.id !== id),
      resumeVariants: current.resumeVariants.map((v) => ({
        ...v,
        selectedProjectIds: v.selectedProjectIds.filter((x) => x !== id),
      })),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  addProjectBullet: (id) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      projects: current.projects.map((p) =>
        p.id === id ? { ...p, bullets: [...(p.bullets ?? []), ""] } : p
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  updateProjectBullet: (id, index, value) => {
    const current = get().state;
    if (!current) return;

    const updated = {
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
    saveState(updated);
  },

  deleteProjectBullet: (id, index) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      projects: current.projects.map((p) => {
        if (p.id !== id) return p;
        const bullets = (p.bullets ?? []).filter((_, i) => i !== index);
        return { ...p, bullets };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  // ---------------- ✅ SKILLS ----------------
  addSkill: () => {
    const current = get().state;
    if (!current) return;

    const s: Skill = {
      id: crypto.randomUUID(),
      name: "Nouvelle compétence",
      domain: "Programmation",
    };

    const updated = {
      ...current,
      skills: [...(current.skills ?? []), s],
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  updateSkill: (id, partial) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      skills: (current.skills ?? []).map((s) => (s.id === id ? { ...s, ...partial } : s)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  deleteSkill: (id) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      skills: (current.skills ?? []).filter((s) => s.id !== id),
      resumeVariants: current.resumeVariants.map((v) => ({
        ...v,
        selectedSkillIds: (v.selectedSkillIds ?? []).filter((x) => x !== id),
      })),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  // ---------------- VARIANTS ----------------
  activeVariantId: null,
  setActiveVariant: (id) => set({ activeVariantId: id }),

  addVariant: () => {
    const current = get().state;
    if (!current) return;

    const newVariant = {
      id: crypto.randomUUID(),
      name: `CV ${current.resumeVariants.length + 1}`,
      selectedExperienceIds: [],
      selectedProjectIds: [],
      selectedSkillIds: [],
      atsKeywords: [],
      sectionOrder: [
        "SUMMARY",
        "SKILLS",
        "EXPERIENCE",
        "PROJECTS",
        "EDUCATION",
        "LANGUAGES",
        "CERTS",
      ],
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
        },
      },
    };

    const updated = {
      ...current,
      resumeVariants: [...current.resumeVariants, newVariant],
      updatedAt: Date.now(),
    };

    set({ state: updated, activeVariantId: newVariant.id });
    saveState(updated);
  },

  renameVariant: (id, name) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => (v.id === id ? { ...v, name } : v)),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  deleteVariant: (id) => {
    const current = get().state;
    if (!current) return;

    const nextVariants = current.resumeVariants.filter((v) => v.id !== id);
    if (nextVariants.length === 0) return;

    const updated = { ...current, resumeVariants: nextVariants, updatedAt: Date.now() };

    const active = get().activeVariantId;
    const nextActive = active === id ? nextVariants[0].id : active ?? nextVariants[0].id;

    set({ state: updated, activeVariantId: nextActive });
    saveState(updated);
  },

  toggleExperienceInVariant: (variantId, expId) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const exists = v.selectedExperienceIds.includes(expId);
        const selectedExperienceIds = exists
          ? v.selectedExperienceIds.filter((x) => x !== expId)
          : [...v.selectedExperienceIds, expId];
        return { ...v, selectedExperienceIds };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  toggleProjectInVariant: (variantId, projectId) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const exists = v.selectedProjectIds.includes(projectId);
        const selectedProjectIds = exists
          ? v.selectedProjectIds.filter((x) => x !== projectId)
          : [...v.selectedProjectIds, projectId];
        return { ...v, selectedProjectIds };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  toggleSkillInVariant: (variantId, skillId) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const list = v.selectedSkillIds ?? [];
        const exists = list.includes(skillId);
        const selectedSkillIds = exists ? list.filter((x) => x !== skillId) : [...list, skillId];
        return { ...v, selectedSkillIds };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantSelectedExperienceIds: (variantId, ids) => {
    const current = get().state;
    if (!current) return;

    const unique = Array.from(new Set(ids));
    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, selectedExperienceIds: unique } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantSelectedProjectIds: (variantId, ids) => {
    const current = get().state;
    if (!current) return;

    const unique = Array.from(new Set(ids));
    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, selectedProjectIds: unique } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantSelectedSkillIds: (variantId, ids) => {
    const current = get().state;
    if (!current) return;

    const unique = Array.from(new Set(ids));
    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, selectedSkillIds: unique } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantAtsKeywords: (variantId, keywords) => {
    const current = get().state;
    if (!current) return;

    const cleaned = keywords.map((k) => k.trim()).filter(Boolean).slice(0, 20);

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, atsKeywords: cleaned } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantDensity: (variantId, density) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, settings: { ...v.settings, density } } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantAccentColor: (variantId, color) => {
    const current = get().state;
    if (!current) return;

    const safe = (color || "").trim();
    if (!/^#([0-9a-fA-F]{6})$/.test(safe)) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) =>
        v.id === variantId ? { ...v, settings: { ...v.settings, accentColor: safe } } : v
      ),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },

  setVariantVisibility: (variantId, patch) => {
    const current = get().state;
    if (!current) return;

    const updated = {
      ...current,
      resumeVariants: current.resumeVariants.map((v) => {
        if (v.id !== variantId) return v;
        const prev = v.settings?.visibility ?? {};
        return {
          ...v,
          settings: {
            ...v.settings,
            visibility: {
              showLinks: true,
              showSummary: true,
              showSkills: true,
              showAtsKeywords: true,
              showProjects: true,
              showEducation: true,
              showLanguages: true,
              showCertifications: true,
              ...prev,
              ...patch,
            },
          },
        };
      }),
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated);
  },
}));