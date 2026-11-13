const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function loadGuard() {
  const output = ts.transpileModule(fs.readFileSync("src/lib/ai-request.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", output)(require, module, module.exports);
  return module.exports;
}
function request(body) { return new Request("http://localhost/api/ai/summary", { method: "POST", body }); }
test("rejects malformed JSON and oversized requests", async () => {
  const { readAiRequest, summaryRequest } = loadGuard();
  assert.equal((await readAiRequest(request("{"), summaryRequest)).response.status, 400);
  assert.equal((await readAiRequest(request("x".repeat(128001)), summaryRequest)).response.status, 413);
});
test("validates fields and accepts a valid summary", async () => {
  const { readAiRequest, summaryRequest } = loadGuard();
  assert.equal((await readAiRequest(request(JSON.stringify({summary: []})), summaryRequest)).response.status, 400);
  const result = await readAiRequest(request(JSON.stringify({style: "concis_ats", language: "fr", summary: "Mon profil"})), summaryRequest);
  assert.equal(result.data.maxLines, 4);
});
test("enforces the shared request budget", async () => {
  const { readAiRequest, summaryRequest } = loadGuard();
  for (let i = 0; i < 10; i++) await readAiRequest(request("{}"), summaryRequest);
  assert.equal((await readAiRequest(request("{}"), summaryRequest)).response.status, 429);
});
test("production access requires explicit activation", async () => {
  const old = process.env.NODE_ENV;
  const access = process.env.AI_PUBLIC_ACCESS;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.AI_PUBLIC_ACCESS;
    const { readAiRequest, summaryRequest } = loadGuard();
    assert.equal((await readAiRequest(request("{}"), summaryRequest)).response.status, 503);
  } finally {
    if (old === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = old;
    if (access === undefined) delete process.env.AI_PUBLIC_ACCESS; else process.env.AI_PUBLIC_ACCESS = access;
  }
});
