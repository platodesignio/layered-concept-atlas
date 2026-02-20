import { LayerScore } from "./scorer";

export interface MappingRuleInput {
  id: string;
  fromLayerId: string;
  toLayerId: string;
  pattern: string;
  replacement: string;
  condition: string | null;
  priority: number;
}

export interface MappingResult {
  ruleId: string;
  fromLayerId: string;
  toLayerId: string;
  pattern: string;
  replacement: string;
  applied: boolean;
  reason: string;
}

function evaluateCondition(
  condition: string,
  scores: LayerScore[]
): boolean {
  // Simple condition evaluator: "score_l3 > 0.5"
  const match = condition.match(/^score_(\w+)\s*(>|<|>=|<=|==)\s*([\d.]+)$/);
  if (!match) return true;

  const [, layerSlug, op, valueStr] = match;
  const value = parseFloat(valueStr);
  const score = scores.find((s) => s.layerSlug === layerSlug);
  if (!score) return false;

  const s = score.normalizedScore;
  switch (op) {
    case ">": return s > value;
    case "<": return s < value;
    case ">=": return s >= value;
    case "<=": return s <= value;
    case "==": return s === value;
    default: return false;
  }
}

export function applyMappingRules(
  rules: MappingRuleInput[],
  scores: LayerScore[],
  fromLayerId: string,
  toLayerId: string
): MappingResult[] {
  const filtered = rules
    .filter((r) => r.fromLayerId === fromLayerId && r.toLayerId === toLayerId)
    .sort((a, b) => b.priority - a.priority);

  return filtered.map((rule) => {
    const condMet = rule.condition
      ? evaluateCondition(rule.condition, scores)
      : true;

    return {
      ruleId: rule.id,
      fromLayerId: rule.fromLayerId,
      toLayerId: rule.toLayerId,
      pattern: rule.pattern,
      replacement: rule.replacement,
      applied: condMet,
      reason: condMet
        ? `条件を満たしました: ${rule.condition ?? "なし"}`
        : `条件不一致: ${rule.condition}`,
    };
  });
}
