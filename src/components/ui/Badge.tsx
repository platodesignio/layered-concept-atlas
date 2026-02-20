import { cn } from "@/lib/utils";

const LAYER_BADGE_STYLES: Record<string, string> = {
  l0: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  l1: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  l2: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  l3: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  l4: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  l5: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default"
          ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
        className
      )}
    >
      {children}
    </span>
  );
}

interface LayerBadgeProps {
  slug: string;
  nameJa: string;
  className?: string;
}

export function LayerBadge({ slug, nameJa, className }: LayerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        LAYER_BADGE_STYLES[slug] ?? "bg-gray-100 text-gray-700",
        className
      )}
    >
      {nameJa}
    </span>
  );
}
