import type { AppState } from "./schema";

export const LIBRARY_TABS = ["experiences", "projects", "skills", "hobbies"] as const;
export type LibraryTab = typeof LIBRARY_TABS[number];
export function libraryTab(value: string | null): LibraryTab {
  return LIBRARY_TABS.find((tab) => tab === value) ?? "experiences";
}
function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").replaceAll("œ", "oe").replaceAll("æ", "ae");
}
/** Match every word, across fields, without changing the original entries. */
export function matchesLibrarySearch(query: string, fields: (string | string[] | undefined)[]) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const haystack = normalize(fields.flat().filter((field) => typeof field === "string").join(" "));
  return terms.every((term) => haystack.includes(term));
}
export function searchLibrary(state: AppState, queries: Record<LibraryTab, string>) {
  return {
    experiences: state.experiences.filter((entry) => matchesLibrarySearch(queries.experiences, [entry.title, entry.company, entry.location, entry.startDate, entry.endDate, entry.bullets, entry.tech, entry.tags])),
    projects: state.projects.filter((entry) => matchesLibrarySearch(queries.projects, [entry.name, entry.role, entry.startDate, entry.endDate, entry.link, entry.bullets, entry.tech, entry.tags])),
    skills: state.skills.filter((entry) => matchesLibrarySearch(queries.skills, [entry.name, entry.domain, entry.level])),
    hobbies: state.hobbies.filter((entry) => matchesLibrarySearch(queries.hobbies, [entry.name])),
  };
}
