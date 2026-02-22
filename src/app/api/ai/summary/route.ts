import OpenAI from "openai";
import { NextResponse } from "next/server";
import { AiSummaryResponseSchema, type SummaryPayload } from "@/lib/ai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY manquante (.env.local)" },
        { status: 500 }
      );
    }

    const payload = (await req.json()) as SummaryPayload;

    const summary = String(payload?.summary ?? "").trim();
    if (!summary) {
      return NextResponse.json({ error: "Résumé vide" }, { status: 400 });
    }

    const maxLines = Math.min(Math.max(payload?.maxLines ?? 4, 2), 6);

    const instruction = `
Tu es un assistant de rédaction de CV.
Objectif: améliorer un résumé de profil en FR, style concis ATS, ${maxLines} lignes max.
Règles strictes:
- N'invente JAMAIS d'expérience, diplôme, chiffres, techno, responsabilité.
- Si une info manque, ajoute un placeholder clair: "[à préciser: ...]".
- Phrase(s) courtes, orientées impact, pas de blabla.
- Doit être crédible et cohérent avec le headline.
Réponds en JSON strict:
{
  "summary_rewritten": string,
  "warnings": string[],
  "placeholders": string[]
}
`;

    const userContent = {
      style: payload.style,
      language: payload.language,
      profile: payload.profile ?? {},
      summary,
      maxLines,
    };

    const resp = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: instruction },
        { role: "user", content: JSON.stringify(userContent) },
      ],
      text: { format: { type: "json_object" } },
    });

    const text = resp.output_text?.trim() ?? "";
    let json: unknown;

    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Réponse IA non-JSON", raw: text }, { status: 502 });
    }

    const parsed = AiSummaryResponseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "JSON IA invalide", issues: parsed.error.issues, raw: json },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed.data);
  } catch (err: any) {
    console.error("AI summary route error:", err);
    return NextResponse.json({ error: err?.message ?? "Erreur serveur" }, { status: 500 });
  }
}