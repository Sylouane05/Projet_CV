const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

const root = path.resolve(__dirname, "..");
loadEnvConfig(root);
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, CV_STATIC_HOSTING: "1", SITE_URL: process.env.SITE_URL || "https://cv-builder-214cb.web.app", AI_PUBLIC_ACCESS: "disabled" },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const output = path.join(root, "out");
if (!fs.existsSync(path.join(output, "index.html"))) throw new Error("La page accueil est absente.");
for (const route of ["profile", "library", "resume", "export", "connexion", "inscription"]) {
  if (!fs.existsSync(path.join(output, route, "index.html"))) throw new Error(`La page ${route} est absente de la publication.`);
}
if (!fs.existsSync(path.join(output, "opengraph-image"))) throw new Error("L’aperçu du lien partagé est absent.");
if (fs.existsSync(path.join(output, "api"))) throw new Error("Les routes serveur ne doivent pas faire partie de la publication statique.");
for (const file of fs.readdirSync(output, { recursive: true })) {
  const relative = String(file).replaceAll("\\", "/");
  if (/(^|\/)(\.env[^/]*|artifacts|tests)(\/|$)/.test(relative)) throw new Error("Un fichier privé est présent dans la publication.");
}
console.log("Publication statique prete : accueil, six pages, apercu de partage et assistance IA desactivee.");
