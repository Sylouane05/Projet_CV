import { getDb } from "./db";
import { AppStateSchema, type AppState } from "./schema";

// =========================
// Backup / Restore bundle
// =========================

export type ExportBundleV1 = {
  version: 1;
  exportedAt: number;
  state: AppState;
  assets: Record<
    string,
    {
      type: "photo";
      mime: string;
      createdAt: number;
      dataUrl: string; // base64 data url
    }
  >;
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  const m = /^data:([^;]+);base64,(.*)$/i.exec(dataUrl);
  if (!m) throw new Error("Invalid dataUrl");
  const mime = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), mime };
}

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

/**
 * Exporte un bundle JSON contenant:
 * - l'AppState
 * - les assets nécessaires (actuellement: photo)
 */
export async function exportBundle(): Promise<ExportBundleV1> {
  const state = await loadState();
  const db = await getDb();

  const assets: ExportBundleV1["assets"] = {};

  // On exporte la photo si présente
  const photoId = state.profile.photoAssetId;
  if (photoId) {
    const asset = await db.get("assets", photoId);
    if (asset) {
      assets[photoId] = {
        type: "photo",
        mime: asset.mime,
        createdAt: asset.createdAt,
        dataUrl: await blobToDataUrl(asset.blob),
      };
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
 * Importe un bundle JSON (remplacement complet).
 * - valide le state via AppStateSchema
 * - restaure les assets (photo)
 * - sauvegarde dans IndexedDB
 */
export async function importBundle(bundle: unknown): Promise<AppState> {
  if (!bundle || typeof bundle !== "object") throw new Error("Bundle invalide");

  const b = bundle as Partial<ExportBundleV1>;
  if (b.version !== 1) throw new Error("Version de bundle non supportée");
  if (!b.state) throw new Error("Bundle incomplet (state manquant)");

  const parsed = AppStateSchema.safeParse(b.state);
  if (!parsed.success) throw new Error("Données invalides (state)");

  const nextState = parsed.data;
  const db = await getDb();

  // Restaure les assets
  const assets = (b.assets ?? {}) as ExportBundleV1["assets"];
  for (const [id, meta] of Object.entries(assets)) {
    if (!meta?.dataUrl) continue;
    try {
      const { blob, mime } = dataUrlToBlob(meta.dataUrl);
      await db.put("assets", {
        id,
        type: "photo",
        blob,
        mime: meta.mime || mime,
        createdAt: meta.createdAt || Date.now(),
      });
    } catch {
      // on ignore si un asset échoue, le state s'importe quand même
    }
  }

  const finalState = { ...nextState, updatedAt: Date.now() };
  await saveState(finalState);
  return finalState;
}