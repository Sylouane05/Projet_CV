import { z } from "zod";

export const AppVersion = "1.0";

export const TagSchema = z.string().min(1);

export const EducationItemSchema = z.object({
  id: z.string(),
  school: z.string().min(1).default(""),
  degree: z.string().min(1).default(""),
  city: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  details: z.string().optional().default(""),
});

export const LanguageItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).default(""),
  level: z.string().optional().default(""),
});

export const CertificationItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).default(""),
  issuer: z.string().optional().default(""),
  year: z.string().optional().default(""),
});

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
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

/** ✅ NEW: Compétence “solide”, indépendante des technos utilisées */
export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  domain: z.string().min(1).default("Général"),
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

  education: z.array(EducationItemSchema).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),

  photoAssetId: z.string().nullable().default(null),
});

export const ResumeVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  selectedExperienceIds: z.array(z.string()).default([]),
  selectedProjectIds: z.array(z.string()).default([]),
  /** ✅ NEW: sélection compétences par variant */
  selectedSkillIds: z.array(z.string()).default([]),

  atsKeywords: z.array(z.string().min(1)).default([]),

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

    visibility: z
      .object({
        showLinks: z.boolean().default(true),
        showSummary: z.boolean().default(true),
        showSkills: z.boolean().default(true),
        showAtsKeywords: z.boolean().default(true),
        showProjects: z.boolean().default(true),
        showEducation: z.boolean().default(true),
        showLanguages: z.boolean().default(true),
        showCertifications: z.boolean().default(true),
      })
      .default({
        showLinks: true,
        showSummary: true,
        showSkills: true,
        showAtsKeywords: true,
        showProjects: true,
        showEducation: true,
        showLanguages: true,
        showCertifications: true,
      }),
  }),
});

export const AppStateSchema = z.object({
  version: z.string().default(AppVersion),
  profile: ProfileSchema,
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  /** ✅ NEW */
  skills: z.array(SkillSchema).default([]),

  resumeVariants: z.array(ResumeVariantSchema).default([]),
  updatedAt: z.number().default(() => Date.now()),
});

export type AppState = z.infer<typeof AppStateSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ResumeVariant = z.infer<typeof ResumeVariantSchema>;

export type EducationItem = z.infer<typeof EducationItemSchema>;
export type LanguageItem = z.infer<typeof LanguageItemSchema>;
export type CertificationItem = z.infer<typeof CertificationItemSchema>;