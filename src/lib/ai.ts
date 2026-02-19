import { z } from "zod";

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
