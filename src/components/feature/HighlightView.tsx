import { cn } from "@/lib/utils";

const LAYER_HIGHLIGHT: Record<string, string> = {
  l0: "bg-violet-200 dark:bg-violet-900/50 text-violet-900 dark:text-violet-100",
  l1: "bg-cyan-200 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-100",
  l2: "bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100",
  l3: "bg-emerald-200 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100",
  l4: "bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100",
  l5: "bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100",
};

interface HighlightSpan {
  text: string;
  layerSlug: string | null;
  start: number;
  end: number;
}

interface HighlightViewProps {
  spans: HighlightSpan[];
  className?: string;
}

export function HighlightView({ spans, className }: HighlightViewProps) {
  return (
    <p className={cn("leading-relaxed text-gray-800 dark:text-gray-200", className)}>
      {spans.map((span, i) =>
        span.layerSlug ? (
          <mark
            key={i}
            title={span.layerSlug}
            className={cn(
              "rounded px-0.5 font-medium",
              LAYER_HIGHLIGHT[span.layerSlug] ?? "bg-gray-200 dark:bg-gray-700"
            )}
          >
            {span.text}
          </mark>
        ) : (
          <span key={i}>{span.text}</span>
        )
      )}
    </p>
  );
}

export function HighlightLegend({ layerNames }: { layerNames: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(LAYER_HIGHLIGHT).map(([slug, cls]) => (
        <span key={slug} className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", cls)}>
          {layerNames[slug] ?? slug}
        </span>
      ))}
    </div>
  );
}
