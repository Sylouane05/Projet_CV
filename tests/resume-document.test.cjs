const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const item = { exports: {} };
  new Function("require", "module", "exports", output)(require, item, item.exports);
  return item.exports;
}
const { AppStateSchema } = load("src/lib/schema.ts");
const { default: Document, webLink, dateLabel } = load("src/components/ResumeDocument.tsx");
const fixture = require("./fixtures/resume.cjs");
function render(state, extra = {}) { return renderToStaticMarkup(React.createElement(Document, { state, variantId: "demo", ...extra })); }
test("all missions remain visible in every density, including bracketed text", () => {
  for (const density of ["compact", "normal", "airy"]) {
    const state = AppStateSchema.parse(fixture());
    state.resumeVariants[0].settings.density = density;
    state.experiences[0].bullets = Array.from({length: 12}, (_, i) => `MissionUnique${i} [contexte conservé]`);
    const html = render(state);
    for (let i = 0; i < 12; i++) assert.ok(html.includes(`MissionUnique${i} [contexte conservé]`));
  }
});
test("long sidebars and links are never silently capped", () => {
  const state = AppStateSchema.parse(fixture());
  state.profile.education = Array.from({length: 9}, (_, i) => ({ id: `ed${i}`, school: `SchoolUnique${i}`, degree: "Diplôme", details: "Détails conservés", city: "", startDate: "", endDate: "" }));
  state.profile.links = Array.from({length: 7}, (_, i) => `https://example.org/link${i}`);
  state.hobbies = Array.from({length: 22}, (_, i) => ({ id: `h${i}`, name: `HobbyUnique${i}` }));
  const html = render(state);
  assert.ok(html.includes("SchoolUnique8")); assert.ok(html.includes("example.org/link6")); assert.ok(html.includes("HobbyUnique21"));
});
test("selections and visibility apply without modifying stored data", () => {
  const state = AppStateSchema.parse(fixture());
  state.resumeVariants[0].selectedExperienceIds = ["exp2", "deleted-id"];
  state.resumeVariants[0].settings.visibility.showProjects = false;
  const before = structuredClone(state);
  const html = render(state);
  assert.ok(html.includes("Technicien informatique")); assert.ok(!html.includes("Stage application ingénieur")); assert.ok(!html.includes("Assistant embarqué"));
  assert.deepEqual(state, before);
});
test("web links reject executable schemes and month labels stay deterministic", () => {
  assert.equal(webLink("javascript:alert(1)"), undefined);
  assert.equal(webLink("data:text/html,test"), undefined);
  assert.equal(webLink("example.org/cv"), "https://example.org/cv");
  assert.equal(dateLabel("2025-09"), "sept. 2025"); assert.equal(dateLabel("2025"), "2025");
});
test("content order and skill levels are honored", () => {
  const state = AppStateSchema.parse(fixture());
  state.resumeVariants[0].selectedExperienceIds = ["exp2", "exp1", "exp2"];
  state.resumeVariants[0].settings.skillLevels = true;
  state.skills[0].level = "Confirmé";
  const html = render(state);
  assert.ok(html.indexOf("Technicien informatique") < html.indexOf("Stage application ingénieur"));
  assert.equal((html.match(/Technicien informatique/g) || []).length, 1);
  assert.ok(html.includes("MySQL — Confirmé"));
});

test("incomplete form rows survive saving and stay out of the CV until filled", () => {
  const raw = fixture();
  raw.profile.education.push({ id: "draft-edu", school: "", degree: "" });
  raw.profile.languages.push({ id: "draft-lang", name: "", level: "" });
  raw.profile.certifications.push({ id: "draft-cert", name: "", issuer: "", year: "" });
  const state = AppStateSchema.parse(raw);
  const restored = AppStateSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.profile.education.at(-1).school, "");
  assert.equal(restored.profile.languages.at(-1).name, "");
  const baseline = render(AppStateSchema.parse(fixture()));
  const draft = render(restored);
  assert.equal((draft.match(/<article/g) || []).length, (baseline.match(/<article/g) || []).length);
  assert.equal((draft.match(/<li/g) || []).length, (baseline.match(/<li/g) || []).length);
});
