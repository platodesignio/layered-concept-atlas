import { cn } from "@/lib/utils";

const LAYER_FILL: Record<string, string> = {
  l0: "bg-violet-500",
  l1: "bg-cyan-500",
  l2: "bg-amber-500",
  l3: "bg-emerald-500",
  l4: "bg-orange-500",
  l5: "bg-blue-500",
};

interface LayerScore {
  layerSlug: string;
  layerId: string;
  normalizedScore: number;
  matchedTerms: string[];
}

interface ScoreBarProps {
  scores: LayerScore[];
  layerNames: Record<string, string>;
}

export function ScoreBar({ scores, layerNames }: ScoreBarProps) {
  const sorted = [...scores].sort((a, b) => b.normalizedScore - a.normalizedScore);

  return (
    <div className="space-y-2">
      {sorted.map((s) => (
        <div key={s.layerId}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {layerNames[s.layerSlug] ?? s.layerSlug}
            </span>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {(s.normalizedScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={cn("h-2 rounded-full transition-all", LAYER_FILL[s.layerSlug] ?? "bg-gray-400")}
              style={{ width: `${(s.normalizedScore * 100).toFixed(1)}%` }}
            />
          </div>
          {s.matchedTerms.length > 0 && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              マッチ: {s.matchedTerms.slice(0, 5).join("、")}
              {s.matchedTerms.length > 5 ? ` 他${s.matchedTerms.length - 5}件` : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
