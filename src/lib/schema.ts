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

export const ProfileSchema = z.object({
  fullName: z.string().default(""),
  headline: z.string().default(""),
  city: z.string().optional().default(""),
  mobility: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  links: z.array(z.string()).optional().default([]),
  summary: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),

  education: z.array(EducationItemSchema).optional().default([]),
  languages: z.array(LanguageItemSchema).optional().default([]),
  certifications: z.array(CertificationItemSchema).optional().default([]),

  photoAssetId: z.string().nullable().optional().default(null),

  // LinkedIn: username saisi (pas forcément URL)
  linkedinUsername: z.string().optional().default(""),
});

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  company: z.string().default(""),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  bullets: z.array(z.string()).default([]),
  tech: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  role: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  link: z.string().optional().default(""),
  bullets: z.array(z.string()).optional().default([]),
  tech: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  domain: z.string().optional().default("Général"),
  level: z.string().optional().default(""),
});

/** ✅ Hobbies */
export const HobbySchema = z.object({
  id: z.string(),
  name: z.string().default(""),
});

export const ResumeVisibilitySchema = z.object({
  showLinks: z.boolean().default(true),
  showSummary: z.boolean().default(true),
  showSkills: z.boolean().default(true),
  showAtsKeywords: z.boolean().default(true),
  showProjects: z.boolean().default(true),
  showEducation: z.boolean().default(true),
  showLanguages: z.boolean().default(true),
  showCertifications: z.boolean().default(true),
  showHobbies: z.boolean().default(true),
});

export const ResumeSettingsSchema = z.object({
  accentColor: z.string().default("#2563eb"),
  font: z.string().default("inter"),
  density: z.enum(["compact", "normal", "airy"]).default("normal"),
  skillLevels: z.boolean().default(false),
  visibility: ResumeVisibilitySchema.default({}),
});

export const ResumeVariantSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  selectedExperienceIds: z.array(z.string()).default([]),
  selectedProjectIds: z.array(z.string()).default([]),
  selectedSkillIds: z.array(z.string()).default([]),
  atsKeywords: z.array(z.string()).default([]),

  sectionOrder: z
    .array(
      z.enum([
        "SUMMARY",
        "SKILLS",
        "EXPERIENCE",
        "PROJECTS",
        "EDUCATION",
        "LANGUAGES",
        "CERTS",
        "HOBBIES",
      ])
    )
    .default(["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "LANGUAGES", "CERTS", "HOBBIES"]),

  settings: ResumeSettingsSchema.default({}),
});

export const AppStateSchema = z.object({
  version: z.string().default(AppVersion),
  profile: ProfileSchema,
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  skills: z.array(SkillSchema).default([]),

  /** ✅ hobbies */
  hobbies: z.array(HobbySchema).default([]),

  resumeVariants: z.array(ResumeVariantSchema).default([]),
  updatedAt: z.number().default(() => Date.now()),
});

export type AppState = z.infer<typeof AppStateSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Hobby = z.infer<typeof HobbySchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ResumeVariant = z.infer<typeof ResumeVariantSchema>;

export type EducationItem = z.infer<typeof EducationItemSchema>;
export type LanguageItem = z.infer<typeof LanguageItemSchema>;
export type CertificationItem = z.infer<typeof CertificationItemSchema>;