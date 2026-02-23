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
    linkedinUsername: "",
  },
  experiences: [],
  projects: [],
  skills: [],
  hobbies: [],
  resumeVariants: [
    {
      id: crypto.randomUUID(),
      name: "CV Général",
      selectedExperienceIds: [],
      selectedProjectIds: [],
      selectedSkillIds: [],
      atsKeywords: [],
      sectionOrder: ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "LANGUAGES", "CERTS", "HOBBIES"],
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
          showHobbies: true,
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

/** ---------------- ASSETS (photo) ---------------- */
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

/** ---------------- EXPORT / IMPORT JSON ---------------- */
type ExportedAsset = {
  id: string;
  type: "photo" | string;
  mime: string;
  createdAt: number;
  dataUrl: string; // base64
};

export type ExportBundle = {
  version: number;
  exportedAt: number;
  state: AppState;
  assets: ExportedAsset[];
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read failed"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",", 2);
  const mimeMatch = /data:([^;]+);base64/i.exec(meta);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";

  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * ✅ Export: état + assets nécessaires (photo si présente)
 */
export async function exportBundle(): Promise<ExportBundle> {
  const db = await getDb();
  const state = await loadState();

  const assets: ExportedAsset[] = [];

  const photoId = state.profile.photoAssetId;
  if (photoId) {
    const asset = await db.get("assets", photoId);
    if (asset?.blob) {
      assets.push({
        id: asset.id,
        type: asset.type,
        mime: asset.mime ?? "image/jpeg",
        createdAt: asset.createdAt ?? Date.now(),
        dataUrl: await blobToDataUrl(asset.blob),
      });
    }
  }

  return {
    version: 1,
    exportedAt: Date.now(),
    state,
    assets,
  };
}

/**
 * ✅ Import: réinjecte état + assets (photo)
 * - réécrit app_state
 * - restaure assets en conservant les mêmes ids
 */
export async function importBundle(bundle: unknown): Promise<AppState> {
  // tolérant mais safe
  const b = bundle as Partial<ExportBundle>;
  const nextState = AppStateSchema.parse(b.state ?? DEFAULT_STATE);

  const db = await getDb();

  // Restore assets
  const assets = Array.isArray(b.assets) ? b.assets : [];
  for (const a of assets) {
    if (!a?.id || !a?.dataUrl) continue;
    try {
      const blob = dataUrlToBlob(a.dataUrl);
      await db.put("assets", {
        id: a.id,
        type: a.type ?? "photo",
        blob,
        mime: a.mime ?? blob.type ?? "image/jpeg",
        createdAt: a.createdAt ?? Date.now(),
      });
    } catch {
      // ignore asset failure, state still restored
    }
  }

  const finalState: AppState = {
    ...nextState,
    updatedAt: Date.now(),
  };

  await saveState(finalState);
  return finalState;
}