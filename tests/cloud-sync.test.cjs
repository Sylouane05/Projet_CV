const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const output = ts.transpileModule(fs.readFileSync("src/lib/sync-engine.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const engineModule = { exports: {} };
new Function("require", "module", "exports", output)(require, engineModule, engineModule.exports);
const { SyncEngine, syncErrorMessage } = engineModule.exports;
const state = (name) => ({ profile: { fullName: name }, updatedAt: 1 });
const local = (name, dirty = false, revision = null) => ({ state: state(name), dirty, revision });
const remote = (name, revision = "r1") => ({ bundle: { state: state(name) }, revision, photo: { id: null, path: null } });
const tick = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));
function deferred() { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; }
function setup(overrides = {}) {
  const calls = { views: [], saves: [], installs: [], checkpoints: [], scopes: [] };
  const deps = {
    selectScope: (uid) => calls.scopes.push(uid),
    loadLocal: async () => local("local"),
    loadRemote: async () => remote("cloud"),
    install: async (bundle, uid) => { calls.installs.push(uid); return bundle.state; },
    checkpoint: async (...args) => calls.checkpoints.push(args),
    save: async (...args) => { calls.saves.push(args); return { revision: "r2", photo: { id: null, path: null } }; },
    isConflict: (error) => error.message === "conflict",
    render: (view) => calls.views.push(view),
    ...overrides,
  };
  const engine = new SyncEngine(deps, 5);
  return { engine, calls, latest: () => calls.views.at(-1) };
}

test("photo transfer errors explain the failed sync without claiming a cloud save", async () => {
  const error = Object.assign(new Error("Firebase Storage: Max retry time for operation exceeded"), { code: "storage/retry-limit-exceeded" });
  const { engine, calls, latest } = setup({ save: async () => { throw error; } });
  await engine.activate({ uid: "A", email: null });
  const edited = state("pending photo");
  engine.changed(edited);
  await engine.saveNow();
  assert.equal(latest().syncPhase, "error");
  assert.equal(latest().state, edited);
  assert.equal(calls.checkpoints.length, 0);
  assert.match(latest().syncMessage, /photo/);
  assert.match(latest().syncMessage, /n’a pas abouti/);
  assert.doesNotMatch(latest().syncMessage, /Max retry time/);
  engine.stop();
});

test("storage diagnostics distinguish setup, permission, quota and timeout", () => {
  assert.match(syncErrorMessage({ code: "storage/bucket-not-found" }), /n’est pas configuré/);
  assert.match(syncErrorMessage({ code: "storage/unauthorized" }), /règles d’accès de Firebase Storage/);
  assert.match(syncErrorMessage({ code: "storage/quota-exceeded" }), /quota et le forfait/);
  assert.match(syncErrorMessage({ code: "permission-denied" }), /Firestore/);
});
test("sign-in loads cloud data without saving defaults", async () => {
  const { engine, calls, latest } = setup();
  await engine.activate({ uid: "A", email: null });
  assert.equal(latest().state.profile.fullName, "cloud");
  assert.equal(latest().syncPhase, "saved");
  assert.equal(calls.saves.length, 0);
  engine.stop();
});
test("rapid edits are coalesced and use the loaded revision", async () => {
  const { engine, calls, latest } = setup();
  await engine.activate({ uid: "A", email: null });
  engine.changed(state("first")); engine.changed(state("last"));
  await tick();
  assert.equal(calls.saves.length, 1);
  assert.equal(calls.saves[0][1].profile.fullName, "last");
  assert.equal(calls.saves[0][2], "r1");
  assert.equal(latest().syncPhase, "saved");
  engine.stop();
});
test("late account responses cannot display another user's CV", async () => {
  const pending = deferred();
  const { engine, calls, latest } = setup({ loadRemote: (uid) => uid === "A" ? pending.promise : Promise.resolve(remote("B")) });
  const loadingA = engine.activate({ uid: "A", email: null });
  await tick(0);
  await engine.activate({ uid: "B", email: null });
  pending.resolve(remote("A")); await loadingA;
  assert.equal(latest().account.uid, "B");
  assert.equal(latest().state.profile.fullName, "B");
  assert.deepEqual(calls.installs, ["B"]);
  engine.stop();
});
test("unsent edits and a changed remote revision require a choice", async () => {
  const { engine, calls, latest } = setup({ loadLocal: async () => local("unsent", true, "old") });
  await engine.activate({ uid: "A", email: null });
  assert.equal(latest().syncPhase, "conflict");
  assert.equal(latest().state.profile.fullName, "unsent");
  await engine.saveNow(); await tick();
  assert.equal(calls.saves.length, 0);
  assert.equal(calls.installs.length, 0);
  engine.stop();
});
test("pending local edits resume after reconnect without being replaced", async () => {
  let offline = true;
  const { engine, calls, latest } = setup({
    loadLocal: async () => local("unsent", true, "r1"),
    loadRemote: async () => { if (offline) throw new Error("offline"); return remote("cloud"); },
  });
  await engine.activate({ uid: "A", email: null });
  assert.equal(latest().syncPhase, "error");
  offline = false; await engine.retry(); await tick();
  assert.equal(calls.saves[0][1].profile.fullName, "unsent");
  assert.equal(calls.installs.length, 0);
  engine.stop();
});
test("edits during an active save trigger a second serialized save", async () => {
  const pending = deferred(); let count = 0; const writes = [];
  const { engine, latest } = setup({ save: async (uid, value, revision) => {
    writes.push([value.profile.fullName, revision]);
    if (++count === 1) await pending.promise;
    return { revision: `r${count + 1}`, photo: { id: null, path: null } };
  }});
  await engine.activate({ uid: "A", email: null });
  engine.changed(state("first")); await tick();
  engine.changed(state("second")); await tick();
  assert.equal(writes.length, 1);
  pending.resolve(); await tick();
  assert.deepEqual(writes, [["first", "r1"], ["second", "r2"]]);
  assert.equal(latest().syncPhase, "saved");
  engine.stop();
});
test("sign-out clears the account and late saves cannot restore its screen", async () => {
  const pending = deferred();
  const { engine, latest } = setup({
    loadLocal: async (uid) => local(uid ? "account" : "guest"),
    save: async () => { await pending.promise; return { revision: "r2", photo: { id: null, path: null } }; },
  });
  await engine.activate({ uid: "A", email: null });
  engine.changed(state("account edit")); await tick();
  await engine.activate(null);
  pending.resolve(); await tick();
  assert.equal(latest().account, null);
  assert.equal(latest().state.profile.fullName, "guest");
  assert.equal(latest().syncPhase, "local");
  engine.stop();
});
