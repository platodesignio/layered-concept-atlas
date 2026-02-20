"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "p-1.5 rounded-md text-gray-600 dark:text-gray-400",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <PageButton page={1} current={page} onClick={onPageChange} />
          {pages[0] > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageButton key={p} page={p} current={page} onClick={onPageChange} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-gray-400">…</span>
          )}
          <PageButton page={totalPages} current={page} onClick={onPageChange} />
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          "p-1.5 rounded-md text-gray-600 dark:text-gray-400",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function PageButton({
  page,
  current,
  onClick,
}: {
  page: number;
  current: number;
  onClick: (p: number) => void;
}) {
  return (
    <button
      onClick={() => onClick(page)}
      className={cn(
        "min-w-[2rem] h-8 rounded-md text-sm font-medium transition-colors",
        page === current
          ? "bg-violet-600 text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      {page}
    </button>
  );
}
