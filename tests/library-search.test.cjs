const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const output = ts.transpileModule(fs.readFileSync("src/lib/library-search.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleUnderTest = { exports: {} };
new Function("require", "module", "exports", output)(require, moduleUnderTest, moduleUnderTest.exports);
const { matchesLibrarySearch, searchLibrary, libraryTab } = moduleUnderTest.exports;
const queries = () => ({ experiences: "", projects: "", skills: "", hobbies: "" });

test("search ignores case, accents and ligatures but preserves technology symbols", () => {
  assert.equal(matchesLibrarySearch("ELECTRONIQUE coeur", ["Électronique", "Cœur du système"]), true);
  assert.equal(matchesLibrarySearch("C++", ["C++", "C#"]), true);
  assert.equal(matchesLibrarySearch("C++", ["C#"]), false);
  assert.equal(matchesLibrarySearch("   ", []), true);
});
test("every word can match a different field and all words must be present", () => {
  assert.equal(matchesLibrarySearch("lyon python", ["Lyon", ["Python", "SQL"]]), true);
  assert.equal(matchesLibrarySearch("lyon docker", ["Lyon", ["Python", "SQL"]]), false);
});
test("all four library tabs search their relevant fields independently", () => {
  const state = {
    experiences: [{ id: "e", title: "Ingénieur", company: "Atelier", location: "Lyon", bullets: ["Analyser des capteurs"], tech: ["Python"] }],
    projects: [{ id: "p", name: "Plateforme", role: "Développeur", tags: ["Santé"], bullets: ["Mesurer une impédance"], link: "https://example.org" }],
    skills: [{ id: "s", name: "SQL", domain: "Bases de données", level: "Avancé" }],
    hobbies: [{ id: "h", name: "Photographie" }],
  };
  const result = searchLibrary(state, { experiences: "capteurs atelier", projects: "sante impedance", skills: "donnees avance", hobbies: "photo" });
  for (const tab of Object.keys(result)) assert.equal(result[tab].length, 1);
  assert.equal(searchLibrary(state, { ...queries(), projects: "absent" }).experiences.length, 1);
});
test("filtering never changes saved data, entry identity or ordering", () => {
  const state = require("./fixtures/resume.cjs")();
  const before = JSON.stringify(state);
  assert.deepEqual(searchLibrary(state, queries()).experiences.map((e) => e.id), state.experiences.map((e) => e.id));
  assert.equal(searchLibrary(state, queries()).skills[0], state.skills[0]);
  searchLibrary(state, { ...queries(), skills: "not found" });
  assert.equal(JSON.stringify(state), before);
});
test("unknown or missing tab parameters fall back to experiences", () => {
  assert.equal(libraryTab("skills"), "skills");
  assert.equal(libraryTab("invalid"), "experiences");
  assert.equal(libraryTab(null), "experiences");
});
