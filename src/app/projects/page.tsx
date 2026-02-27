import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage({
  searchParams,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchParams: any;
}) {
  const sp: { q?: string; tag?: string; page?: string } = await Promise.resolve(searchParams);
  const q = sp.q ?? "";
  const tag = sp.tag;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    isFrozen: false,
    visibility: { in: ["PUBLIC", "NETWORK_ONLY"] },
  };
  if (tag) where.tags = { has: tag };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, displayName: true, name: true } },
        _count: { select: { votes: true, supports: true, reports: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">プロジェクト</h1>
        <Link href="/projects/new" className="no-underline bg-black text-white px-3 py-1 text-sm">
          + 新規作成
        </Link>
      </div>

      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="検索..."
          className="border border-black px-2 py-1 text-sm flex-1"
        />
        <button type="submit" className="bg-black text-white px-3 py-1 text-sm">検索</button>
      </form>

      <p className="text-sm text-gray-500 mb-3">{total} 件</p>

      <div className="divide-y">
        {projects.map((p) => (
          <div key={p.id} className="py-3">
            <Link href={`/projects/${p.id}`} className="font-medium">{p.title}</Link>
            <p className="text-sm mt-0.5">{p.description.slice(0, 120)}…</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {p.tags.map((t) => (
                <Link key={t} href={`/projects?tag=${t}`} className="text-xs border border-gray-400 px-1 no-underline">
                  {t}
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {p.owner.displayName ?? p.owner.name} · 投票 {p._count.votes} · 支援 {p._count.supports}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 text-sm">
          {page > 1 && <Link href={`/projects?page=${page - 1}&q=${q}`} className="no-underline border px-2 py-1">前へ</Link>}
          <span className="px-2 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`/projects?page=${page + 1}&q=${q}`} className="no-underline border px-2 py-1">次へ</Link>}
        </div>
      )}
    </div>
  );
}
