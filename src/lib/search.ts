import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "project" | "report" | "stpf" | "user";
  id: string;
  title: string;
  excerpt: string;
};

export async function search(
  query: string,
  limit = 20
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const results: SearchResult[] = [];

  // Project full-text search
  const projects = await prisma.$queryRaw<
    Array<{ id: string; title: string; description: string }>
  >`
    SELECT id, title, description
    FROM projects
    WHERE is_frozen = false
      AND (
        to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${q})
        OR title ILIKE ${"%" + q + "%"}
      )
    LIMIT ${Math.ceil(limit / 3)}
  `;
  for (const p of projects) {
    results.push({
      type: "project",
      id: p.id,
      title: p.title,
      excerpt: p.description.substring(0, 120),
    });
  }

  // Report full-text search
  const reports = await prisma.$queryRaw<
    Array<{ id: string; outcomes: string; project_id: string }>
  >`
    SELECT r.id, r.outcomes, r.project_id
    FROM reports r
    WHERE r.status = 'PUBLISHED'
      AND (
        to_tsvector('english', r.outcomes || ' ' || r.issues || ' ' || r.next_actions) @@ plainto_tsquery('english', ${q})
      )
    LIMIT ${Math.ceil(limit / 3)}
  `;
  for (const r of reports) {
    results.push({
      type: "report",
      id: r.id,
      title: "Report",
      excerpt: r.outcomes.substring(0, 120),
    });
  }

  // STPF node search
  const nodes = await prisma.$queryRaw<
    Array<{ id: string; title: string; type: string }>
  >`
    SELECT id, title, type
    FROM stpf_nodes
    WHERE title ILIKE ${"%" + q + "%"}
    LIMIT ${Math.ceil(limit / 3)}
  `;
  for (const n of nodes) {
    results.push({
      type: "stpf",
      id: n.id,
      title: `[${n.type}] ${n.title}`,
      excerpt: "",
    });
  }

  // User search
  const users = await prisma.$queryRaw<
    Array<{ id: string; name: string | null; display_name: string | null }>
  >`
    SELECT id, name, display_name
    FROM users
    WHERE is_frozen = false
      AND (name ILIKE ${"%" + q + "%"} OR display_name ILIKE ${"%" + q + "%"})
    LIMIT 5
  `;
  for (const u of users) {
    results.push({
      type: "user",
      id: u.id,
      title: u.display_name ?? u.name ?? "Unknown",
      excerpt: "",
    });
  }

  return results.slice(0, limit);
}
