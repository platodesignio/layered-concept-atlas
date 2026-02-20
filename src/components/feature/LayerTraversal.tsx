"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LayerBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface LayerEntry {
  id: string;
  content: string;
  layer: {
    id: string;
    slug: string;
    nameJa: string;
    colorClass: string;
    index: number;
  };
}

interface LayerTraversalProps {
  entries: LayerEntry[];
}

const LAYER_BORDER: Record<string, string> = {
  l0: "border-violet-400 dark:border-violet-600",
  l1: "border-cyan-400 dark:border-cyan-600",
  l2: "border-amber-400 dark:border-amber-600",
  l3: "border-emerald-400 dark:border-emerald-600",
  l4: "border-orange-400 dark:border-orange-600",
  l5: "border-blue-400 dark:border-blue-600",
};

const LAYER_BG: Record<string, string> = {
  l0: "bg-violet-50 dark:bg-violet-900/10",
  l1: "bg-cyan-50 dark:bg-cyan-900/10",
  l2: "bg-amber-50 dark:bg-amber-900/10",
  l3: "bg-emerald-50 dark:bg-emerald-900/10",
  l4: "bg-orange-50 dark:bg-orange-900/10",
  l5: "bg-blue-50 dark:bg-blue-900/10",
};

export function LayerTraversal({ entries }: LayerTraversalProps) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set(["l0"]));

  const sorted = [...entries].sort((a, b) => a.layer.index - b.layer.index);

  const toggle = (slug: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {sorted.map((entry) => {
        const open = openSet.has(entry.layer.slug);
        return (
          <div
            key={entry.id}
            className={cn(
              "border-l-4 rounded-r-lg overflow-hidden",
              LAYER_BORDER[entry.layer.slug]
            )}
          >
            <button
              onClick={() => toggle(entry.layer.slug)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3",
                "hover:brightness-95 transition-all",
                LAYER_BG[entry.layer.slug]
              )}
            >
              <LayerBadge slug={entry.layer.slug} nameJa={entry.layer.nameJa} />
              {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>
            {open && (
              <div className="px-4 py-3 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {entry.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
