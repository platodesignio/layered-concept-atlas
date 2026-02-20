import {
  normalizeText,
  tokenizeNgram,
  detectNegationRanges,
  isInNegationRange,
} from "./normalize";

export interface DictEntry {
  term: string;
  weight: number;
  isNegation: boolean;
  layerSlug: string;
  layerId: string;
}

export interface LayerScore {
  layerSlug: string;
  layerId: string;
  rawScore: number;
  normalizedScore: number;
  matchedTerms: string[];
}

export interface AnalysisResult {
  scores: LayerScore[];
  dominantLayer: string;
  crossoverDegree: number;
  entropy: number;
  decompositionHints: string[];
  normalizedText: string;
}

export function computeLayerScores(
  inputText: string,
  dictEntries: DictEntry[]
): AnalysisResult {
  const normalized = normalizeText(inputText);
  const negRanges = detectNegationRanges(normalized);

  // Layer -> score accumulator
  const scoreMap: Record<
    string,
    { slug: string; id: string; score: number; terms: Set<string> }
  > = {};

  // Longest-match greedy scanning
  const sortedDict = [...dictEntries].sort(
    (a, b) => b.term.length - a.term.length
  );

  let pos = 0;
  while (pos < normalized.length) {
    let matched = false;
    for (const entry of sortedDict) {
      if (normalized.startsWith(entry.term, pos)) {
        const inNeg = isInNegationRange(pos, negRanges);
        const polarity = inNeg ? -0.5 : 1.0;
        const effectiveWeight = entry.isNegation
          ? -entry.weight
          : entry.weight * polarity;

        if (!scoreMap[entry.layerId]) {
          scoreMap[entry.layerId] = {
            slug: entry.layerSlug,
            id: entry.layerId,
            score: 0,
            terms: new Set(),
          };
        }
        scoreMap[entry.layerId].score += effectiveWeight;
        scoreMap[entry.layerId].terms.add(entry.term);

        pos += entry.term.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // N-gram fallback
      const ngrams = tokenizeNgram(normalized.slice(pos, pos + 4), 2);
      for (const ngram of ngrams) {
        for (const entry of sortedDict) {
          if (entry.term === ngram.surface) {
            const inNeg = isInNegationRange(pos + ngram.start, negRanges);
            const polarity = inNeg ? -0.5 : 1.0;
            const effectiveWeight = entry.isNegation
              ? -entry.weight
              : entry.weight * polarity;

            if (!scoreMap[entry.layerId]) {
              scoreMap[entry.layerId] = {
                slug: entry.layerSlug,
                id: entry.layerId,
                score: 0,
                terms: new Set(),
              };
            }
            scoreMap[entry.layerId].score += effectiveWeight * 0.5; // ngram penalty
            scoreMap[entry.layerId].terms.add(entry.term);
          }
        }
      }
      pos++;
    }
  }

  // Normalize scores
  const totalPositive = Object.values(scoreMap).reduce(
    (sum, v) => sum + Math.max(0, v.score),
    0
  );

  const scores: LayerScore[] = Object.values(scoreMap).map((v) => ({
    layerSlug: v.slug,
    layerId: v.id,
    rawScore: v.score,
    normalizedScore:
      totalPositive > 0 ? Math.max(0, v.score) / totalPositive : 0,
    matchedTerms: Array.from(v.terms),
  }));

  scores.sort((a, b) => b.normalizedScore - a.normalizedScore);

  // Fill in missing layers with 0 score
  const allLayerIds = new Set(dictEntries.map((d) => d.layerId));
  for (const entry of dictEntries) {
    if (!scoreMap[entry.layerId]) {
      scores.push({
        layerSlug: entry.layerSlug,
        layerId: entry.layerId,
        rawScore: 0,
        normalizedScore: 0,
        matchedTerms: [],
      });
    }
  }
  // Deduplicate
  const seen = new Set<string>();
  const dedupedScores = scores.filter((s) => {
    if (seen.has(s.layerId)) return false;
    seen.add(s.layerId);
    return true;
  });
  dedupedScores.sort((a, b) => b.normalizedScore - a.normalizedScore);

  const dominantLayer = dedupedScores[0]?.layerSlug ?? "l0";

  // Crossover degree: how many layers have score > threshold
  const THRESHOLD = 0.15;
  const activeLayers = dedupedScores.filter(
    (s) => s.normalizedScore > THRESHOLD
  );
  const crossoverDegree = activeLayers.length / Math.max(1, allLayerIds.size);

  // Entropy
  const entropy = dedupedScores.reduce((sum, s) => {
    if (s.normalizedScore <= 0) return sum;
    return sum - s.normalizedScore * Math.log2(s.normalizedScore);
  }, 0);

  // Decomposition hints
  const decompositionHints: string[] = [];
  if (crossoverDegree > 0.5) {
    decompositionHints.push(
      "複数の層にまたがる複合概念です。層ごとに分解して検討してください。"
    );
  }
  if (dedupedScores[0]?.normalizedScore > 0.8) {
    decompositionHints.push(
      `この概念は${dedupedScores[0].layerSlug}の性質が強く支配的です。`
    );
  }
  if (negRanges.length > 0) {
    decompositionHints.push(
      "否定表現が含まれており、スコアが調整されています。"
    );
  }

  return {
    scores: dedupedScores,
    dominantLayer,
    crossoverDegree,
    entropy,
    decompositionHints,
    normalizedText: normalized,
  };
}
