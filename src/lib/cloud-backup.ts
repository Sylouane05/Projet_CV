import { doc, getDocFromServer, runTransaction } from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { firebaseServices } from "./firebase";
import { AppStateSchema, type AppState } from "./schema";
import { exportBundle, type ExportBundle } from "./storage";

export async function cloudSnapshot(uid: string) {
  const { auth, db } = firebaseServices();
  if (auth.currentUser?.uid !== uid) throw new Error("Reconnecte-toi pour continuer.");
  return getDocFromServer(doc(db, "users", uid, "backups", "main"));
}

export class CloudConflictError extends Error {}
export type CloudPhoto = { id: string | null; path: string | null };
export async function saveCloud(uid: string, state: AppState, revision: string | null, previousPhoto?: CloudPhoto) {
  const { auth, db, storage } = firebaseServices();
  if (auth.currentUser?.uid !== uid) throw new Error("Reconnecte-toi pour continuer.");
  const bundle = await exportBundle(state);
  if (new TextEncoder().encode(JSON.stringify(bundle.state)).length > 800000) {
    throw new Error("Ce CV est trop volumineux pour la sauvegarde en ligne.");
  }
  let photoPath: string | null = null;
  const photo = bundle.assets[0];
  if (bundle.state.profile.photoAssetId && !photo) throw new Error("La photo locale est introuvable.");
  if (photo && previousPhoto?.id === photo.id && previousPhoto.path) {
    photoPath = previousPhoto.path;
  } else if (photo) {
    const blob = await (await fetch(photo.dataUrl)).blob();
    photoPath = `users/${uid}/photos/${crypto.randomUUID()}`;
    await uploadBytes(ref(storage, photoPath), blob, { contentType: blob.type });
  }
  if (auth.currentUser?.uid !== uid) throw new Error("Le compte a changé.");
  const nextRevision = crypto.randomUUID();
  await runTransaction(db, async (tx) => {
    const target = doc(db, "users", uid, "backups", "main");
    const existing = await tx.get(target);
    if ((existing.data()?.revision ?? null) !== revision) {
      throw new CloudConflictError("La sauvegarde a changé sur un autre appareil. Recharge son état avant de réessayer.");
    }
    tx.set(target, { version: 1, state: bundle.state, photoPath, revision: nextRevision, savedAt: Date.now() });
  });
  return { revision: nextRevision, photo: { id: state.profile.photoAssetId, path: photoPath } };
}

export async function restoreCloud(uid: string) {
  const snapshot = await cloudSnapshot(uid);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const state = AppStateSchema.parse(data.state);
  const assets: ExportBundle["assets"] = [];
  if (state.profile.photoAssetId) {
    if (typeof data.photoPath !== "string" || !data.photoPath.startsWith(`users/${uid}/photos/`)) {
      throw new Error("La photo sauvegardée est invalide.");
    }
    const bytes = await getBytes(ref(firebaseServices().storage, data.photoPath), 5 * 1024 * 1024);
    const blob = new Blob([bytes]);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Impossible de lire la photo."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
    // Detect supported image signatures rather than trusting a stored MIME value.
    const header = new Uint8Array(bytes);
    const mime = header[0] === 137 && header[1] === 80 ? "image/png" : header[0] === 255 && header[1] === 216 ? "image/jpeg" : header[0] === 82 && header[8] === 87 ? "image/webp" : null;
    if (!mime) throw new Error("Format de photo invalide.");
    assets.push({ id: state.profile.photoAssetId, type: "photo", mime, createdAt: Date.now(), dataUrl: dataUrl.replace(/^data:[^;]+;/, `data:${mime};`) });
  }
  const bundle: ExportBundle = { version: 1, exportedAt: Date.now(), state, assets };
  if (typeof data.revision !== "string") throw new Error("Version de sauvegarde invalide.");
  return { bundle, revision: data.revision, photo: { id: state.profile.photoAssetId, path: data.photoPath as string | null } };
}
