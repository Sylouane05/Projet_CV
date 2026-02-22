import { z } from "zod";

/** ---------- Bullets (exp/projet) ---------- */
export const AiRewriteResponseSchema = z.object({
  bullets_rewritten: z.array(z.string().min(1)),
  bullets_short: z.array(z.string().min(1)).optional(),
  warnings: z.array(z.string()).default([]),
  placeholders: z.array(z.string()).default([]),
});

export type AiRewriteResponse = z.infer<typeof AiRewriteResponseSchema>;

export type RewriteMode = "rewrite" | "shorten_1page";

export type RewritePayload = {
  mode: RewriteMode;
  style: "concis_ats";
  language: "fr";
  context: {
    kind: "experience" | "project";
    title: string;
    org: string;
    tech: string[];
  };
  bullets: string[];
};

/** ---------- Résumé profil ---------- */
export const AiSummaryResponseSchema = z.object({
  summary_rewritten: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  placeholders: z.array(z.string()).default([]),
});

export type AiSummaryResponse = z.infer<typeof AiSummaryResponseSchema>;

export type SummaryPayload = {
  style: "concis_ats";
  language: "fr";
  profile: {
    fullName?: string;
    headline?: string;
    target?: string; // optionnel: "Stage PFE IA / Data", etc.
  };
  summary: string; // texte brut saisi par l’utilisateur
  maxLines?: number; // default 4
};