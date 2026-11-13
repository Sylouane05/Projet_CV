import { getDb, getStorageScope } from "./db";
import { AppStateSchema, type AppState } from "./schema";

export const DEFAULT_STATE: AppState = AppStateSchema.parse({
  profile: {
    fullName: "",
    headline: "",
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
        accentColor: "#183a3c",
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

export async function loadLocalRecord(scope: string | null = getStorageScope()) {
  const db = await getDb(scope);
  const row = await db.get("app_state", "main");
  if (!row) return { state: structuredClone(DEFAULT_STATE), dirty: false, revision: null, exists: false };
  const parsed = AppStateSchema.safeParse(row.json);
  if (!parsed.success) throw new Error("Les données sauvegardées sont invalides. Elles ont été conservées.");
  return { state: parsed.data, dirty: row.dirty ?? true, revision: row.revision ?? null, exists: true };
}
export async function loadState(): Promise<AppState> { return (await loadLocalRecord()).state; }

export async function saveState(state: AppState): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("app_state", "readwrite");
  const previous = await tx.store.get("main");
  await tx.store.put({ json: state, dirty: true, revision: previous?.revision ?? null }, "main");
  await tx.done;
}
export async function checkpointCloud(scope: string, revision: string, savedState: AppState) {
  const db = await getDb(scope);
  const tx = db.transaction("app_state", "readwrite");
  const row = await tx.store.get("main");
  if (row) await tx.store.put({ ...row, revision, dirty: JSON.stringify(row.json) !== JSON.stringify(savedState) }, "main");
  await tx.done;
}

/** ---------------- ASSETS (photo) ---------------- */
export async function savePhoto(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error("Choisis une image PNG, JPEG ou WebP de moins de 5 Mo.");
  }
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
export async function exportBundle(currentState?: AppState, scope: string | null = getStorageScope()): Promise<ExportBundle> {
  const db = await getDb(scope);
  const state = currentState ?? (await loadLocalRecord(scope)).state;

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
export async function importBundle(bundle: unknown, scope: string | null = getStorageScope(), cleanRevision?: string): Promise<AppState> {
  // tolérant mais safe
  const b = bundle as Partial<ExportBundle>;
  if (!b || typeof b !== "object" || !b.state || b.version !== 1) {
    throw new Error("Fichier de sauvegarde invalide ou version non prise en charge.");
  }
  const nextState = AppStateSchema.parse(b.state);

  const photoId = nextState.profile.photoAssetId;
  const assets = Array.isArray(b.assets) ? b.assets : [];
  const photo = photoId ? assets.find((a) => a?.id === photoId) : null;
  if (photoId && (!photo || typeof photo.dataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,/i.test(photo.dataUrl))) {
    throw new Error("La photo de cette sauvegarde est absente ou invalide.");
  }
  const blob = photo ? dataUrlToBlob(photo.dataUrl) : null;
  if (blob && blob.size > 5 * 1024 * 1024) throw new Error("La photo dépasse la limite de 5 Mo.");
  const finalState: AppState = { ...nextState, updatedAt: Date.now() };
  const db = await getDb(scope);
  const tx = db.transaction(["assets", "app_state"], "readwrite");
  const previous = await tx.objectStore("app_state").get("main");
  const existingPhoto = photoId && cleanRevision !== undefined ? await tx.objectStore("assets").get(photoId) : null;
  const writes: Promise<unknown>[] = [tx.objectStore("app_state").put({ json: finalState, revision: cleanRevision ?? previous?.revision ?? null, dirty: cleanRevision === undefined }, "main")];
  if (photo && blob && !existingPhoto?.blob) writes.push(tx.objectStore("assets").put({
    id: photo.id, type: "photo", blob, mime: blob.type, createdAt: Date.now(),
  }));
  await Promise.all([...writes, tx.done]);
  return finalState;
}
