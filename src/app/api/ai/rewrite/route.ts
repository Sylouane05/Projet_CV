import OpenAI from "openai";
import { NextResponse } from "next/server";
import { AiRewriteResponseSchema, type RewritePayload } from "@/lib/ai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RewritePayload;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY manquante (.env.local)" },
        { status: 500 }
      );
    }
    if (!payload?.bullets?.length) {
      return NextResponse.json({ error: "Aucun bullet fourni" }, { status: 400 });
    }

    const instruction = `
Tu es un assistant de rédaction de CV.
Objectif: réécrire UNIQUEMENT les bullets fournis, en FR, style concis ATS.
Règles strictes:
- N'invente JAMAIS de chiffres, métriques, technos, outils, responsabilités.
- Ne modifie PAS la tech stack (elle sert de contexte seulement).
- Si une info manque, ajoute un placeholder clair: "[à préciser: ...]".
- Conserve le sens et le niveau de vérité.

Réponds en JSON strict avec ce schéma:
{
  "bullets_rewritten": string[],
  "bullets_short": string[] (optionnel),
  "warnings": string[],
  "placeholders": string[]
}
`;

    const userContent = {
      mode: payload.mode,
      style: payload.style,
      language: payload.language,
      context: payload.context,
      bullets: payload.bullets,
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

    const parsed = AiRewriteResponseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "JSON IA invalide", issues: parsed.error.issues, raw: json },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed.data);
    } catch (err: any) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: err?.message ?? "Erreur serveur" }, { status: 500 });
  }

}
