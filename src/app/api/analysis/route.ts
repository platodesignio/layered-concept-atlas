export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeLayerScores, DictEntry } from "@/lib/engine/scorer";
import { generateHighlightSpans } from "@/lib/engine/highlighter";
import { createHash } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/authz";

const schema = z.object({
  text: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "analysis");
    if (rl) return rl;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const { text } = parsed.data;
    const inputHash = createHash(text);

    // Determine if user can persist runs
    const user = await getCurrentUser();
    const canPersist = user ? await can(user.id, "run:persist") : false;

    // Check cache (only for users who can persist, or anonymous session cache)
    let cached = null;
    try {
      cached = await prisma.run.findFirst({
        where: {
          inputHash,
          runType: "analysis",
          ...(canPersist ? { userId: user!.id } : { userId: null }),
        },
        include: { artifacts: true },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // runs table not yet created – skip cache lookup
    }
    if (cached) {
      const result = cached.artifacts.reduce(
        (acc, a) => ({ ...acc, [a.key]: a.value }),
        {} as Record<string, unknown>
      );
      return NextResponse.json({ runId: cached.id, cached: true, ...result });
    }

    // Load dictionary
    let terms: { term: string; weight: number; isNegation: boolean; layerId: string; layer: { slug: string } }[] = [];
    try {
      // SYSTEM terms always included; USER terms for Axis users
      const canUserDict = user ? await can(user.id, "dictionary:write") : false;
      const scopeFilter = canUserDict && user
        ? { OR: [{ scope: "SYSTEM" }, { scope: "USER", userId: user.id }] }
        : { scope: "SYSTEM" };

      terms = await prisma.dictionaryTerm.findMany({
        where: scopeFilter as Record<string, unknown>,
        include: { layer: { select: { slug: true } } },
      });
    } catch {
      // dictionary_terms table not yet created
    }

    if (terms.length === 0) {
      return NextResponse.json(
        { error: "辞書データが未登録です。/admin から「マイグレーション実行」→「シードデータ投入」を行ってください。" },
        { status: 503 }
      );
    }

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

    // Persist run only if user has run:persist capability
    let runId = "no-db";
    if (canPersist && user) {
      try {
        const run = await prisma.run.create({
          data: {
            runType: "analysis",
            inputHash,
            userId: user.id,
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
        runId = run.id;
      } catch {
        // Silently skip if persistence fails
      }
    }

    return NextResponse.json({
      runId,
      cached: false,
      persisted: canPersist,
      scores: analysisResult.scores,
      dominantLayer: analysisResult.dominantLayer,
      crossoverDegree: analysisResult.crossoverDegree,
      entropy: analysisResult.entropy,
      decompositionHints: analysisResult.decompositionHints,
      highlights,
      inputText: text,
    });
  } catch (e) {
    console.error("[/api/analysis]", e);
    return NextResponse.json(
      { error: `サーバーエラー: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
