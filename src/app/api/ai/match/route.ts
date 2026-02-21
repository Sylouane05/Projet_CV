import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ReqSchema = z.object({
  jobOffer: z.string().min(20),
  experiences: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      company: z.string(),
      bullets: z.array(z.string()).default([]),
      tech: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
    })
  ),
});

const ResSchema = z.object({
  recommendedExperienceIds: z.array(z.string()).default([]),
  keywordsATS: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY manquante (.env.local)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsedReq = ReqSchema.safeParse(body);
    if (!parsedReq.success) {
      return NextResponse.json(
        { error: "Payload invalide", issues: parsedReq.error.issues },
        { status: 400 }
      );
    }

    const { jobOffer, experiences } = parsedReq.data;

    const instruction = `
Tu es un assistant de sélection de contenu CV (ATS).
Tu reçois: une offre de stage + une liste d'expériences (avec id, titre, entreprise, bullets, tech, tags).
Objectif:
1) Recommander les expériences les plus pertinentes pour cette offre (en renvoyant UNIQUEMENT leurs IDs existants).
2) Proposer une liste de mots-clés ATS (compétences/technos/domaines) STRICTEMENT dérivés de l'offre (pas inventés).
Contraintes:
- N'invente rien sur le candidat.
- Ne crée pas d'IDs.
- Si aucune expérience ne matche, renvoie une liste vide + une note.

Réponds en JSON STRICT avec:
{
  "recommendedExperienceIds": string[],
  "keywordsATS": string[],
  "notes": string[]
}
`;

    const userPayload = {
      jobOffer,
      experiences,
      rule: "Return only IDs that exist in experiences[].id",
    };

    const resp = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: instruction },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      text: { format: { type: "json_object" } },
    });

    const text = resp.output_text?.trim() ?? "";
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Réponse IA non-JSON", raw: text },
        { status: 502 }
      );
    }

    const parsedRes = ResSchema.safeParse(json);
    if (!parsedRes.success) {
      return NextResponse.json(
        { error: "JSON IA invalide", issues: parsedRes.error.issues, raw: json },
        { status: 502 }
      );
    }

    // Sécurité: filtrer IDs inexistants
    const knownIds = new Set(experiences.map((e) => e.id));
    const safeIds = parsedRes.data.recommendedExperienceIds.filter((id) =>
      knownIds.has(id)
    );

    return NextResponse.json({
      ...parsedRes.data,
      recommendedExperienceIds: safeIds,
    });
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const code = err?.code;

    if (status === 429 || code === "insufficient_quota") {
      return NextResponse.json(
        {
          error:
            "Quota OpenAI insuffisant (billing/crédits). Active la facturation ou ajoute des crédits sur ton projet OpenAI, puis réessaie.",
          details: { status, code },
        },
        { status: 429 }
      );
    }

    console.error("AI match route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Erreur serveur" },
      { status: status ?? 500 }
    );
  }
}
