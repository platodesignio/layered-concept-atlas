import { LayerBadge } from "@/components/ui/Badge";
import { ScoreBar } from "./ScoreBar";
import { cn } from "@/lib/utils";

interface CompareResult {
  conceptId: string;
  slug: string;
  titleJa: string;
  scores: Array<{
    layerSlug: string;
    layerId: string;
    normalizedScore: number;
    matchedTerms: string[];
  }>;
  dominantLayer: string;
  crossoverDegree: number;
  layerEntries: Array<{
    content: string;
    layer: { slug: string; nameJa: string; index: number };
  }>;
}

interface CompareGridProps {
  results: CompareResult[];
  layerNames: Record<string, string>;
  focusLayerSlug?: string;
}

export function CompareGrid({ results, layerNames, focusLayerSlug }: CompareGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        results.length === 2 ? "md:grid-cols-2" : results.length === 3 ? "md:grid-cols-3" : "grid-cols-2"
      )}
    >
      {results.map((r) => {
        const focusEntry = focusLayerSlug
          ? r.layerEntries.find((e) => e.layer.slug === focusLayerSlug)
          : null;

        return (
          <div key={r.conceptId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{r.titleJa}</h3>
              <LayerBadge slug={r.dominantLayer} nameJa={layerNames[r.dominantLayer] ?? r.dominantLayer} />
            </div>

            <ScoreBar scores={r.scores} layerNames={layerNames} />

            {focusEntry && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{focusEntry.layer.nameJa}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{focusEntry.content}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500">
              混線度: {(r.crossoverDegree * 100).toFixed(0)}%
            </p>
          </div>
        );
      })}
    </div>
  );
}
