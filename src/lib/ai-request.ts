import { NextResponse } from "next/server";
import { z } from "zod";

const text = z.string().trim().max(2000);
const tags = z.array(text).max(100).default([]);
export const rewriteRequest = z.object({
  mode: z.enum(["rewrite", "shorten_1page"]),
  style: z.literal("concis_ats"), language: z.literal("fr"),
  context: z.object({ kind: z.enum(["experience", "project"]), title: text, org: text, tech: tags }),
  bullets: z.array(text.min(1)).min(1).max(40),
});
export const summaryRequest = z.object({
  style: z.literal("concis_ats"), language: z.literal("fr"),
  profile: z.object({ fullName: text.optional(), headline: text.optional(), target: text.optional() }).default({}),
  summary: text.min(1), maxLines: z.number().int().min(2).max(6).default(4),
});
export const matchRequest = z.object({
  jobOffer: z.string().trim().min(20).max(20000),
  experiences: z.array(z.object({ id: text.min(1), title: text, company: text,
    bullets: z.array(text).max(40).default([]), tech: tags, tags })).max(100),
});

// Instance-wide budget: does not trust caller-supplied IP headers.
let windowStart = 0;
let calls = 0;
export async function readAiRequest<T>(req: Request, schema: z.ZodType<T>) {
  if (process.env.NODE_ENV === "production" && process.env.AI_PUBLIC_ACCESS !== "enabled") {
    return { response: NextResponse.json({ error: "L’assistance IA n’est pas activée sur ce site." }, { status: 503 }) };
  }
  const now = Date.now();
  if (now - windowStart >= 60000) { windowStart = now; calls = 0; }
  if (calls >= 10) return { response: NextResponse.json({ error: "Trop de demandes. Réessaie dans une minute." }, { status: 429, headers: { "Retry-After": "60" } }) };
  calls++;
  const reader = req.body?.getReader();
  if (!reader) return { response: NextResponse.json({ error: "Requête vide." }, { status: 400 }) };
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128000) {
        await reader.cancel();
        return { response: NextResponse.json({ error: "Contenu trop volumineux." }, { status: 413 }) };
      }
      chunks.push(value);
    }
    const parsed = schema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) return { response: NextResponse.json({ error: "Contenu invalide. Vérifie les champs saisis." }, { status: 400 }) };
    return { data: parsed.data };
  } catch {
    return { response: NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 }) };
  } finally { reader.releaseLock(); }
}
