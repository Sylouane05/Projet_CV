import { openDB, DBSchema, IDBPDatabase } from "idb";

interface CvDbSchema extends DBSchema {
  app_state: {
    key: "main";
    value: { json: unknown };
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

let dbPromise: Promise<IDBPDatabase<CvDbSchema>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CvDbSchema>("cv-builder", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("app_state")) {
          db.createObjectStore("app_state");
        }
        if (!db.objectStoreNames.contains("assets")) {
          const store = db.createObjectStore("assets", { keyPath: "id" });
          store.createIndex("by-type", "type");
        }
      },
    });
  }
  return dbPromise;
}
