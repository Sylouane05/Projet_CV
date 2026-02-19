import { z } from "zod";

export const AppVersion = "1.0";

export const TagSchema = z.string().min(1);

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""), // ex: "2024-03"
  endDate: z.string().optional().default(""), // ex: "2024-09" ou ""
  bullets: z.array(z.string().min(1)).default([]),
  tech: z.array(z.string().min(1)).default([]),
  tags: z.array(TagSchema).default([]),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  bullets: z.array(z.string().min(1)).default([]),
  tech: z.array(z.string().min(1)).default([]),
  link: z.string().optional().default(""),
  tags: z.array(TagSchema).default([]),
});

export const ProfileSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().min(1),
  city: z.string().optional().default(""),
  mobility: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  links: z.array(z.string().min(1)).default([]),
  summary: z.string().optional().default(""),
  keywords: z.array(z.string().min(1)).default([]),

  // photo stockée séparément dans IndexedDB (assets)
  photoAssetId: z.string().nullable().default(null),
});

export const ResumeVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  selectedExperienceIds: z.array(z.string()).default([]),
  selectedProjectIds: z.array(z.string()).default([]),

  sectionOrder: z.array(z.string()).default([
    "SUMMARY",
    "SKILLS",
    "EXPERIENCE",
    "PROJECTS",
    "EDUCATION",
    "LANGUAGES",
    "CERTS",
  ]),

  settings: z.object({
    accentColor: z.string().default("#2563eb"),
    font: z.string().default("inter"),
    density: z.enum(["compact", "normal", "airy"]).default("normal"),
    skillLevels: z.boolean().default(false),
  }),
});

export const AppStateSchema = z.object({
  version: z.string().default(AppVersion),
  profile: ProfileSchema,
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  resumeVariants: z.array(ResumeVariantSchema).default([]),
  updatedAt: z.number().default(() => Date.now()),
});

export type AppState = z.infer<typeof AppStateSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ResumeVariant = z.infer<typeof ResumeVariantSchema>;
