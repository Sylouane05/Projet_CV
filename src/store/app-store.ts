"use client";

import { create } from "zustand";
import { loadState, saveState } from "@/lib/storage";
import type { AppState, Profile } from "@/lib/schema";

type AppStore = {
  state: AppState | null;
  loading: boolean;

  init: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => void;
  addExperience: () => void;
  updateExperience: (id: string, partial: any) => void;
  deleteExperience: (id: string) => void;
  addExperienceBullet: (id: string) => void;
  updateExperienceBullet: (id: string, index: number, value: string) => void;
  deleteExperienceBullet: (id: string, index: number) => void;
  applyExperienceBullets: (id: string, bullets: string[]) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  state: null,
  loading: true,

  init: async () => {
    const data = await loadState();
    set({ state: data, loading: false });
  },

  updateProfile: (partial) => {
    const current = get().state;
    if (!current) return;

    const updated: AppState = {
      ...current,
      profile: {
        ...current.profile,
        ...partial,
      },
      updatedAt: Date.now(),
    };

    set({ state: updated });
    saveState(updated); // autosave
  },
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


}));
