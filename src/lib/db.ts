import { openDB, DBSchema, IDBPDatabase } from "idb";

interface CvDbSchema extends DBSchema {
  app_state: {
    key: "main";
    value: { json: unknown; revision?: string | null; dirty?: boolean };
  };
  assets: {
    key: string; // assetId
    value: {
      id: string;
      type: "photo";
      blob: Blob;
      mime: string;
      createdAt: number;
    };
    indexes: { "by-type": "photo" };
  };
}

let activeScope: string | null = null;
const databases = new Map<string, Promise<IDBPDatabase<CvDbSchema>>>();
export function selectStorageScope(uid: string | null) { activeScope = uid; }
export function getStorageScope() { return activeScope; }
export function getDb(scope: string | null = activeScope) {
  // Preserve the old database as the guest workspace. Account data never enters it.
  const name = scope === null ? "cv-builder" : `cv-builder-user-${encodeURIComponent(scope)}`;
  let promise = databases.get(name);
  if (!promise) {
    promise = openDB<CvDbSchema>(name, 1, {
      upgrade(db) {
        db.createObjectStore("app_state");
        const assets = db.createObjectStore("assets", { keyPath: "id" });
        assets.createIndex("by-type", "type");
      },
    });
    databases.set(name, promise);
  }
  return promise;
}
