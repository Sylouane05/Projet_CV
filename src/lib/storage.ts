import { getDb } from "./db";
import { AppStateSchema, type AppState } from "./schema";

export const DEFAULT_STATE: AppState = AppStateSchema.parse({
  profile: {
    fullName: "Ton Nom",
    headline: "Étudiant ingénieur ISEN – Recherche stage PFE (6 mois)",
    city: "",
    mobility: "",
    email: "",
    phone: "",
    links: [],
    summary: "",
    keywords: [],

    education: [],
    languages: [],
    certifications: [],

    photoAssetId: null,
  },
  experiences: [],
  projects: [],
  skills: [],

  resumeVariants: [
    {
      id: crypto.randomUUID(),
      name: "CV Général",
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
        density: "normal",
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
    },
  ],
  updatedAt: Date.now(),
});

export async function loadState(): Promise<AppState> {
  const db = await getDb();
  const row = await db.get("app_state", "main");
  if (!row) return DEFAULT_STATE;

  const parsed = AppStateSchema.safeParse(row.json);
  return parsed.success ? parsed.data : DEFAULT_STATE;
}

export async function saveState(state: AppState): Promise<void> {
  const db = await getDb();
  await db.put("app_state", { json: state }, "main");
}

export async function savePhoto(file: File): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.put("assets", {
    id,
    type: "photo",
    blob: file,
    mime: file.type || "image/jpeg",
    createdAt: Date.now(),
  });
  return id;
}

export async function loadPhoto(assetId: string): Promise<string | null> {
  const db = await getDb();
  const asset = await db.get("assets", assetId);
  if (!asset) return null;
  return URL.createObjectURL(asset.blob);
}

export async function deleteAsset(assetId: string): Promise<void> {
  const db = await getDb();
  await db.delete("assets", assetId);
}