import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeLayerScores, DictEntry } from "@/lib/engine/scorer";
import { applyMappingRules, MappingRuleInput } from "@/lib/engine/mapper";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  text: z.string().min(1).max(5000),
  fromLayerId: z.string(),
  toLayerId: z.string(),
});

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "mapping");
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { text, fromLayerId, toLayerId } = parsed.data;

  const [terms, rules] = await Promise.all([
    prisma.dictionaryTerm.findMany({ include: { layer: { select: { slug: true } } } }),
    prisma.mappingRule.findMany({ where: { fromLayerId, toLayerId } }),
  ]);

  const dictEntries: DictEntry[] = terms.map((t) => ({
    term: t.term,
    weight: t.weight,
    isNegation: t.isNegation,
    layerSlug: t.layer.slug,
    layerId: t.layerId,
  }));

  const analysis = computeLayerScores(text, dictEntries);
  const ruleInputs: MappingRuleInput[] = rules.map((r) => ({
    id: r.id,
    fromLayerId: r.fromLayerId,
    toLayerId: r.toLayerId,
    pattern: r.pattern,
    replacement: r.replacement,
    condition: r.condition,
    priority: r.priority,
  }));

  const mappingResults = applyMappingRules(ruleInputs, analysis.scores, fromLayerId, toLayerId);

  return NextResponse.json({ scores: analysis.scores, mappings: mappingResults });
}
