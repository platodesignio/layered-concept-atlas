import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeLayerScores, DictEntry } from "@/lib/engine/scorer";
import { createHash } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  conceptIds: z.array(z.string()).min(2).max(5),
  layerSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "compare");
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { conceptIds, layerSlug } = parsed.data;
  const inputHash = createHash(JSON.stringify({ conceptIds, layerSlug }));

  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    include: {
      layerEntries: {
        include: { layer: { select: { id: true, slug: true, nameJa: true, index: true } } },
        orderBy: { layer: { index: "asc" } },
      },
    },
  });

  if (concepts.length < 2) {
    return NextResponse.json({ error: "2つ以上の概念が必要です" }, { status: 400 });
  }

  const terms = await prisma.dictionaryTerm.findMany({
    include: { layer: { select: { slug: true } } },
  });
  const dictEntries: DictEntry[] = terms.map((t) => ({
    term: t.term,
    weight: t.weight,
    isNegation: t.isNegation,
    layerSlug: t.layer.slug,
    layerId: t.layerId,
  }));

  const results = concepts.map((concept) => {
    const targetEntries = layerSlug
      ? concept.layerEntries.filter((e) => e.layer.slug === layerSlug)
      : concept.layerEntries;
    const combinedText = targetEntries.map((e) => e.content).join(" ");
    const analysis = computeLayerScores(combinedText, dictEntries);

    return {
      conceptId: concept.id,
      slug: concept.slug,
      titleJa: concept.titleJa,
      layerEntries: concept.layerEntries,
      scores: analysis.scores,
      dominantLayer: analysis.dominantLayer,
      crossoverDegree: analysis.crossoverDegree,
    };
  });

  const run = await prisma.run.create({
    data: {
      runType: "compare",
      inputHash,
      artifacts: {
        create: [{ key: "results", value: results as unknown as object }],
      },
    },
  });

  return NextResponse.json({ runId: run.id, results });
}
