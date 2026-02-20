export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, boolean>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return flattenClasses(inputs)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenClasses(inputs: ClassValue[]): string[] {
  const result: string[] = [];
  for (const input of inputs) {
    if (input === null || input === undefined || input === false) continue;
    if (typeof input === "string" && input) result.push(input);
    else if (typeof input === "number") result.push(String(input));
    else if (Array.isArray(input)) result.push(...flattenClasses(input));
    else if (typeof input === "object") {
      for (const [key, val] of Object.entries(input)) {
        if (val) result.push(key);
      }
    }
  }
  return result;
}

export function createHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}
