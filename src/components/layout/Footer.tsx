import { Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Layers className="h-4 w-4 text-violet-500" />
          <span>Layered Concept Atlas</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          AI非依存・完全決定論的 概念層分解システム
        </p>
      </div>
    </footer>
  );
}
