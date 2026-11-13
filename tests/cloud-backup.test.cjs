const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", output)((id) => {
    if (id in mocks) return mocks[id];
    if (id === "firebase/storage") throw new Error("Unexpected Storage request");
    return require(id);
  }, module, module.exports);
  return module.exports;
}
const photoHelpers = load("src/lib/cloud-photo.ts");
const { AppStateSchema } = load("src/lib/schema.ts");
const photo = { id: "photo-test", type: "photo", mime: "image/jpeg", dataUrl: "data:image/jpeg;base64,/9j/2Q==", createdAt: 1 };
function setup({ remote = null, localPhoto = photo, prepare = async (p) => p, uid = "A" } = {}) {
  const auth = { currentUser: { uid } };
  const writes = [];
  const scopes = [];
  const api = load("src/lib/cloud-backup.ts", {
    "firebase/firestore": {
      doc: (_db, ...path) => path.join("/"),
      getDocFromServer: async () => ({ exists: () => remote !== null, data: () => remote }),
      runTransaction: async (_db, task) => task({ get: async () => ({ data: () => remote }), set: (path, data) => writes.push({ path, data }) }),
    },
    "./firebase": { firebaseServices: () => ({ auth, db: {} }) },
    "./storage": { exportBundle: async (state, scope) => { scopes.push(scope); return { version: 1, state, assets: state.profile.photoAssetId && localPhoto ? [localPhoto] : [] }; } },
    "./schema": { AppStateSchema },
    "./cloud-photo": { ...photoHelpers, prepareCloudPhoto: prepare },
  });
  const state = AppStateSchema.parse(require("./fixtures/resume.cjs")());
  state.profile.photoAssetId = photo.id;
  return { ...api, state, writes, scopes, auth };
}

test("photo and CV commit atomically to the private Firestore document without Storage", async () => {
  const api = setup();
  const saved = await api.saveCloud("A", api.state, null);
  assert.equal(api.writes.length, 1);
  assert.equal(api.writes[0].path, "users/A/backups/main");
  assert.equal(api.writes[0].data.version, 2);
  assert.deepEqual(api.writes[0].data.photo, photo);
  assert.deepEqual(api.writes[0].data.state, api.state);
  assert.equal(saved.photo.path, null);
  assert.deepEqual(api.scopes, ["A"]);
});

test("inline photo restores on a new device without any local photo or Storage", async () => {
  const seed = setup();
  const api = setup({ remote: { version: 2, state: seed.state, photo, photoPath: null, revision: "r1" }, localPhoto: null });
  const restored = await api.restoreCloud("A");
  assert.deepEqual(restored.bundle.assets, [photo]);
  assert.equal(restored.revision, "r1");
  assert.deepEqual(api.scopes, []);
});

test("legacy snapshots can migrate using the original photo already on this account's device", async () => {
  const seed = setup();
  const api = setup({ remote: { version: 1, state: seed.state, photoPath: "users/A/photos/old", revision: "r1" } });
  const restored = await api.restoreCloud("A");
  assert.deepEqual(restored.bundle.assets, [photo]);
  await api.saveCloud("A", restored.bundle.state, "r1");
  assert.equal(api.writes[0].data.version, 2);
});

test("missing or corrupt photos and oversized documents never overwrite a backup", async () => {
  const missing = setup({ localPhoto: null });
  await assert.rejects(missing.saveCloud("A", missing.state, null), /photo locale/);
  assert.equal(missing.writes.length, 0);
  const invalid = setup({ prepare: async () => { throw new Error("Invalid photo"); } });
  await assert.rejects(invalid.saveCloud("A", invalid.state, null), /Invalid photo/);
  assert.equal(invalid.writes.length, 0);
  const large = setup();
  large.state.profile.summary = "é".repeat(460000);
  await assert.rejects(large.saveCloud("A", large.state, null), /taille/);
  assert.equal(large.writes.length, 0);
  assert.throws(() => photoHelpers.readInlinePhoto({ ...photo, id: "another" }, photo.id), /invalide/);
  assert.throws(() => photoHelpers.readInlinePhoto({ ...photo, dataUrl: "data:image/svg+xml;base64,AAAA" }, photo.id), /invalide/);
});

test("conflicts and account changes still prevent a write", async () => {
  const api = setup({ remote: { revision: "newer" } });
  await assert.rejects(api.saveCloud("A", api.state, "old"), api.CloudConflictError);
  assert.equal(api.writes.length, 0);
  const changed = setup({ prepare: async (p) => { changed.auth.currentUser = { uid: "B" }; return p; } });
  await assert.rejects(changed.saveCloud("A", changed.state, null), /compte a changé/);
  assert.equal(changed.writes.length, 0);
});

test("removing a photo and restoring legacy text-only CVs remain supported", async () => {
  const api = setup();
  api.state.profile.photoAssetId = null;
  await api.saveCloud("A", api.state, null);
  assert.equal(api.writes[0].data.photo, null);
  const legacy = setup({ remote: { version: 1, state: api.state, photoPath: null, revision: "r1" } });
  assert.deepEqual((await legacy.restoreCloud("A")).bundle.assets, []);
});

test("cloud restoration preserves a local original while explicit JSON import replaces it", async () => {
  const original = new Blob(["original local pixels"], { type: "image/png" });
  const rows = new Map([[photo.id, { id: photo.id, blob: original }]]);
  const store = { get: async (key) => rows.get(key), put: async (value, key) => rows.set(key ?? value.id, value) };
  const db = { transaction: () => ({ objectStore: () => store, done: Promise.resolve() }) };
  const { importBundle } = load("src/lib/storage.ts", {
    "./db": { getDb: async () => db, getStorageScope: () => "A" },
    "./schema": { AppStateSchema },
  });
  const state = setup().state;
  const bundle = { version: 1, state, assets: [photo] };
  await importBundle(bundle, "A", "r1");
  assert.equal(rows.get(photo.id).blob, original);
  await importBundle(bundle, "A");
  assert.notEqual(rows.get(photo.id).blob, original);
  assert.equal(rows.get(photo.id).blob.type, "image/jpeg");
});
