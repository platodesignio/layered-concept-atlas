import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeLayerScores, DictEntry } from "@/lib/engine/scorer";
import { generateHighlightSpans } from "@/lib/engine/highlighter";
import { createHash } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  text: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "analysis");
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { text } = parsed.data;
  const inputHash = createHash(text);

  // Check cache
  const cached = await prisma.run.findFirst({
    where: { inputHash, runType: "analysis" },
    include: { artifacts: true },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    const result = cached.artifacts.reduce(
      (acc, a) => ({ ...acc, [a.key]: a.value }),
      {} as Record<string, unknown>
    );
    return NextResponse.json({ runId: cached.id, cached: true, ...result });
  }

  // Load dictionary
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

  // Compute scores
  const analysisResult = computeLayerScores(text, dictEntries);

  // Highlight spans
  const matchedTerms = analysisResult.scores.flatMap((s) =>
    s.matchedTerms.map((term) => ({
      term,
      layerSlug: s.layerSlug,
      layerId: s.layerId,
    }))
  );
  const highlights = generateHighlightSpans(text, matchedTerms);

  // Persist run
  const run = await prisma.run.create({
    data: {
      runType: "analysis",
      inputHash,
      artifacts: {
        create: [
          { key: "scores", value: analysisResult.scores as unknown as object },
          { key: "dominantLayer", value: analysisResult.dominantLayer },
          { key: "crossoverDegree", value: analysisResult.crossoverDegree },
          { key: "entropy", value: analysisResult.entropy },
          { key: "decompositionHints", value: analysisResult.decompositionHints as unknown as object },
          { key: "highlights", value: highlights as unknown as object },
          { key: "inputText", value: text },
        ],
      },
    },
  });

  return NextResponse.json({
    runId: run.id,
    cached: false,
    scores: analysisResult.scores,
    dominantLayer: analysisResult.dominantLayer,
    crossoverDegree: analysisResult.crossoverDegree,
    entropy: analysisResult.entropy,
    decompositionHints: analysisResult.decompositionHints,
    highlights,
    inputText: text,
  });
}
