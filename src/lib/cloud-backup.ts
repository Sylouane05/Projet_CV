import { doc, getDocFromServer, runTransaction } from "firebase/firestore";
import { firebaseServices } from "./firebase";
import { AppStateSchema, type AppState } from "./schema";
import { exportBundle, type ExportBundle } from "./storage";
import { assertCloudDocumentSize, prepareCloudPhoto, readInlinePhoto } from "./cloud-photo";

export async function cloudSnapshot(uid: string) {
  const { auth, db } = firebaseServices();
  if (auth.currentUser?.uid !== uid) throw new Error("Reconnecte-toi pour continuer.");
  return getDocFromServer(doc(db, "users", uid, "backups", "main"));
}

export class CloudConflictError extends Error {}
export type CloudPhoto = { id: string | null; path: string | null };
export async function saveCloud(uid: string, state: AppState, revision: string | null) {
  const { auth, db } = firebaseServices();
  if (auth.currentUser?.uid !== uid) throw new Error("Reconnecte-toi pour continuer.");
  const bundle = await exportBundle(state, uid);
  const photo = bundle.assets[0];
  if (bundle.state.profile.photoAssetId && !photo) throw new Error("La photo locale est introuvable.");
  const inlinePhoto = photo ? await prepareCloudPhoto(photo) : null;
  if (auth.currentUser?.uid !== uid) throw new Error("Le compte a changé.");
  const nextRevision = crypto.randomUUID();
  const data = { version: 2, state: bundle.state, photo: inlinePhoto, photoPath: null, revision: nextRevision, savedAt: Date.now() };
  assertCloudDocumentSize(data);
  await runTransaction(db, async (tx) => {
    const target = doc(db, "users", uid, "backups", "main");
    const existing = await tx.get(target);
    if ((existing.data()?.revision ?? null) !== revision) {
      throw new CloudConflictError("La sauvegarde a changé sur un autre appareil. Recharge son état avant de réessayer.");
    }
    if (auth.currentUser?.uid !== uid) throw new Error("Le compte a changé.");
    tx.set(target, data);
  });
  return { revision: nextRevision, photo: { id: state.profile.photoAssetId, path: null } };
}

export async function restoreCloud(uid: string) {
  const snapshot = await cloudSnapshot(uid);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.version !== 1 && data.version !== 2) throw new Error("Version de sauvegarde non prise en charge. Le CV local a été conservé.");
  const state = AppStateSchema.parse(data.state);
  const assets: ExportBundle["assets"] = [];
  if (state.profile.photoAssetId) {
    if (data.version === 2) {
      assets.push(readInlinePhoto(data.photo, state.profile.photoAssetId));
    } else {
      // An original already present on this account's device avoids the old paid service.
      const localPhoto = (await exportBundle(state, uid)).assets[0];
      if (localPhoto) {
        assets.push(localPhoto);
      } else {
        if (typeof data.photoPath !== "string" || !data.photoPath.startsWith(`users/${uid}/photos/`)) {
          throw new Error("La photo sauvegardée est invalide.");
        }
        // Compatibility only: new saves never upload to Firebase Storage.
        const { getBytes, getStorage, ref } = await import("firebase/storage");
        const bytes = await getBytes(ref(getStorage(), data.photoPath), 5 * 1024 * 1024);
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
    }
  }
  const bundle: ExportBundle = { version: 1, exportedAt: Date.now(), state, assets };
  if (typeof data.revision !== "string") throw new Error("Version de sauvegarde invalide.");
  return { bundle, revision: data.revision, photo: { id: state.profile.photoAssetId, path: data.photoPath as string | null } };
}
